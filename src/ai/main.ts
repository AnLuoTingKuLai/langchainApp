/**
 * ai 模块公共配置：共享 LLM 实例。
 *
 * 对外：export llm、DEFAULT_DEEPSEEK_MODEL。
 * 依赖：VITE_DEEPSEEK_API_KEY（必填）；VITE_DEEPSEEK_MODEL（可选，缺省 deepseek-flash）。
 * 说明：本项目为本地学习用，密钥经 Vite 注入前端，勿用于生产部署。
 * 说明：官方 API 用 deepseek-flash，对应后端 DeepSeek-V4.1-Flash-1017。
 * 说明：默认关闭思考模式；reasoning_effort=low（思考关闭时该参数无实际效果，保留便于以后再开）。
 */
import { initChatModel } from 'langchain/chat_models/universal';

// ====== 公共配置 / 模型 ======

/** 默认 DeepSeek API 模型 ID（后端为 DeepSeek-V4.1-Flash-1017） */
export const DEFAULT_DEEPSEEK_MODEL = 'deepseek-flash';

// 官网示例是 await initChatModel("gpt-5-nano")：按模型名猜 OpenAI，并读 OPENAI_API_KEY。
// 这里是 DeepSeek，且 Key 在 Vite 的 import.meta.env 里，显式指定 modelProvider。
// thinking / reasoning_effort 走 modelKwargs，随请求体发给 DeepSeek（官方默认开思考且 effort=high）。
export const llm = await initChatModel(
  import.meta.env.VITE_DEEPSEEK_MODEL || DEFAULT_DEEPSEEK_MODEL,
  {
    modelProvider: 'deepseek',
    apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
    modelKwargs: {
      thinking: { type: 'disabled' },
      // eslint-disable-next-line camelcase -- DeepSeek API 固定字段
      reasoning_effort: 'low'
    }
  }
);
