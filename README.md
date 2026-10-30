# my-langchain-app

练手 demo：在浏览器里熟悉 LangChain / LangGraph。

这是本地学习项目，**没有中间服务层**。页面不经过 Express、BFF 或自建后端，由 Vue 直接调用 `src/ai` 里的 LangChain。模型密钥通过 Vite 的 `VITE_` 变量打进前端包，只适合本机练习，不要部署到公网。

## 系统说明

Vue 3 + Vite + TypeScript。路由用 Vue Router，状态用 Pinia，UI 用 [Arco Design Vue](https://arco.design/vue/docs/start)。

两条练习链路都在浏览器内执行：

| 页面 | 路径 | 做什么 | 模型 |
|------|------|--------|------|
| 翻译 | `/translate` | LangGraph：先初译，长文再润色 | 本地 Ollama `deepseek-r1:8b` |
| 工具调用 | `/toolCall` | 按意图走文学文本或订单查询，并返回结构化结果 | 云端 `deepseek-flash` |

模型入口在 `src/ai/main.ts` 的 `createLlm`。可传入 `ollama`、`deepseek-flash`、`gemini-3-flash-preview`。未传名字时使用 `.env` 的 `VITE_DEFAULT_MODEL`。

```text
src/
├── ai/            # LangChain / LangGraph（提示词、模型、图、工具）
├── views/         # 翻译页、工具调用页
├── router/        # 路由
├── store/         # Pinia
└── main.ts        # 注册 Arco、Pinia、路由
```

## 启动

需要 Node.js。翻译页还需要本机已安装并运行 [Ollama](https://ollama.com/)，且已拉取 `deepseek-r1:8b`。工具调用页需要 DeepSeek 的 API Key。

```bash
npm install
```

在项目根目录创建 `.env`（该文件已在 `.gitignore` 中，不要提交）：

```bash
# createLlm 未传模型名时使用，值为 ollama / deepseek-flash / gemini-3-flash-preview
VITE_DEFAULT_MODEL=ollama

# 本地 Ollama。浏览器直连该地址，没有 Vite 代理
VITE_OLLAMA_BASE_URL=http://localhost:11434

# 云端 DeepSeek
VITE_DEEPSEEK_API_KEY=

# 可选：Google Gemini
VITE_GEMINI_API_KEY=
```

启动开发服务器：

```bash
npm run dev
```

浏览器打开 [http://localhost:5173](http://localhost:5173)。根路径会进入翻译页。

## 其他命令

```bash
npm run build        # 类型检查并构建
npm run preview      # 预览构建结果
npm run type-check   # 只做类型检查
npm run lint         # ESLint
```
