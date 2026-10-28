/**
 * 按订单编号查询状态的 LangChain tool，以及对应的最终回复 schema。
 *
 * 对外：export queryOrder、QUERY_ORDER_REPLY_SCHEMA、QueryOrderReply。
 * 约束：当前为演示占位实现，返回固定文案；实际项目中替换成订单数据库查询。
 * 说明：执行（tool）与最终输出形状（reply schema）同文件维护，Agent 侧用 toolStrategy 收集。
 */
import { z } from 'zod';
import { tool } from 'langchain';

// ====== 最终回复 Schema ======

/**
 * 本工具对应的最终结构化回复。
 * 模型在调用 query_order 后，用 toolStrategy 填此形状。
 */
export const QUERY_ORDER_REPLY_SCHEMA = z
  .object({
    kind: z.literal('order').describe('固定为 order，表示订单查询结果'),
    orderId: z.string().describe('订单编号'),
    status: z.string().describe('订单状态文案，如已发货')
  })
  .describe('订单查询结果。仅在调用了 query_order 后使用。');

export type QueryOrderReply = z.infer<typeof QUERY_ORDER_REPLY_SCHEMA>

// ====== 工具执行 ======

/**
 * 根据订单编号查询订单状态；用户询问订单进度时由 Agent 调用。
 */
export const queryOrder = tool(
  async ({ orderId }: { orderId: string }): Promise<string> => {
    // 实际项目中替换成订单数据库查询
    return `订单 ${orderId} 的状态：已发货`;
  },
  {
    name: 'query_order',
    description:
      '根据订单编号查询订单状态（发货/物流等）。仅在用户明确提到订单号或询问订单进度时使用；文学/文档问题不要调用。',
    schema: z.object({
      orderId: z.string().describe('订单编号')
    })
  }
);
