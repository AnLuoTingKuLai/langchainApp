/**
 * ai 模块统一导出入口。
 * 页面侧优先从 `@/ai` 引入；公共配置见 main.ts，各业务链见对应子目录。
 */

export { llm, DEFAULT_GEMINI_MODEL } from './main';
export { streamTranslate, translateGraph, LONG_TEXT_MIN_LENGTH } from './translate';
export type { StreamCallConfig } from './types';
export type { TranslateGraphState } from './translate';
export type { TranslateInput, TranslateResult, TranslateStreamConfig } from './translate/types';
