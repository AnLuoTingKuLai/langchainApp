<template>
  <!-- 工具调用 Demo：说明 + 示例话术 + 任务输入 + 结果 -->
  <div class="toolCallPage">
    <!-- 说明：业务工具路由 + toolStrategy 多 schema 最终回复 -->
    <a-typography-paragraph
      type="secondary"
      class="toolCallPage__desc"
    >
      LangChain <code>createAgent</code> Demo：业务工具
      <code>fetch_text_from_url</code> /
      <code>query_order</code> 按意图选用；最终回复用
      <code>toolStrategy</code> 约束为 literary / order / clarify 三套 Zod schema 之一。
    </a-typography-paragraph>

    <!-- 表单：示例话术、任务文案与提交 -->
    <a-card
      :bordered="true"
      class="toolCallPage__card"
    >
      <a-form
        :model="formModel"
        layout="vertical"
      >
        <!-- 示例话术：一键填入文学或订单任务，便于对比工具路由 -->
        <a-form-item label="示例话术">
          <a-space wrap>
            <a-button
              v-for="item in EXAMPLE_PROMPT_LIST"
              :key="item.key"
              size="small"
              :disabled="loading"
              @click="onPickExample(item.key)"
            >
              {{ item.label }}
            </a-button>
          </a-space>
        </a-form-item>

        <!-- 用户任务：可改成任意文案，观察模型选哪个工具 -->
        <a-form-item
          label="任务"
          field="content"
        >
          <a-textarea
            v-model="formModel.content"
            :auto-size="{ minRows: 8, maxRows: 16 }"
            :disabled="loading"
            allow-clear
          />
        </a-form-item>

        <!-- 提交：loading 或文案为空时禁用 -->
        <a-form-item>
          <a-button
            type="primary"
            :loading="loading"
            :disabled="!formModel.content.trim()"
            @click="onSubmit"
          >
            {{ loading ? '运行中…' : '运行' }}
          </a-button>
        </a-form-item>
      </a-form>
    </a-card>

    <!-- 错误提示：密钥缺失、工具失败或模型报错 -->
    <a-alert
      v-if="error"
      class="toolCallPage__error"
      type="error"
      :title="error"
      closable
      @close="error = ''"
    />

    <!-- 结果区：左 AI 返回 Markdown，右格式化数据 -->
    <div
      v-if="showResultArea"
      class="toolCallPage__results"
    >
      <!-- AI 返回：markdown 字段转 HTML 展示（来源为本机 agent，非任意用户 HTML） -->
      <a-card
        class="toolCallPage__result"
        title="AI 返回"
        :bordered="true"
      >
        <!-- eslint-disable vue/no-v-html -->
        <div
          v-if="agentOutputHtml"
          class="toolCallPage__resultBody"
          v-html="agentOutputHtml"
        />
        <!-- eslint-enable vue/no-v-html -->

        <!-- 尚无正文的加载态：等待首包 -->
        <span
          v-else-if="loading"
          class="toolCallPage__cursor"
        >|</span>
      </a-card>

      <!-- 格式化数据：toolStrategy 产出的结构化对象（JSON） -->
      <a-card
        class="toolCallPage__result"
        title="格式化数据"
        :bordered="true"
      >
        <pre
          v-if="structuredJson"
          class="toolCallPage__jsonBody"
        >{{ structuredJson }}</pre>

        <!-- 尚无结构化结果的加载态 -->
        <span
          v-else-if="loading"
          class="toolCallPage__cursor"
        >|</span>

        <!-- 无 structuredResponse：仅有自由文本回退时 -->
        <a-typography-text
          v-else
          type="secondary"
        >
          无结构化回复
        </a-typography-text>
      </a-card>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * 工具调用 Demo 页：演示业务工具路由 + toolStrategy 结构化最终回复。
 * 链路实现见 `@/ai/toolCall`；页面只负责示例话术、输入、触发与结果展示。
 * 结果区分两栏：格式化数据（结构化对象 JSON）+ AI 返回（markdown → HTML）。
 */
import type { ToolCallStructuredResponse } from '@/ai';

import { marked } from 'marked';
import { computed, reactive, ref } from 'vue';

import * as ai from '@/ai';

// ====== 类型定义 ======

/** 示例话术 key，与 EXAMPLE_PROMPT_LIST 对应 */
type ExamplePromptKey = 'literary' | 'order';

// ====== 常量 / 配置 ======

/** marked：换行转 <br>，同步解析便于直接塞进 computed */
marked.setOptions({ breaks: true, gfm: true });

/**
 * 文学文本示例：应路由到 fetch_text_from_url。
 * 文案刻意缩短约束，避免模型写成冗长「核实/异常报告」。
 */
const LITERARY_EXAMPLE_CONTENT = `本地 public 目录有一份《The Great Gatsby》节选纯文本。
URL: /great-gatsby-excerpt.txt

请用工具拉取该文件后，简洁回答（只答这三点，不要展开过程）：

1) 文件中有多少行包含子串 \`Gatsby\`（按行计数，同一行多次出现只计 1；按换行切分）。
2) 第一个包含 \`Daisy\` 的行号（从 1 起）；若没有则写「未找到」。
3) 用两句中性语言写概要。

以工具返回的文本为完整依据直接计数；不要编造未出现的内容。`;

/** 订单查询示例：应路由到 query_order */
const ORDER_EXAMPLE_CONTENT = '帮我查一下订单 ORD-1001 现在什么状态？有没有发货？';

/** 示例话术按钮：切换默认任务文案，对比两种工具意图 */
const EXAMPLE_PROMPT_LIST = [
  { key: 'literary' as const, label: '文学文本（fetch）' },
  { key: 'order' as const, label: '订单查询（query_order）' }
];

/** key → 任务文案 */
const EXAMPLE_CONTENT_MAP: Record<ExamplePromptKey, string> = {
  literary: LITERARY_EXAMPLE_CONTENT,
  order: ORDER_EXAMPLE_CONTENT
};

// ====== 状态 ======

/** Arco Form model：发给 agent 的用户任务文案 */
const formModel = reactive({
  content: ORDER_EXAMPLE_CONTENT
});
/** toolStrategy 产出的结构化对象；未产出时为 null */
const structuredResponse = ref<ToolCallStructuredResponse | null>(null);
/** AI 面向用户的 Markdown 原文（literary/order 的 markdown 字段） */
const agentOutput = ref('');
/** 请求进行中，阻止重复提交 */
const loading = ref(false);
/** 错误信息 */
const error = ref('');

/** 有结果或加载中时展示结果区 */
const showResultArea = computed(() => {
  return Boolean(
    structuredResponse.value ||
    agentOutput.value ||
    loading.value
  );
});

/** 结构化对象格式化为可读 JSON；无对象时为空串 */
const structuredJson = computed(() => {
  if (!structuredResponse.value) {
    return '';
  }

  return JSON.stringify(structuredResponse.value, null, 2);
});

/** 将 Markdown 转成可 v-html 的 HTML；空串时不渲染正文容器 */
const agentOutputHtml = computed(() => {
  const markdown = agentOutput.value.trim();
  if (!markdown) {
    return '';
  }

  // marked.parse 在 async:false 时返回 string
  return marked.parse(markdown, { async: false }) as string;
});

// ====== 事件处理 ======

/**
 * 填入对应示例话术，方便对比两种工具路由。
 * @param key 示例话术 key
 */
function onPickExample (key: ExamplePromptKey) {
  if (loading.value) return;
  formModel.content = EXAMPLE_CONTENT_MAP[key];
}

/**
 * 运行 createAgent，分别写入格式化数据与 AI Markdown。
 */
async function onSubmit () {
  const content = formModel.content.trim();
  if (!content || loading.value) return;

  if (!import.meta.env.VITE_DEEPSEEK_API_KEY) {
    error.value = '缺少 VITE_DEEPSEEK_API_KEY，请在 .env 中配置';
    return;
  }

  loading.value = true;
  error.value = '';
  structuredResponse.value = null;
  agentOutput.value = '';

  try {
    const result = await ai.runToolCallAgent(content);
    structuredResponse.value = result.structuredResponse;
    agentOutput.value = result.agentOutput;
  } catch (err) {
    const caught = err as Error;
    error.value = caught.message || '运行失败';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped lang="less">
.toolCallPage {
  .toolCallPage__desc {
    margin-bottom: 16px;
  }

  .toolCallPage__card {
    margin-bottom: 16px;
  }

  .toolCallPage__error {
    margin-bottom: 16px;
  }

  .toolCallPage__results {
    display: flex;
    flex-direction: row;
    align-items: stretch;
    gap: 16px;

    @media (max-width: 768px) {
      flex-direction: column;
    }
  }

  .toolCallPage__result {
    flex: 1;
    min-width: 0;
    margin-top: 0;
  }

  .toolCallPage__jsonBody {
    margin: 0;
    padding: 12px;
    overflow-x: auto;
    border-radius: 4px;
    background: var(--color-fill-2);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-word;
    color: var(--color-text-1);
  }

  .toolCallPage__resultBody {
    margin: 0;
    word-break: break-word;
    font-size: 14px;
    line-height: 1.6;
    color: var(--color-text-1);

    :deep(h1),
    :deep(h2),
    :deep(h3),
    :deep(h4) {
      margin: 12px 0 8px;
      font-weight: 600;
      line-height: 1.4;
      color: var(--color-text-1);
    }

    :deep(h1) {
      font-size: 20px;
    }

    :deep(h2) {
      font-size: 18px;
    }

    :deep(h3),
    :deep(h4) {
      font-size: 16px;
    }

    :deep(p) {
      margin: 0 0 8px;
    }

    :deep(ul),
    :deep(ol) {
      margin: 0 0 8px;
      padding-left: 1.5em;
    }

    :deep(li) {
      margin: 4px 0;
    }

    :deep(pre) {
      margin: 8px 0;
      padding: 12px;
      overflow-x: auto;
      border-radius: 4px;
      background: var(--color-fill-2);
      font-size: 13px;
      line-height: 1.5;
    }

    :deep(code) {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    }

    :deep(p code),
    :deep(li code) {
      padding: 1px 4px;
      border-radius: 3px;
      background: var(--color-fill-2);
      font-size: 0.92em;
    }

    :deep(pre code) {
      padding: 0;
      background: transparent;
    }
  }

  .toolCallPage__cursor {
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
