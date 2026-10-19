/**
 * ai 模块公共配置：共享 LLM 实例。
 *
 * 对外：export llm、DEFAULT_GEMINI_MODEL。
 * 依赖：VITE_GOOGLE_API_KEY（必填）；VITE_GEMINI_MODEL（可选，缺省 gemini-2.0-flash）。
 * 说明：本项目为本地学习用，密钥经 Vite 注入前端，勿用于生产部署。
 */
import { initChatModel } from 'langchain/chat_models/universal';

// ====== 公共配置 / 模型 ======

/** 默认 Gemini 模型名，可被环境变量覆盖 */
export const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';

// 官网示例是 await initChatModel("gpt-5-nano")：按模型名猜 OpenAI，并读 OPENAI_API_KEY。
// 这里是 Gemini，且 Key 在 Vite 的 import.meta.env 里。
// 模型名以 gemini 开头时，initChatModel 会猜成 Vertex；本项目走 Google AI Studio，所以指定 google-genai。
export const llm = await initChatModel(
  import.meta.env.VITE_GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
  {
    modelProvider: 'google-genai',
    apiKey: import.meta.env.VITE_GOOGLE_API_KEY
  }
);
