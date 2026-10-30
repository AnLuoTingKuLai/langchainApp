/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue';
  const component: DefineComponent<object, object, unknown>;
  export default component;
}

interface ImportMetaEnv {
  /** createLlm 未传模型名时使用，值为映射表的 key */
  readonly VITE_DEFAULT_MODEL?: string
  readonly VITE_OLLAMA_API_KEY?: string
  readonly VITE_OLLAMA_MODEL?: string
  readonly VITE_OLLAMA_BASE_URL?: string
  readonly VITE_DEEPSEEK_API_KEY?: string
  readonly VITE_DEEPSEEK_MODEL?: string
  readonly VITE_GOOGLE_API_KEY?: string
  readonly VITE_GEMINI_API_KEY?: string
  readonly VITE_GEMINI_MODEL?: string
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
