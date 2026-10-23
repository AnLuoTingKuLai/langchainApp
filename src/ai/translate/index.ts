/**
 * 翻译调用：经 LangGraph 生成初译与（可选）润色结果。
 *
 * 对外：export streamTranslate、translateGraph、LONG_TEXT_MIN_LENGTH。
 * 约束：图定义见 ./graph.ts；模型用 ../main.ts 的共享 LLM。
 */
import type { TranslateInput, TranslateResult } from './types';

import { translateGraph } from './graph';

// ====== 对外接口 ======

export { translateGraph, LONG_TEXT_MIN_LENGTH } from './graph';
export type { TranslateGraphState } from './graph';
export type { TranslateResult } from './types';

/**
 * 走 translateGraph.invoke，返回初译与润色两份正文。
 * @param input language 为目标语；text 为原文
 * @returns translation 为初译；polished 为润色（短文为空串）
 */
export async function streamTranslate (input: TranslateInput): Promise<TranslateResult> {
  const state = await translateGraph.invoke({
    language: input.language,
    text: input.text,
    translation: '',
    polished: ''
  });

  return {
    translation: state.translation,
    polished: state.polished
  };
}
