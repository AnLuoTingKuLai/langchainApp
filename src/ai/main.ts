/**
 * 多模型启动器：按调用方传入的模型名，从映射表读取该模型自己的环境变量并创建 LLM。
 *
 * 对外：export createLlm、llm、DEFAULT_DEEPSEEK_MODEL。
 * 依赖 .env：VITE_DEFAULT_MODEL 为默认模型名；各模型使用独立变量，避免互相覆盖。
 * 可传入：ollama、deepseek-flash、gemini-3-flash-preview。
 * 说明：本项目为本地学习用，密钥经 Vite 注入前端，勿用于生产部署。
 */
import { initChatModel } from 'langchain/chat_models/universal';

// ====== 类型定义 ======

/** 已接入的模型供应商 */
type AiProvider = 'ollama' | 'deepseek' | 'google-genai';

/** 调用方传入的模型名 */
type LlmName = 'ollama' | 'deepseek-flash' | 'gemini-3-flash-preview';

/** 交给 initChatModel 的第二参数 */
interface LlmInitOption {
  /** 供应商包：ollama / deepseek / google-genai，决定 initChatModel 加载哪个类 */
  modelProvider: AiProvider
  /** 云端密钥；Ollama 本地不需要 */
  apiKey?: string
  /** 请求基址；不配时 DeepSeek、Gemini 走各自官方地址 */
  baseUrl?: string
  /** 仅 Ollama：关闭模型默认的长思考 */
  think?: boolean
  /** DeepSeek 请求体附加参数；关闭思考，避免工具调用和翻译被思考过程拖慢 */
  modelKwargs?: {
    thinking: { type: 'disabled' }
    reasoning_effort: 'low'
  }
}

/** getModelConfig 的返回值：供应商模型 ID + initChatModel 选项 */
interface ModelConfig {
  /** 传给 initChatModel 的第一个参数，是供应商侧的模型 ID，不是调用方传入的名字 */
  modelId: string
  modelFields: LlmInitOption
}

// ====== 环境变量 ======

/**
 * 读取 Vite 注入的环境变量并去掉首尾空白。
 * @param value import.meta.env 中的原始值
 */
function readEnv (value: string | undefined): string {
  return (value || '').trim();
}

// ====== 常量 / 配置 ======

/** .env 未配置 VITE_DEFAULT_MODEL 时的兜底模型名 */
export const DEFAULT_DEEPSEEK_MODEL = 'deepseek-flash';

/**
 * 模型名 → initChatModel 的 modelId 与 modelFields。
 * 新增模型时直接在这里写完整配置，不要和其他模型共用变量名。
 */
const LLM_OPTIONS_MAP: Record<LlmName, ModelConfig> = {
  ollama: {
    // 本地模型 ID 固定；调用方传入的是 ollama，不是这个 ID
    modelId: 'deepseek-r1:8b',
    modelFields: {
      modelProvider: 'ollama',
      // 去掉末尾斜杠，避免和 Ollama 接口路径拼出双斜杠
      baseUrl: readEnv(import.meta.env.VITE_OLLAMA_BASE_URL).replace(/\/$/, ''),
      // deepseek-r1 默认会长思考，工具调用和翻译先关掉
      think: false
    }
  },
  'deepseek-flash': {
    // 云端模型 ID 固定，与映射表 key 相同
    modelId: 'deepseek-flash',
    modelFields: {
      modelProvider: 'deepseek',
      apiKey: readEnv(import.meta.env.VITE_DEEPSEEK_API_KEY),
      modelKwargs: {
        // 官方默认开思考；关闭后下面的 effort 暂无效果，保留便于以后再开
        thinking: { type: 'disabled' },
        // eslint-disable-next-line camelcase -- DeepSeek API 固定字段
        reasoning_effort: 'low'
      }
    }
  },
  'gemini-3-flash-preview': {
    // 云端模型 ID 固定，与映射表 key 相同
    modelId: 'gemini-3-flash-preview',
    modelFields: {
      modelProvider: 'google-genai',
      // Google AI Studio 密钥，不与 DeepSeek、Ollama 共用变量
      apiKey: readEnv(import.meta.env.VITE_GEMINI_API_KEY)
    }
  }
};

/**
 * 判断调用方传入的名字是否已在映射表登记。
 * @param modelName createLlm 收到的模型名
 */
function isLlmName (modelName: string): modelName is LlmName {
  return modelName in LLM_OPTIONS_MAP;
}

/**
 * 按模型名取出 initChatModel 需要的 modelId 和 modelFields。
 * @param modelName ollama、deepseek-flash 或 gemini-3-flash-preview
 */
function getModelConfig (modelName: string | undefined): ModelConfig {
  if (!modelName || !isLlmName(modelName)) {
    throw new Error(`LLM_OPTIONS_MAP 未登记模型 "${modelName || ''}"`);
  }

  return LLM_OPTIONS_MAP[modelName];
}

// ====== 启动器 ======

/**
 * 按模型名创建对应 LLM。三个供应商都走 initChatModel。
 * @param modelName ollama、deepseek-flash 或 gemini-3-flash-preview；空字符串时改用 VITE_DEFAULT_MODEL
 */
export async function createLlm (modelName = '') {
  // 未传模型名时，用 .env 的默认模型名取映射对象
  const config = getModelConfig(modelName || import.meta.env.VITE_DEFAULT_MODEL);
  return await initChatModel(config.modelId, config.modelFields);
}

/** 页面现有链路不传模型名，走 VITE_DEFAULT_MODEL */
export const llm = await createLlm();
