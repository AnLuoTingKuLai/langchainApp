/**
 * 按路径/URL 拉取纯文本的 LangChain tool、文学分析提示词，以及本分支的执行。
 *
 * 对外：export fetchTextFromUrl、invokeAgent、LITERARY_SYSTEM_PROMPT、FETCH_TEXT_FROM_URL_REPLY_SCHEMA、FetchTextFromUrlReply。
 * 约束：失败时返回错误串（不抛错），交给模型自行说明限制；允许同源相对路径。
 * 说明：执行（tool）、system prompt、reply schema 与 invokeAgent 同文件维护。invokeAgent 用 Gemini，单次失败再换 DeepSeek。
 */
import type { LangGraphRunnableConfig } from '@langchain/langgraph/web';

import { z } from 'zod';
import { MemorySaver } from '@langchain/langgraph/web';
import { createAgent, modelFallbackMiddleware, tool, toolStrategy } from 'langchain';

import { createLlm } from '../../main';
import { CLARIFY_REPLY_SCHEMA } from './clarifyReply';

// ====== 常量 / 配置 ======

/** fetch 超时（毫秒）；大文本或慢网时避免一直挂起 */
const FETCH_TIMEOUT_MS = 120_000;

/** 文学分支主模型；单次调用失败后再换 FALLBACK_LLM_NAME */
const PRIMARY_LLM_NAME = 'gemini-3-flash-preview';

/** Gemini 单次调用失败后的备用模型 */
const FALLBACK_LLM_NAME = 'deepseek-flash';

/** 本分支 checkpointer 线程，与订单分支分开，避免串状态 */
const LITERARY_THREAD_ID = 'tool-call-literary';

/**
 * 文学分支 createAgent 的 system prompt。
 * 只描述这一支：拉用户给出的那一个文本，再填 literary；缺路径时改走 clarify。
 */
export const LITERARY_SYSTEM_PROMPT = `你负责文学/文档分析。调用 fetch_text_from_url 取用户给出的文本，然后用 literary 结构化回复作答。

- 只对用户给出的那一个 URL/路径调用一次工具；不要探测其它路径。
- 工具返回的全文即为完整语料：按换行切分后统计，直接给出数字。
- 找不到目标子串时不要输出 daisyFirstLine。
- 禁止臆造未在工具结果中出现的行数或行号。
- literary 含 gatsbyLineCount、daisyFirstLine、summary、markdown。
- markdown 必须写面向用户的 Markdown 正文（可含标题、列表），内容与结构化字段一致；不要把 JSON 原文塞进 markdown。
- 缺少文档 URL 或路径时改用 clarify，question 向用户追问，不要臆造路径。
- 最终不要用自由散文代替结构化回复。
- 不要输出工具调用流水或过程报告。`;

// ====== 最终回复 Schema ======

/**
 * 本工具对应的最终结构化回复。
 * 模型在调用 fetch_text_from_url 并完成统计后，用 toolStrategy 填此形状。
 */
export const FETCH_TEXT_FROM_URL_REPLY_SCHEMA = z
  .object({
    // z.enum 生成 enum；z.literal 会生成 const，Gemini 函数声明不认 const
    kind: z.enum(['literary']).describe('固定为 literary，表示文学分析结果'),
    gatsbyLineCount: z
      .number()
      .describe('包含子串 Gatsby 的行数（同行多次只计 1）'),
    // nullable 会生成 type 数组，Gemini 的 type 只能是单个类型；未找到时省略字段
    daisyFirstLine: z
      .number()
      .optional()
      .describe('第一个包含 Daisy 的行号（从 1 起）；未找到则不要输出该字段'),
    summary: z.string().describe('两句中性语言概要'),
    // 面向用户展示的 Markdown；与上方结构化字段并存，页面优先渲染此字段
    markdown: z
      .string()
      .describe(
        '面向用户的 Markdown 正文：含行数、行号与概要，可用标题/列表，勿塞原始 JSON'
      )
  })
  .describe(
    '文学/文档分析结果。仅在调用了 fetch_text_from_url 并完成统计后使用。'
  );

export type FetchTextFromUrlReply = z.infer<typeof FETCH_TEXT_FROM_URL_REPLY_SCHEMA>

// ====== 工具执行 ======

/**
 * 按路径/URL 拉取纯文本；失败时返回错误串，交给模型自行说明限制。
 */
export const fetchTextFromUrl = tool(
  async ({ url }: { url: string }): Promise<string> => {
    console.log('[ai] fetch_text_from_url 开始', { url });
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const resp = await fetch(url, {
        signal: controller.signal
      });

      if (!resp.ok) {
        const failed = `Fetch failed: HTTP ${resp.status} ${resp.statusText}`;
        console.log('[ai] fetch_text_from_url 完成', { url, failed });
        return failed;
      }

      const text = await resp.text();
      console.log('[ai] fetch_text_from_url 完成', { url, textLength: text.length });
      return text;
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      const failed = `Fetch failed: ${msg}`;
      console.log('[ai] fetch_text_from_url 完成', { url, failed });
      return failed;
    } finally {
      clearTimeout(timeoutId);
    }
  },
  {
    name: 'fetch_text_from_url',
    description:
      '从同源路径或 URL 拉取文档纯文本，供文学/文档统计、摘要、按行检索。只对用户给出的那一个 URL/路径调用一次，不要探测其它路径；用户未给出路径时不要调用。',
    // 允许同源相对路径；不再强制绝对 URL（本地 public 文件无需远程地址）
    schema: z.object({ url: z.string().min(1) })
  }
);

// ====== 分支执行 ======

/**
 * 跑文学分析 Agent：只挂 fetch_text_from_url，Gemini 优先，失败后同一轮改走 DeepSeek。
 * 每次运行新建 MemorySaver，不把上一问的工具过程留到下一次。
 * @param content 用户原问题
 * @param config 图节点透传的 Runnable config；浏览器无 AsyncLocalStorage，必须带上
 * @returns createAgent 的 invoke 结果，展示字段由上层整理
 */
export async function invokeAgent (
  content: string,
  config: LangGraphRunnableConfig
) {
  console.log('[ai] literary.invokeAgent 开始', {
    contentLength: content.length,
    primary: PRIMARY_LLM_NAME,
    fallback: FALLBACK_LLM_NAME
  });
  const primaryModel = await createLlm(PRIMARY_LLM_NAME);
  const fallbackModel = await createLlm(FALLBACK_LLM_NAME);
  const agent = createAgent({
    model: primaryModel,
    tools: [fetchTextFromUrl],
    systemPrompt: LITERARY_SYSTEM_PROMPT,
    responseFormat: toolStrategy([
      FETCH_TEXT_FROM_URL_REPLY_SCHEMA,
      CLARIFY_REPLY_SCHEMA
    ]),
    middleware: [modelFallbackMiddleware(fallbackModel)],
    checkpointer: new MemorySaver()
  });

  const agentResult = await agent.invoke(
    { messages: [{ role: 'user', content }] },
    {
      ...config,
      configurable: {
        ...config.configurable,
        // LangGraph checkpointer 约定字段名为 thread_id
        // eslint-disable-next-line camelcase -- LangGraph API 固定字段
        thread_id: LITERARY_THREAD_ID
      }
    }
  );
  console.log('[ai] literary.invokeAgent 完成', {
    messageCount: agentResult.messages?.length ?? 0,
    kind: agentResult.structuredResponse && typeof agentResult.structuredResponse === 'object'
      ? (agentResult.structuredResponse as { kind?: string }).kind ?? null
      : null
  });
  return agentResult;
}
