/**
 * ai 模块公共类型。
 * 各业务链（如 translate）的专属类型放在对应子目录的 types.ts。
 */

/** 流式调用通用可选配置（各链可按需扩展） */
export interface StreamCallConfig {
  /** 取消信号 */
  signal?: AbortSignal
}
