/**
 * 翻译调用：LangGraph 先初译，长文再润色，并返回两份正文。
 *
 * 对外：export streamTranslate、translateGraph、LONG_TEXT_MIN_LENGTH、TranslateGraphState。
 * 流程：START → translate ─┬─(长文)→ polish → END
 *                         └─(短文)────────→ END
 * 约束：节点内调用 Runnable 须手动透传 config（浏览器无 AsyncLocalStorage）；模型固定走 Ollama，不使用默认模型。
 */
import type { TranslateInput, TranslateResult } from './types';
import type { LangGraphRunnableConfig } from '@langchain/langgraph/web';

import { Annotation, END, START, StateGraph } from '@langchain/langgraph/web';

import { createLlm } from '../main';

export type { TranslateResult } from './types';

// ====== 模型 ======

/** 翻译固定使用本地 Ollama，与工具调用的默认模型分开 */
const llm = await createLlm('ollama');

// ====== 常量 / 配置 ======

/** 原文超过该长度视为长文，初译后再走润色节点 */
export const LONG_TEXT_MIN_LENGTH = 10;

// ====== 状态定义 ======

/** 翻译图状态：原文 + 目标语 → 初译 / 润色两份结果 */
const TranslateState = Annotation.Root({
  /** 目标语言 */
  language: Annotation<string>,
  /** 原文 */
  text: Annotation<string>,
  /** 初译译文 */
  translation: Annotation<string>,
  /** 润色译文；短文不走 polish 时保持空串 */
  polished: Annotation<string>
});

export type TranslateGraphState = typeof TranslateState.State;

// ====== 节点 ======

/**
 * 初译：把原文翻成目标语，写入 translation；config 必须透传。
 */
async function translateNode (
  state: TranslateGraphState,
  config: LangGraphRunnableConfig
) {
  console.log('[ai] translateNode 开始', {
    language: state.language,
    textLength: state.text.length
  });
  const message = await llm.invoke(
    [
      { role: 'system', content: `你是一个翻译助手，把用户输入翻译成${state.language}。` },
      { role: 'user', content: state.text }
    ],
    config
  );

  console.log('[ai] translateNode 完成', { translationLength: message.text.length });
  return { translation: message.text };
}

/**
 * 润色：在初译基础上做通顺度与术语一致性整理，写入 polished，不覆盖 translation。
 */
async function polishNode (
  state: TranslateGraphState,
  config: LangGraphRunnableConfig
) {
  console.log('[ai] polishNode 开始', { translationLength: state.translation.length });
  const message = await llm.invoke(
    [
      {
        role: 'system',
        content: `你是译文润色助手。目标语言：${state.language}。在不改变原意的前提下，让译文更通顺、术语一致。只输出润色后的译文。能翻译成成语就翻译成语`
      },
      { role: 'user', content: state.translation }
    ],
    config
  );

  console.log('[ai] polishNode 完成', { polishedLength: message.text.length });
  return { polished: message.text };
}

// ====== 条件路由 ======

/**
 * 初译后分流：长文走 polish，短文直接结束（保留初译，润色为空）。
 * @returns 下一节点名或 END
 */
function routeAfterTranslate (state: TranslateGraphState) {
  const next = state.text.length > LONG_TEXT_MIN_LENGTH ? 'polish' : END;
  console.log('[ai] routeAfterTranslate', {
    textLength: state.text.length,
    next
  });
  return next;
}

// ====== 图编译 ======

/** 编译后的翻译图：始终初译，长文额外润色，两份结果并存 */
export const translateGraph = new StateGraph(TranslateState)
  // --- 节点（无顺序含义）---
  .addNode('translate', translateNode)
  .addNode('polish', polishNode)
  // --- 边（流程）---
  // START → translate ─?─→ polish → END
  .addEdge(START, 'translate')
  .addConditionalEdges('translate', routeAfterTranslate, ['polish', END])
  .addEdge('polish', END)
  .compile();

// ====== 对外接口 ======

/**
 * 走 translateGraph.invoke，返回初译与润色两份正文。
 * @param input language 为目标语；text 为原文
 * @returns translation 为初译；polished 为润色（短文为空串）
 */
export async function streamTranslate (input: TranslateInput): Promise<TranslateResult> {
  console.log('[ai] streamTranslate 开始', {
    language: input.language,
    textLength: input.text.length
  });
  const state = await translateGraph.invoke({
    language: input.language,
    text: input.text,
    translation: '',
    polished: ''
  });

  console.log('[ai] streamTranslate 完成', {
    translationLength: state.translation.length,
    polishedLength: state.polished.length
  });
  return {
    translation: state.translation,
    polished: state.polished
  };
}
