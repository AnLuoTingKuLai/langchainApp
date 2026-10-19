/**
 * 翻译链相关类型。
 */
import type { StreamCallConfig } from '../types';

/** 翻译链入参 */
export interface TranslateInput {
  /** 目标语言 */
  language: string
  /** 原文 */
  text: string
}

/** 流式翻译可选配置 */
export type TranslateStreamConfig = StreamCallConfig
