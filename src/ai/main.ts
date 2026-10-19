/**
 * ai 模块公共配置：共享 LLM 实例。
 *
 * 依赖：VITE_GOOGLE_API_KEY（必填）；VITE_GEMINI_MODEL（可选，缺省 gemini-2.0-flash）。
 * 说明：本项目为本地学习用，密钥经 Vite 注入前端，勿用于生产部署。
 */
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';

// ====== 公共配置 / 模型 ======

/** 默认 Gemini 模型名，可被环境变量覆盖 */
export const DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';

// 模型名可由环境变量覆盖，便于本地切换而不改代码
export const llm = new ChatGoogleGenerativeAI({
  model: import.meta.env.VITE_GEMINI_MODEL || DEFAULT_GEMINI_MODEL,
  apiKey: import.meta.env.VITE_GOOGLE_API_KEY
});
