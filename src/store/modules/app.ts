/**
 * 应用偏好：默认目标语言等可持久化配置。
 */
import { defineStore } from 'pinia';
import { ref } from 'vue';

const useAppStore = defineStore('app', () => {
  /** 翻译页默认目标语言，跨刷新保留 */
  const defaultLanguage = ref('中文');

  /**
   * 更新默认目标语言
   * @param language 目标语名称
   */
  function setDefaultLanguage (language: string) {
    defaultLanguage.value = language.trim() || '中文';
  }

  return {
    defaultLanguage,
    setDefaultLanguage
  };
}, {
  persist: true
});

export default useAppStore;
