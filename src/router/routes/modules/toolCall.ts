/**
 * 工具调用 Demo 页路由。新增 demo 时在 modules 下再加一个模块文件。
 */
import type { AppRouteRecordRaw } from '@/router/types';

import { LAYOUT_MAIN } from '@/router/config';

const TOOL_CALL_ROUTER: AppRouteRecordRaw[] = [
  {
    path: '/toolCall',
    name: 'toolCall',
    component: LAYOUT_MAIN,
    // 菜单点的是模块名。不重定向时只会匹配布局，右侧子页面不会渲染
    redirect: {
      name: 'toolCallIndex'
    },
    meta: {
      title: '工具调用',
      order: 2
    },
    children: [
      {
        path: '',
        name: 'toolCallIndex',
        component: () => import('@/views/toolCall/index.vue'),
        meta: {
          title: '工具调用'
        }
      }
    ]
  }
];

export default TOOL_CALL_ROUTER;
