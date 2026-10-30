/**
 * 按订单编号查询状态的 LangChain tool、订单分支提示词，以及本分支的执行。
 *
 * 对外：export queryOrder、invokeAgent、ORDER_SYSTEM_PROMPT、QUERY_ORDER_REPLY_SCHEMA、QueryOrderReply。
 * 约束：当前为演示占位实现，返回固定文案；实际项目中替换成订单数据库查询。
 * 说明：执行（tool）、system prompt、reply schema 与 invokeAgent 同文件维护。invokeAgent 用 Gemini，单次失败再换 DeepSeek。
 */
import type { LangGraphRunnableConfig } from '@langchain/langgraph/web';

import { z } from 'zod';
import { MemorySaver } from '@langchain/langgraph/web';
import { createAgent, modelFallbackMiddleware, tool, toolStrategy } from 'langchain';

import { createLlm } from '../../main';
import { CLARIFY_REPLY_SCHEMA } from './clarifyReply';

// ====== 常量 / 配置 ======

/** 订单分支主模型；单次调用失败后再换 FALLBACK_LLM_NAME */
const PRIMARY_LLM_NAME = 'gemini-3-flash-preview';

/** Gemini 单次调用失败后的备用模型 */
const FALLBACK_LLM_NAME = 'deepseek-flash';

/** 本分支 checkpointer 线程，与文学分支分开，避免串状态 */
const ORDER_THREAD_ID = 'tool-call-order';

/**
 * 订单分支 createAgent 的 system prompt。
 * 只描述这一支：按订单号查询，再填 order；缺订单号时改走 clarify。
 */
export const ORDER_SYSTEM_PROMPT = `你负责订单查询。调用 query_order 查询用户给出的订单，然后用 order 结构化回复作答。

- 用户提到订单号、物流、发货、订单状态时使用 query_order。
- order 含 orderId、status、markdown。
- markdown 必须写面向用户的 Markdown 正文（可含标题、列表），说明订单号与状态，内容与结构化字段一致；不要把 JSON 原文塞进 markdown。
- 缺少订单号时改用 clarify，question 向用户追问，不要臆造订单号。
- 最终不要用自由散文代替结构化回复。
- 不要输出工具调用流水或过程报告。`;

// ====== 最终回复 Schema ======

/**
 * 本工具对应的最终结构化回复。
 * 模型在调用 query_order 后，用 toolStrategy 填此形状。
 */
export const QUERY_ORDER_REPLY_SCHEMA = z
  .object({
    // z.enum 生成 enum；z.literal 会生成 const，Gemini 函数声明不认 const
    kind: z.enum(['order']).describe('固定为 order，表示订单查询结果'),
    orderId: z.string().describe('订单编号'),
    status: z.string().describe('订单状态文案，如已发货'),
    // 面向用户展示的 Markdown；与上方结构化字段并存，页面优先渲染此字段
    markdown: z
      .string()
      .describe(
        '面向用户的 Markdown 正文：说明订单号与状态，可用简短段落或列表，勿塞原始 JSON'
      )
  })
  .describe('订单查询结果。仅在调用了 query_order 后使用。');

export type QueryOrderReply = z.infer<typeof QUERY_ORDER_REPLY_SCHEMA>

// ====== 工具执行 ======

/**
 * 根据订单编号查询订单状态；用户询问订单进度时由 Agent 调用。
 */
export const queryOrder = tool(
  async ({ orderId }: { orderId: string }): Promise<string> => {
    console.log('[ai] query_order 开始', { orderId });
    // 实际项目中替换成订单数据库查询
    const result = `订单 ${orderId} 的状态：已发货`;
    console.log('[ai] query_order 完成', { orderId, result });
    return result;
  },
  {
    name: 'query_order',
    description:
      '根据订单编号查询订单状态（发货/物流等）。仅在用户给出订单号或询问订单进度时使用；没有订单号时不要调用。',
    schema: z.object({
      orderId: z.string().describe('订单编号')
    })
  }
);

// ====== 分支执行 ======

/**
 * 跑订单查询 Agent：只挂 query_order，Gemini 优先，失败后同一轮改走 DeepSeek。
 * 每次运行新建 MemorySaver，不把上一问的工具过程留到下一次。
 * @param content 用户原问题
 * @param config 图节点透传的 Runnable config；浏览器无 AsyncLocalStorage，必须带上
 * @returns createAgent 的 invoke 结果，展示字段由上层整理
 */
export async function invokeAgent (
  content: string,
  config: LangGraphRunnableConfig
) {
  console.log('[ai] order.invokeAgent 开始', {
    contentLength: content.length,
    primary: PRIMARY_LLM_NAME,
    fallback: FALLBACK_LLM_NAME
  });
  const primaryModel = await createLlm(PRIMARY_LLM_NAME);
  const fallbackModel = await createLlm(FALLBACK_LLM_NAME);
  const agent = createAgent({
    model: primaryModel,
    tools: [queryOrder],
    systemPrompt: ORDER_SYSTEM_PROMPT,
    responseFormat: toolStrategy([
      QUERY_ORDER_REPLY_SCHEMA,
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
        thread_id: ORDER_THREAD_ID
      }
    }
  );
  console.log('[ai] order.invokeAgent 完成', {
    messageCount: agentResult.messages?.length ?? 0,
    kind: agentResult.structuredResponse && typeof agentResult.structuredResponse === 'object'
      ? (agentResult.structuredResponse as { kind?: string }).kind ?? null
      : null
  });
  return agentResult;
}
