/**
 * LangChain tools 统一导出。
 * Agent 侧按需从 `@/ai/tools` 引入执行工具与各自 reply schema。
 */
import {
  fetchTextFromUrl,
  FETCH_TEXT_FROM_URL_REPLY_SCHEMA
} from './fetchTextFromUrl';
import { queryOrder, QUERY_ORDER_REPLY_SCHEMA } from './queryOrder';
import { CLARIFY_REPLY_SCHEMA } from './clarifyReply';

import type { FetchTextFromUrlReply } from './fetchTextFromUrl';
import type { QueryOrderReply } from './queryOrder';
import type { ClarifyReply } from './clarifyReply';

export {
  queryOrder,
  QUERY_ORDER_REPLY_SCHEMA,
  fetchTextFromUrl,
  FETCH_TEXT_FROM_URL_REPLY_SCHEMA,
  CLARIFY_REPLY_SCHEMA
};

export type { QueryOrderReply, FetchTextFromUrlReply, ClarifyReply };

/**
 * 各工具（含缺参追问）最终回复 schema 汇总，供 createAgent toolStrategy 使用。
 */
export const TOOL_REPLY_SCHEMAS = [
  FETCH_TEXT_FROM_URL_REPLY_SCHEMA,
  QUERY_ORDER_REPLY_SCHEMA,
  CLARIFY_REPLY_SCHEMA
] as const;

/** Agent 最终结构化回复（三选一） */
export type ToolStructuredResponse =
  | FetchTextFromUrlReply
  | QueryOrderReply
  | ClarifyReply
