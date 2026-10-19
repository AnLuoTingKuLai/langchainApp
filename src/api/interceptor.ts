/**
 * axios 全局拦截器：baseURL、超时与基础错误处理。
 * 翻译主流程仍走 LangChain；本层供后续 HTTP API 复用。
 */
import type { AxiosResponse } from 'axios';
import axios from 'axios';
import { Message } from '@arco-design/web-vue';

axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || '';
axios.defaults.timeout = 30_000;

axios.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response: AxiosResponse) => response,
  (error) => {
    const message =
      error?.response?.data?.message ||
      error?.message ||
      '网络请求失败';
    Message.error(message);
    return Promise.reject(error);
  }
);
