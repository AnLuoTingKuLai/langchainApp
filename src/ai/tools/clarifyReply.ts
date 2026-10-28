/**
 * 缺参追问的最终回复 schema（无业务执行函数）。
 *
 * 对外：export CLARIFY_REPLY_SCHEMA、ClarifyReply。
 * 说明：不属于某个业务 tool；订单号/URL 缺失时由 Agent 经 toolStrategy 选用。
 */
import { z } from 'zod';

// ====== 最终回复 Schema ======

/**
 * 缺必要参数时的追问形状；不要臆造订单号或 URL。
 */
export const CLARIFY_REPLY_SCHEMA = z
  .object({
    kind: z.literal('clarify').describe('固定为 clarify，表示需要用户补充信息'),
    question: z.string().describe('向用户追问的简短问题')
  })
  .describe('缺必要参数时的追问，不要臆造订单号或 URL。');

export type ClarifyReply = z.infer<typeof CLARIFY_REPLY_SCHEMA>
