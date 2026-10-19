/**
 * HTTP 封装：基于 axios 的 get / post 便捷方法。
 * 响应体直接返回 data；拦截器见 interceptor.ts。
 */
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';

/**
 * GET 请求，返回响应 data。
 * @param url 接口路径
 * @param config axios 配置（含 params）
 */
async function get<T = unknown> (url: string, config?: AxiosRequestConfig) {
  const res: AxiosResponse<T> = await axios.get<T>(url, config);
  if (res.data) return res.data;
  return res as unknown as T;
}

/**
 * POST 请求，返回响应 data。
 * @param url 接口路径
 * @param data 请求体
 * @param config axios 配置
 */
async function post<T = unknown, D = unknown> (
  url: string,
  data?: D,
  config?: AxiosRequestConfig<D>
) {
  const res: AxiosResponse<T> = await axios.post<T>(url, data, config);
  if (res.data) return res.data;
  return res as unknown as T;
}

export default {
  get,
  post
};
