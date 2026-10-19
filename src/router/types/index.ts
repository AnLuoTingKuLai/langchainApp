/**
 * 路由扩展类型：页面标题、排序等菜单元信息。
 */
import type { RouteRecordRaw } from 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    /** 页面标题，用于菜单展示 */
    title?: string;
    /** 为 true 时不出现在左侧菜单 */
    hideInMenu?: boolean;
    /** 菜单排序，数值越小越靠前 */
    order?: number;
    icon?: string;
  }
}

export interface AppRouteRecordRaw extends Omit<RouteRecordRaw, 'component' | 'children'> {
  component?: RouteRecordRaw['component'];
  children?: AppRouteRecordRaw[];
  /** 为 true 时该模块不进入路由表 */
  filterRouter?: boolean;
}
