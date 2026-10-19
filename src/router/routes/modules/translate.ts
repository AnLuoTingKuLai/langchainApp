/**
 * 翻译练习页路由。新增 demo 时在 modules 下再加一个模块文件。
 */
import type { AppRouteRecordRaw } from '@/router/types';

import { LAYOUT_MAIN } from '@/router/config';

const TRANSLATE_ROUTER: AppRouteRecordRaw[] = [
  {
    path: '/translate',
    name: 'translate',
    component: LAYOUT_MAIN,
    // 菜单点的是模块名。不重定向时只会匹配布局，右侧子页面不会渲染
    redirect: {
      name: 'translateIndex'
    },
    meta: {
      title: '翻译',
      order: 1
    },
    children: [
      {
        path: '',
        name: 'translateIndex',
        component: () => import('@/views/translateView/index.vue'),
        meta: {
          title: '翻译'
        }
      }
    ]
  }
];

export default TRANSLATE_ROUTER;
