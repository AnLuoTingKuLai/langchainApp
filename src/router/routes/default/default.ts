/**
 * 默认路由：根路径进入第一个练习页。
 */
import type { AppRouteRecordRaw } from '@/router/types';

const DEFAULT_ROUTES: AppRouteRecordRaw[] = [
  {
    path: '/',
    name: 'Root',
    meta: {
      order: 999
    },
    redirect: {
      name: 'translateIndex'
    }
  }
];

export default DEFAULT_ROUTES;
