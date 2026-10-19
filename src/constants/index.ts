/**
 * 项目静态枚举：下拉选项与 key 到展示名的映射。
 *
 * 对外：各 *_MAP_LIST、对应类型、getMap*。
 */
import { createLabelMapper } from './mapperFactory';

export interface MapOption {
  key: number | string;
  name: string;
  desc?: string;
  color?: string;
}

// 翻译目标语言 translateLanguage
export const TRANSLATE_LANGUAGE_MAP_LIST = [
  { key: '中文', name: '中文' },
  { key: '英文', name: '英文' }
] as const;

export type TranslateLanguage = (typeof TRANSLATE_LANGUAGE_MAP_LIST)[number]['key'];
export const getMapTranslateLanguage = createLabelMapper(TRANSLATE_LANGUAGE_MAP_LIST);
