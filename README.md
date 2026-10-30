# my-langchain-app

练手 demo：在浏览器里熟悉 LangChain / LangGraph。

这是本地学习项目，**没有中间服务层**。页面不经过 Express、BFF 或自建后端，由 Vue 直接调用 `src/ai` 里的 LangChain。模型密钥通过 Vite 的 `VITE_` 变量打进前端包，只适合本机练习，不要部署到公网。

## 系统说明

Vue 3 + Vite + TypeScript。路由用 Vue Router，状态用 Pinia，UI 用 [Arco Design Vue](https://arco.design/vue/docs/start)。

两条练习链路都在浏览器内执行：

| 页面 | 路径 | 做什么 | 模型 |
|------|------|--------|------|
| 翻译 | `/translate` | LangGraph：先初译，长文再润色 | 本地 Ollama `deepseek-r1:8b` |
| 工具调用 | `/toolCall` | 按意图走文学文本或订单查询，并返回结构化结果 | 默认云端 `gemini-3-flash-preview`，失败后改用 `deepseek-flash` |

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

需要 Node.js。翻译页还需要本机已安装并运行 [Ollama](https://ollama.com/)，且已拉取 `deepseek-r1:8b`。工具调用页默认走 Gemini，失败后改用 DeepSeek，因此这两边的访问凭证要写在本机环境文件里。

```bash
npm install
```

两个环境文件的字段相同，以仓库根目录的 `.env` 为准。`.env` 可以提交：凭证字段留空，模型名和本地地址填好。`.env.develop` 留在本机，字段一样，并填上凭证；该文件已在 `.gitignore` 中，不要提交。文档里不重复抄写凭证字段名。

克隆后把 `.env` 复制为 `.env.develop`，再填值。`npm run dev` 是 `vite --mode develop`，会同时读取这两个文件，同名变量以 `.env.develop` 为准。`npm run build` 与 `npm run preview` 不加载 `.env.develop`。

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
