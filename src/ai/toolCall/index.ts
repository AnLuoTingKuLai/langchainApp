/**
 * 工具调用 Demo：Ollama 先判断意图，再由对应分支的 createAgent 执行工具。
 *
 * 对外：export runToolCallAgent。
 * 流程：START → classify ─┬─ literary → END
 *                         ├─ order → END
 *                         └─ clarify → END
 * 约束：分类固定 createLlm('ollama')。执行侧主模型 createLlm('gemini-3-flash-preview')，
 * 单次模型调用失败后由 modelFallbackMiddleware 改用 createLlm('deepseek-flash')。
 * 节点内调用 Runnable 须手动透传 config（浏览器无 AsyncLocalStorage）。
 * 说明：分支执行在各自工具的 invokeAgent 内；这里只分类，并把 invoke 结果整理成展示字段。
 */
import type { BaseMessage } from '@langchain/core/messages';
import type { LangGraphRunnableConfig } from '@langchain/langgraph/web';
import type { ToolCallAgentResult, ToolCallStructuredResponse } from './types';

import { z } from 'zod';
import { AIMessage } from '@langchain/core/messages';
import { Annotation, END, START, StateGraph } from '@langchain/langgraph/web';

import { createLlm } from '../main';
import { invokeAgent as invokeQueryOrderAgent } from './branches/queryOrder';
import { invokeAgent as invokeFetchTextAgent } from './branches/fetchTextFromUrl';

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
 * 分类只产出意图，不取文本、不查订单。
 * 缺 URL 或订单号时归 clarify，由 question 直接追问。
 */
const CLASSIFY_PROMPT = `你只判断用户意图，不调用工具，不回答问题本身。

- literary：文学/文档分析。用户提到文本路径、URL、统计字词行、摘要小说内容，且已经给出路径或 URL。
- order：订单查询。用户提到订单号、物流、发货、订单状态，且已经给出订单号。
- clarify：想做上面两类任务，但缺少文档 URL/路径或订单号；或其他不属于这两类的问题。question 写一句简短追问，不要臆造参数。

intent 只能是 literary、order、clarify 之一。不是 clarify 时 question 填空字符串。`;

/**
 * 分类节点的结构化输出。
 * question 仅在 clarify 时有内容，避免执行分支误用追问文案。
 */
const INTENT_SCHEMA = z.object({
  intent: z
    .enum(['literary', 'order', 'clarify'])
    .describe('literary 文学分析，order 订单查询，clarify 缺参或无法归类'),
  question: z
    .string()
    .describe('intent 为 clarify 时向用户追问的一句话；否则空字符串')
});

// ====== 类型定义 ======

/** Ollama 分类结果：文学、订单，或因缺参而追问 */
type ToolCallIntent = z.infer<typeof INTENT_SCHEMA>['intent']

// ====== 状态定义 ======

/** 工具调用图状态：用户问题 → 意图 → 结构化回复与展示文本 */
const ToolCallState = Annotation.Root({
  /** 用户原问题，分类和执行分支都读它 */
  content: Annotation<string>,
  /** classify 写入的意图；条件边只看这个字段 */
  intent: Annotation<ToolCallIntent>,
  /** clarify 时的追问；literary / order 保持空串，避免和执行结果串用 */
  question: Annotation<string>,
  /** 最终结构化回复；分类阶段还没有结果 */
  structuredResponse: Annotation<ToolCallStructuredResponse | null>,
  /** 页面可直接展示的文本 */
  agentOutput: Annotation<string>
});

type ToolCallGraphState = typeof ToolCallState.State

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
 * 把结构化回复转成页面可展示文本。
 * literary / order 优先用模型填的 markdown；clarify 用 question；否则回退 JSON 代码块。
 * @param structuredResponse toolStrategy 产出的对象
 */
function formatStructuredResponse (
  structuredResponse: ToolCallStructuredResponse
): string {
  if (
    structuredResponse.kind === 'literary' ||
    structuredResponse.kind === 'order'
  ) {
    const markdown = structuredResponse.markdown.trim();
    if (markdown) {
      return markdown;
    }
  }

  if (structuredResponse.kind === 'clarify') {
    return structuredResponse.question;
  }

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

// ====== 节点 ======

/**
 * 用 Ollama 判断意图。不把 URL 或订单号抽出来，参数仍交给执行 Agent。
 */
async function classifyNode (
  state: ToolCallGraphState,
  config: LangGraphRunnableConfig
) {
  console.log('[ai] classify 开始', { contentLength: state.content.length });
  const classifyLlm = await createLlm('ollama');
  const classifyModel = classifyLlm.withStructuredOutput(INTENT_SCHEMA, {
    name: 'classifyIntent'
  });
  const intentResult = await classifyModel.invoke(
    [
      { role: 'system', content: CLASSIFY_PROMPT },
      { role: 'user', content: state.content }
    ],
    config
  );

  const question = intentResult.question.trim();
  console.log('[ai] classify 完成', { intent: intentResult.intent, question });
  return {
    intent: intentResult.intent,
    question
  };
}

/**
 * 把分支结果收成图状态上的两份字段。
 * 有结构化回复时优先用它生成展示文本；没有时退回最后一条 AI 正文。
 * @param agentResult 工具 invokeAgent 的结果，或 clarify 直接写好的结构化回复
 */
function runBranchAgent (agentResult: {
  structuredResponse?: unknown
  messages?: BaseMessage[]
}) {
  const rawStructured = agentResult.structuredResponse;
  const structuredResponse = isToolCallStructuredResponse(rawStructured)
    ? rawStructured
    : null;

  const agentOutput = structuredResponse
    ? formatStructuredResponse(structuredResponse)
    : formatLastMessageContent(agentResult.messages ?? []);
  console.log('[ai] runBranchAgent', {
    kind: structuredResponse?.kind ?? null,
    outputLength: agentOutput.length
  });
  return {
    structuredResponse,
    agentOutput
  };
}

/**
 * 文学分支：执行放在 fetchTextFromUrl 的 invokeAgent，这里只整理返回值。
 */
async function literaryNode (
  state: ToolCallGraphState,
  config: LangGraphRunnableConfig
) {
  console.log('[ai] literary 开始');
  const agentResult = await invokeFetchTextAgent(state.content, config);
  console.log('[ai] literary 完成');
  return runBranchAgent(agentResult);
}

/**
 * 订单分支：执行放在 queryOrder 的 invokeAgent，这里只整理返回值。
 */
async function orderNode (
  state: ToolCallGraphState,
  config: LangGraphRunnableConfig
) {
  console.log('[ai] order 开始');
  const agentResult = await invokeQueryOrderAgent(state.content, config);
  console.log('[ai] order 完成');
  return runBranchAgent(agentResult);
}

/**
 * 缺参分支不再调用云端模型，直接采用分类节点写出的追问。
 */
function clarifyNode (state: ToolCallGraphState) {
  const question = state.question.trim() || '请补充文档路径或订单号。';
  console.log('[ai] clarify', { question });

  return runBranchAgent({
    structuredResponse: {
      kind: 'clarify',
      question
    }
  });
}

// ====== 条件路由 ======

/**
 * 分类后分流到对应执行节点；无法归入两类业务时追问。
 * @returns 下一节点名
 */
function routeAfterClassify (state: ToolCallGraphState) {
  let next: 'literary' | 'order' | 'clarify' = 'clarify';
  if (state.intent === 'literary') {
    next = 'literary';
  } else if (state.intent === 'order') {
    next = 'order';
  }
  console.log('[ai] routeAfterClassify', { intent: state.intent, next });
  return next;
}

// ====== 图编译 ======

/** 编译后的工具调用图：先分类，再进入唯一的执行分支 */
const toolCallGraph = new StateGraph(ToolCallState)
  // --- 节点（注册顺序不代表执行顺序）---
  // classify：Ollama 只判断意图，写出 literary / order / clarify，不拉文本、不查订单
  .addNode('classify', classifyNode)
  // literary：Gemini 优先调用 fetch_text_from_url 并填文学结果，单次失败再换 DeepSeek
  .addNode('literary', literaryNode)
  // order：Gemini 优先调用 query_order 并填订单结果，单次失败再换 DeepSeek
  .addNode('order', orderNode)
  // clarify：直接采用分类节点的追问结束，不再调用云端模型
  .addNode('clarify', clarifyNode)
  // --- 边：START → classify ─┬─ literary → END
  //                          ├─ order ───→ END
  //                          └─ clarify ─→ END
  .addEdge(START, 'classify')
  .addConditionalEdges('classify', routeAfterClassify, ['literary', 'order', 'clarify'])
  .addEdge('literary', END)
  .addEdge('order', END)
  .addEdge('clarify', END)
  .compile();

// ====== 对外接口 ======

/**
 * 运行工具调用图，返回结构化回复与可展示文本。
 * @param content 用户问题（由页面或调用方传入）
 */
export async function runToolCallAgent (
  content: string
): Promise<ToolCallAgentResult> {
  console.log('[ai] runToolCallAgent 开始', { contentLength: content.length });
  const state = await toolCallGraph.invoke({
    content,
    // 占位，classify 会覆盖；避免未分类时条件边读到空意图
    intent: 'clarify',
    question: '',
    structuredResponse: null,
    agentOutput: ''
  });

  console.log('[ai] runToolCallAgent 完成', {
    kind: state.structuredResponse?.kind ?? null,
    outputLength: state.agentOutput.length
  });
  return {
    structuredResponse: state.structuredResponse,
    agentOutput: state.agentOutput
  };
}
