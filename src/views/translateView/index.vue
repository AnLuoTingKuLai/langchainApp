<template>
  <!-- 翻译页：说明 + 表单 + 初译 / 润色双结果 -->
  <div class="translatePage">
    <!-- 说明：浏览器内 LangChain；原文长度 > 阈值时额外润色 -->
    <a-typography-paragraph
      type="secondary"
      class="translatePage__desc"
    >
      输入文本后直接调用浏览器内 LangChain 进行翻译。原文超过 {{ LONG_TEXT_MIN_LENGTH }} 个字符时会在初译后再做润色，两份结果分别展示。
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

    <!-- 结果区：初译与润色分栏展示 -->
    <div
      v-if="showResultArea"
      class="translatePage__results"
    >
      <!-- 原文翻译：始终展示 graph 的 translation -->
      <a-card
        class="translatePage__result"
        title="原文翻译"
        :bordered="true"
      >
        <pre class="translatePage__resultBody">{{ translation }}<span
          v-if="loading && !translation"
          class="translatePage__cursor"
        >|</span></pre>
      </a-card>

      <!-- 润色译文：有内容则展示；短文结束后用次要文案说明未润色 -->
      <a-card
        class="translatePage__result"
        title="润色译文"
        :bordered="true"
      >
        <pre
          v-if="polished"
          class="translatePage__resultBody"
        >{{ polished }}</pre>
        <pre
          v-else-if="loading"
          class="translatePage__resultBody"
        ><span class="translatePage__cursor">|</span></pre>
        <a-typography-paragraph
          v-else
          type="secondary"
          class="translatePage__emptyHint"
        >
          原文未超过 {{ LONG_TEXT_MIN_LENGTH }} 个字符，未进行润色。
        </a-typography-paragraph>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 翻译页：输入原文与目标语言，分栏展示初译与润色译文。
 * 使用 Arco Design 表单、卡片与反馈组件；目标语言与 Pinia app store 同步。
 */
import type { TranslateLanguage } from '@/constants';

import { computed, reactive, ref } from 'vue';

import * as ai from '@/ai';
import { useAppStore } from '@/store';
import { TRANSLATE_LANGUAGE_MAP_LIST } from '@/constants';

// ====== 常量 / 配置 ======

/** 与 graph 同源阈值，说明文案与空态提示共用 */
const LONG_TEXT_MIN_LENGTH = ai.LONG_TEXT_MIN_LENGTH;

// ====== 状态 ======

const appStore = useAppStore();

/** Arco Form model：目标语言与原文 */
const formModel = reactive({
  // 历史自由输入若不在枚举 key 里，回落到第一项，避免下拉没有选中项
  language: resolveTranslateLanguage(appStore.defaultLanguage),
  text: 'hello'
});
/** 初译译文 */
const translation = ref('');
/** 润色译文；短文为空 */
const polished = ref('');
/** 请求进行中，阻止重复提交 */
const loading = ref(false);
/** 错误信息 */
const error = ref('');

/** 有结果或加载中时展示双结果区 */
const showResultArea = computed(() => {
  return Boolean(translation.value || polished.value || loading.value);
});

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
 * 提交翻译：写入初译与润色两份结果
 */
async function onSubmit () {
  const input = formModel.text.trim();
  if (!input || loading.value) return;

  // 提交时再同步一次语言偏好
  appStore.setDefaultLanguage(formModel.language);

  loading.value = true;
  error.value = '';
  translation.value = '';
  polished.value = '';

  try {
    const result = await ai.streamTranslate({
      text: input,
      language: formModel.language || TRANSLATE_LANGUAGE_MAP_LIST[0].key
    });

    translation.value = result.translation;
    polished.value = result.polished;
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

  .translatePage__results {
    display: flex;
    flex-direction: column;
    gap: 16px;
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

  .translatePage__emptyHint {
    margin-bottom: 0;
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
