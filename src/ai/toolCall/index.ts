/**
 * 工具调用 Demo Agent：按用户意图在「文学文本」与「订单查询」工具间路由，
 * 并用 toolStrategy 约束最终回复为各工具自带的 reply schema 之一。
 *
 * 对外：export runToolCallAgent。
 * 约束：复用 ../main.ts 的共享 LLM；工具与 reply schema 来自 ../tools；checkpointer 用 MemorySaver。
 * 说明：意图路由靠 tool description + system prompt；最终形状靠 toolStrategy(TOOL_REPLY_SCHEMAS)。
 */
import type { ToolCallAgentResult, ToolCallStructuredResponse } from './types';
import type { BaseMessage } from '@langchain/core/messages';

import { createAgent, toolStrategy } from 'langchain';
import { AIMessage } from '@langchain/core/messages';
import { MemorySaver } from '@langchain/langgraph/web';

import { llm } from '../main';
import {
  fetchTextFromUrl,
  queryOrder,
  TOOL_REPLY_SCHEMAS
} from '../tools';

export type {
  ClarifyReply,
  FetchTextFromUrlReply,
  QueryOrderReply,
  ToolCallAgentResult,
  ToolCallStructuredResponse,
  ToolStructuredResponse
} from './types';

// ====== 常量 / 配置 ======

/**
 * 多工具 + 多最终 schema 路由说明。
 * 业务工具负责取数；最终必须调用对应工具的结构化回复 schema 写出答案。
 */
const SYSTEM_PROMPT = `你是一名助手，可按用户意图选用业务工具，并用对应的结构化回复格式作答。

## 业务工具

- \`fetch_text_from_url\`：文学/文档分析。用户提到文本路径、URL、统计字词行、摘要小说内容时使用。
- \`query_order\`：订单查询。用户提到订单号、物流、发货、订单状态时使用。

## 最终回复格式（必须三选一）

业务工具跑完后，选择且只选择一个结构化回复 schema 填写：

- 文学分析完成后 → literary（含 gatsbyLineCount / daisyFirstLine / summary）
- 订单查询完成后 → order（含 orderId / status）
- 缺订单号或文档 URL 等必要参数 → clarify（含 question），不要臆造

## 通用规则

- 只调用与当前问题相关的业务工具；无关工具不要碰。
- 最终不要用自由散文代替结构化回复。
- 不要输出工具调用流水或过程报告。

## 文学文本任务额外规则

- 只对用户给出的那一个 URL/路径调用一次工具；不要探测其它路径。
- 工具返回的全文即为完整语料：按换行切分后统计，直接给出数字。
- 找不到目标子串时 daisyFirstLine 填 null。
- 禁止臆造未在工具结果中出现的行数或行号。`;

// ====== 消息 / 结果解析 ======

/**
 * 从消息中取出可展示正文。
 * DeepSeek 等模型的 contentBlocks 常含 reasoning + text；只展示 text，避免整段 JSON。
 */
function getMessageDisplayText (message: BaseMessage): string {
  const fromText = message.text?.trim();
  if (fromText) {
    return fromText;
  }

  if (typeof message.content === 'string') {
    return message.content;
  }

  return '';
}

/**
 * 取最后一条有正文的 AI 回复（跳过仅含 tool_calls 的中间轮）。
 * @param messages invoke 返回的 messages 数组
 */
function formatLastMessageContent (messages: BaseMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (!AIMessage.isInstance(message)) {
      continue;
    }

    const text = getMessageDisplayText(message);
    if (text) {
      return text;
    }
  }

  return '';
}

/**
 * 把结构化回复格式化成页面可展示的 Markdown（JSON 代码块）。
 * @param structuredResponse toolStrategy 产出的对象
 */
function formatStructuredResponse (
  structuredResponse: ToolCallStructuredResponse
): string {
  return `\`\`\`json\n${JSON.stringify(structuredResponse, null, 2)}\n\`\`\``;
}

/**
 * 判断对象是否为本 Demo 的结构化回复（有 kind 判别字段）。
 */
function isToolCallStructuredResponse (
  value: unknown
): value is ToolCallStructuredResponse {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const kind = (value as { kind?: unknown }).kind;
  return kind === 'literary' || kind === 'order' || kind === 'clarify';
}

// ====== 对外接口 ======

/**
 * 运行工具调用 Demo Agent，返回结构化回复与可展示文本。
 * @param content 用户问题（由页面或调用方传入）
 */
export async function runToolCallAgent (
  content: string
): Promise<ToolCallAgentResult> {
  const checkpointer = new MemorySaver();

  // reply schema 定义在各自工具文件内；此处只汇总进 toolStrategy
  const agent = createAgent({
    model: llm,
    tools: [fetchTextFromUrl, queryOrder],
    systemPrompt: SYSTEM_PROMPT,
    responseFormat: toolStrategy([...TOOL_REPLY_SCHEMAS]),
    checkpointer
  });

  const agentResult = await agent.invoke(
    { messages: [{ role: 'user', content }] },
    // LangGraph checkpointer 约定字段名为 thread_id
    // eslint-disable-next-line camelcase -- LangGraph API 固定字段
    { configurable: { thread_id: 'tool-call-demo' } }
  );

  const rawStructured = agentResult.structuredResponse;
  const structuredResponse = isToolCallStructuredResponse(rawStructured)
    ? rawStructured
    : null;

  return {
    structuredResponse,
    agentOutput: structuredResponse
      ? formatStructuredResponse(structuredResponse)
      : formatLastMessageContent(agentResult.messages ?? [])
  };
}
