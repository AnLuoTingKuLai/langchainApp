/**
 * 路由表：汇总 routes/default 与 routes/modules。
 * 本项目没有登录鉴权，练习页模块直接注册。
 */
import type { RouteRecordRaw } from 'vue-router';
import type { AppRouteRecordRaw } from './types';

import { createRouter, createWebHistory } from 'vue-router';

interface RouteModuleFile {
  default?: AppRouteRecordRaw | AppRouteRecordRaw[];
}

/**
 * 把 glob 读到的路由模块摊平，并按 meta.order 排序。
 */
function formatModules (modules: Record<string, RouteModuleFile>) {
  const result: AppRouteRecordRaw[] = [];

  Object.keys(modules).forEach((key) => {
    const defaultModule = modules[key].default;

    if (!defaultModule) {
      return;
    }

    if (!Array.isArray(defaultModule) && defaultModule.filterRouter) {
      return;
    }

    const moduleList = Array.isArray(defaultModule) ? [...defaultModule] : [defaultModule];

    result.push(...moduleList);
  });

  return result.sort((prevRoute, nextRoute) => {
    const prevOrder = prevRoute.meta?.order ?? 9999;
    const nextOrder = nextRoute.meta?.order ?? 9999;

    return prevOrder - nextOrder;
  });
}

const modules = import.meta.glob('./routes/modules/*.ts', { eager: true });
const appRoutes = formatModules(modules as Record<string, RouteModuleFile>);

const defaultModules = import.meta.glob('./routes/default/*.ts', { eager: true });
const defaultRoutes = formatModules(defaultModules as Record<string, RouteModuleFile>);

const router = createRouter({
  history: createWebHistory(),
  routes: [...defaultRoutes, ...appRoutes] as RouteRecordRaw[]
});

export {
  appRoutes,
  defaultRoutes
};
export default router;
