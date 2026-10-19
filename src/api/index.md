# src/api

HTTP 封装目录（参考 web-admin-movie-engine）：

- `axios.ts`：get / post 便捷方法
- `interceptor.ts`：baseURL、超时与错误提示

翻译主流程仍走 `src/ai` 的 LangChain 链；本目录供后续 REST 接口复用。
环境变量：`VITE_API_BASE_URL`（可选）。
