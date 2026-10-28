/**
 * 工具调用 Demo 相关类型。
 */
import type { ToolStructuredResponse } from '../tools';

export type {
  ClarifyReply,
  FetchTextFromUrlReply,
  QueryOrderReply,
  ToolStructuredResponse
} from '../tools';

/** 与历史命名兼容：结构化回复三选一 */
export type ToolCallStructuredResponse = ToolStructuredResponse

/** createAgent 运行结果：结构化回复 + 可展示文本 */
export interface ToolCallAgentResult {
  /** toolStrategy 校验后的结构化对象；未产出时为 null */
  structuredResponse: ToolCallStructuredResponse | null
  /** 便于页面直接展示的文本（优先来自 structuredResponse） */
  agentOutput: string
}
