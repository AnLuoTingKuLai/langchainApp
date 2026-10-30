# my-langchain-app

Vue 3 + Vite 的翻译助手，用来熟悉 LangChain。前端直接调用 LangChain，没有 Express。UI 使用 Arco Design Vue；路由用 Vue Router；状态用 Pinia；样式用 Less。工程约定对齐 `web-admin-movie-engine` 的精简版。

当前只有翻译页（`/`）：输入原文和目标语言，在浏览器里走 Gemini 流式翻译。目标语言会写入 Pinia 并持久化。

目录：

- `src/ai`：LangChain 公共模型与翻译链（`streamTranslate`）
- `src/views/translateView`：翻译页
- `src/api`：axios 封装，供后续 REST 复用；翻译主流程不走这里
- `src/store`：应用偏好（默认目标语言）
- `src/router`：路由表
- `src/components`：跨页面通用组件；页面私有组件不放这里

本地开发：`npm run dev`。改完代码执行 `npm run lint` 与 `npm run type-check`。

环境变量写在仓库根目录的 `.env`（凭证留空，其余已填，可提交）和本机 `.env.develop`（凭证填在这里，不提交）。字段以 `.env` 为准，文档不重复抄写凭证字段名。Vite 只暴露 `VITE_` 前缀。本地学习用，不要部署到公网。

- `VITE_GEMINI_MODEL`：可选，缺省 `gemini-2.0-flash`
- `VITE_API_BASE_URL`：可选，仅 REST 请求使用
