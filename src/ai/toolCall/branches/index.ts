/**
 * 工具调用图的分支实现：每条分支自带工具、提示词、回复 schema 和 invokeAgent。
 * 只给同级 `src/ai/toolCall` 使用，不从 `@/ai` 对外导出。
 */
import {
  fetchTextFromUrl,
  FETCH_TEXT_FROM_URL_REPLY_SCHEMA,
  LITERARY_SYSTEM_PROMPT
} from './fetchTextFromUrl';
import {
  queryOrder,
  ORDER_SYSTEM_PROMPT,
  QUERY_ORDER_REPLY_SCHEMA
} from './queryOrder';
import { CLARIFY_REPLY_SCHEMA } from './clarifyReply';

import type { FetchTextFromUrlReply } from './fetchTextFromUrl';
import type { QueryOrderReply } from './queryOrder';
import type { ClarifyReply } from './clarifyReply';

export {
  queryOrder,
  ORDER_SYSTEM_PROMPT,
  QUERY_ORDER_REPLY_SCHEMA,
  fetchTextFromUrl,
  LITERARY_SYSTEM_PROMPT,
  FETCH_TEXT_FROM_URL_REPLY_SCHEMA,
  CLARIFY_REPLY_SCHEMA
};

export type { QueryOrderReply, FetchTextFromUrlReply, ClarifyReply };

/** Agent 最终结构化回复（三选一） */
export type ToolStructuredResponse =
  | FetchTextFromUrlReply
  | QueryOrderReply
  | ClarifyReply
