/**
 * 翻译链脚本：提示词 + 模型 + 输出解析，支持流式输出。
 *
 * 对外：export streamTranslate，供页面等调用方 await 后 for-await 消费。
 * 依赖：公共 llm（见 ../main.ts）。
 */
import type { TranslateInput, TranslateStreamConfig } from './types';

import { ChatPromptTemplate } from '@langchain/core/prompts';
import { StringOutputParser } from '@langchain/core/output_parsers';

import { llm } from '../main';

// ====== 提示词 ======

// {language} / {text} 须与 streamTranslate 入参字段同名，由 LangChain 按名填充
const prompt = ChatPromptTemplate.fromMessages([
  ['system', '你是一个翻译助手，把用户输入翻译成{language}。'],
  ['human', '{text}']
]);

// ====== 链 ======

// 解析为纯字符串分块，便于前端逐段追加到界面
const chain = prompt.pipe(llm).pipe(new StringOutputParser());

// ====== 对外接口 ======

/**
 * 流式翻译：返回异步可迭代的文本分块，不缓冲完整结果。
 * LangChain 的 chain.stream 返回 Promise，须 await 后再 for-await。
 * @param input language 为目标语；text 为原文
 * @param config 可传 AbortSignal 取消生成
 * @returns 模型增量输出的字符串片段
 */
export function streamTranslate (
  input: TranslateInput,
  config?: TranslateStreamConfig
) {
  return chain.stream(input, config);
}

export type { TranslateInput, TranslateStreamConfig };
