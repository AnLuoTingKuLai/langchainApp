/**
 * 翻译调用：用 role/content 消息数组交给模型一次生成。
 *
 * 对外：export streamTranslate，页面 await 后取完整译文。
 * 约束：模型用 ../main.ts 里 initChatModel 创建的 Gemini 实例。
 * invoke 接受 BaseMessageLike，{ role, content } 会在运行时转成对应消息类。
 */
import type { TranslateInput } from './types';

import { llm } from '../main';

// ====== 对外接口 ======

/**
 * 一次返回完整译文。写法对应官网的 messages + model.invoke。
 * @param input language 为目标语；text 为原文
 * @returns 完整 AIMessage，正文在 message.text
 */
export function streamTranslate (input: TranslateInput) {
  // role: system 规定目标语言；role: user 是原文（user 会转成 HumanMessage）
  return llm.invoke([
    { role: 'system', content: `你是一个翻译助手，把用户输入翻译成${input.language}。` },
    { role: 'user', content: input.text }
  ]);
}
