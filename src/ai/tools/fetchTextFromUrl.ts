/**
 * 按路径/URL 拉取纯文本的 LangChain tool，以及对应的最终回复 schema。
 *
 * 对外：export fetchTextFromUrl、FETCH_TEXT_FROM_URL_REPLY_SCHEMA、FetchTextFromUrlReply。
 * 约束：失败时返回错误串（不抛错），交给模型自行说明限制；允许同源相对路径。
 * 说明：执行（tool）与最终输出形状（reply schema）同文件维护，Agent 侧用 toolStrategy 收集。
 */
import { z } from 'zod';
import { tool } from 'langchain';

// ====== 常量 / 配置 ======

/** fetch 超时（毫秒）；大文本或慢网时避免一直挂起 */
const FETCH_TIMEOUT_MS = 120_000;

// ====== 最终回复 Schema ======

/**
 * 本工具对应的最终结构化回复。
 * 模型在调用 fetch_text_from_url 并完成统计后，用 toolStrategy 填此形状。
 */
export const FETCH_TEXT_FROM_URL_REPLY_SCHEMA = z
  .object({
    kind: z.literal('literary').describe('固定为 literary，表示文学分析结果'),
    gatsbyLineCount: z
      .number()
      .describe('包含子串 Gatsby 的行数（同行多次只计 1）'),
    daisyFirstLine: z
      .number()
      .nullable()
      .describe('第一个包含 Daisy 的行号（从 1 起）；未找到则为 null'),
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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
      const resp = await fetch(url, {
        signal: controller.signal
      });

      if (!resp.ok) {
        return `Fetch failed: HTTP ${resp.status} ${resp.statusText}`;
      }

      return await resp.text();
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return `Fetch failed: ${msg}`;
    } finally {
      clearTimeout(timeoutId);
    }
  },
  {
    name: 'fetch_text_from_url',
    description:
      '从同源路径或 URL 拉取文档纯文本。用于文学/文档统计、摘要、按行检索；用户未提文档路径时不要调用。',
    // 允许同源相对路径；不再强制绝对 URL（本地 public 文件无需远程地址）
    schema: z.object({ url: z.string().min(1) })
  }
);
