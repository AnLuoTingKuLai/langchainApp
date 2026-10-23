/**
 * 翻译 LangGraph：先初译，长文再润色；两份结果都写入 state（浏览器用 /web 入口，避免 async_hooks）。
 *
 * 对外：export translateGraph、LONG_TEXT_MIN_LENGTH。
 * 流程：START → translate ─┬─(长文)→ polish → END
 *                         └─(短文)────────→ END
 * 长文阈值：原文 length > LONG_TEXT_MIN_LENGTH（当前为 10）。
 * 约束：节点内调用 Runnable 须手动透传 config（浏览器无 AsyncLocalStorage）。
 */
import type { LangGraphRunnableConfig } from '@langchain/langgraph/web';

import { Annotation, END, START, StateGraph } from '@langchain/langgraph/web';

import { llm } from '../main';

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
  const message = await llm.invoke(
    [
      { role: 'system', content: `你是一个翻译助手，把用户输入翻译成${state.language}。` },
      { role: 'user', content: state.text }
    ],
    config
  );

  return { translation: message.text };
}

/**
 * 润色：在初译基础上做通顺度与术语一致性整理，写入 polished，不覆盖 translation。
 */
async function polishNode (
  state: TranslateGraphState,
  config: LangGraphRunnableConfig
) {
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

  return { polished: message.text };
}

// ====== 条件路由 ======

/**
 * 初译后分流：长文走 polish，短文直接结束（保留初译，润色为空）。
 * @returns 下一节点名或 END
 */
function routeAfterTranslate (state: TranslateGraphState) {
  if (state.text.length > LONG_TEXT_MIN_LENGTH) {
    return 'polish';
  }
  return END;
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
