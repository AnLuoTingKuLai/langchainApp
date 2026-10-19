<template>
  <!-- 翻译页：说明 + 表单 + 结果 -->
  <div class="translatePage">
    <!-- 说明：浏览器内 LangChain 一次返回完整译文 -->
    <a-typography-paragraph
      type="secondary"
      class="translatePage__desc"
    >
      输入文本后直接调用浏览器内 LangChain 进行翻译。
    </a-typography-paragraph>

    <!-- 表单：目标语言、原文与提交 -->
    <a-card
      :bordered="true"
      class="translatePage__card"
    >
      <a-form
        :model="formModel"
        layout="vertical"
      >
        <!-- 目标语言：下拉只选中文或英文，变更后写入 store，刷新保留 -->
        <a-form-item
          label="目标语言"
          field="language"
        >
          <a-select
            v-model="formModel.language"
            @change="onLanguageChange"
          >
            <a-option
              v-for="item in TRANSLATE_LANGUAGE_MAP_LIST"
              :key="item.key"
              :value="item.key"
            >
              {{ item.name }}
            </a-option>
          </a-select>
        </a-form-item>

        <!-- 原文：翻译中禁用，避免半途改稿 -->
        <a-form-item
          label="原文"
          field="text"
        >
          <a-textarea
            v-model="formModel.text"
            :auto-size="{ minRows: 5, maxRows: 12 }"
            placeholder="输入要翻译的内容"
            :disabled="loading"
            allow-clear
          />
        </a-form-item>

        <!-- 提交：loading 或原文为空时禁用 -->
        <a-form-item>
          <a-button
            type="primary"
            html-type="submit"
            :loading="loading"
            :disabled="!formModel.text.trim()"
            @click="onSubmit"
          >
            {{ loading ? '翻译中…' : '开始翻译' }}
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 错误提示：接口或配置失败时展示 -->
    <a-alert
      v-if="error"
      class="translatePage__error"
      type="error"
      :title="error"
      closable
      @close="error = ''"
    />

    <!-- 译文结果：invoke 返回后整段展示，加载中显示光标 -->
    <a-card
      v-if="result || loading"
      class="translatePage__result"
      title="译文"
      :bordered="true"
    >
      <pre class="translatePage__resultBody">{{ result }}<span
        v-if="loading"
        class="translatePage__cursor"
      >|</span></pre>
    </a-card>
  </div>
</template>

<script setup lang="ts">
/**
 * 翻译页：输入原文与目标语言，展示完整译文。
 * 使用 Arco Design 表单、卡片与反馈组件；目标语言与 Pinia app store 同步。
 */
import type { TranslateLanguage } from '@/constants';

import { reactive, ref } from 'vue';

import * as ai from '@/ai';
import { useAppStore } from '@/store';
import { TRANSLATE_LANGUAGE_MAP_LIST } from '@/constants';

// ====== 状态 ======

const appStore = useAppStore();

/** Arco Form model：目标语言与原文 */
const formModel = reactive({
  // 历史自由输入若不在枚举 key 里，回落到第一项，避免下拉没有选中项
  language: resolveTranslateLanguage(appStore.defaultLanguage),
  text: 'hello'
});
/** 一次返回的完整译文 */
const result = ref('');
/** 请求进行中，阻止重复提交 */
const loading = ref(false);
/** 错误信息 */
const error = ref('');

// ====== 事件处理 ======

/**
 * 把已保存的语言收成枚举 key。
 * @param language store 里的目标语言，可能是旧的自由输入
 * @returns 命中的 key；未命中时用列表第一项
 */
function resolveTranslateLanguage (language: string): TranslateLanguage {
  const matched = TRANSLATE_LANGUAGE_MAP_LIST.find((item) => item.key === language);
  if (matched) return matched.key;
  return TRANSLATE_LANGUAGE_MAP_LIST[0].key;
}

/**
 * 目标语言变更时写入 store，便于下次进入页面复用
 */
function onLanguageChange () {
  appStore.setDefaultLanguage(formModel.language);
}

/**
 * 提交翻译：await invoke 的完整消息，把正文写入 result
 */
async function onSubmit () {
  const input = formModel.text.trim();
  if (!input || loading.value) return;

  if (!import.meta.env.VITE_GOOGLE_API_KEY) {
    error.value = '缺少 VITE_GOOGLE_API_KEY，请在 .env 中配置';
    return;
  }

  // 提交时再同步一次语言偏好
  appStore.setDefaultLanguage(formModel.language);

  loading.value = true;
  error.value = '';
  result.value = '';

  try {
    // llm.invoke 一次返回完整 AIMessage，正文在 text
    debugger;
    const message = await ai.streamTranslate({
      text: input,
      language: formModel.language || TRANSLATE_LANGUAGE_MAP_LIST[0].key
    });
    debugger;

    result.value = message.text;
  } catch (err) {
    const caught = err as Error;
    error.value = caught.message || '翻译失败';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="less">
.translatePage {
  .translatePage__desc {
    margin-bottom: 16px;
  }

  .translatePage__card {
    margin-bottom: 16px;
  }

  .translatePage__error {
    margin-bottom: 16px;
  }

  .translatePage__result {
    margin-top: 0;
  }

  .translatePage__resultBody {
    margin: 0;
    white-space: pre-wrap;
    word-break: break-word;
    font-family: inherit;
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text-1);
  }

  .translatePage__cursor {
    animation: blink 1s step-end infinite;
    color: rgb(var(--primary-6));
  }
}

@keyframes blink {
  50% {
    opacity: 0;
  }
}
</style>
