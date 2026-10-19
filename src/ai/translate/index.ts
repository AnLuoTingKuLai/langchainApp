/**
 * 翻译调用：按官网入门写法组 SystemMessage / HumanMessage，再交给模型一次生成。
 *
 * 对外：export streamTranslate，页面 await 后取完整译文。
 * 约束：模型用 ../main.ts 里 initChatModel 创建的 Gemini 实例。
 */
import type { TranslateInput } from './types';

import { HumanMessage, SystemMessage } from '@langchain/core/messages';

import { llm } from '../main';

// ====== 对外接口 ======

/**
 * 一次返回完整译文。写法对应官网的 messages + model.invoke。
 * @param input language 为目标语；text 为原文
 * @returns 完整 AIMessage，正文在 message.text
 */
export function streamTranslate (input: TranslateInput) {
  // 系统角色：规定翻译目标语言，内容随本次入参变化
  const systemMsg = new SystemMessage(`你是一个翻译助手，把用户输入翻译成${input.language}。`);
  // 用户原文
  const humanMsg = new HumanMessage(input.text);

  const messages = [systemMsg, humanMsg];

  // 一次返回完整 AIMessage，页面直接展示正文
  return llm.invoke(messages);
}
