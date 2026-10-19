/**
 * 路由表：当前仅翻译页。
 */
import { createRouter, createWebHistory } from 'vue-router';

import TranslateView from '@/views/translateView/index.vue';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/',
      name: 'translate',
      component: TranslateView
    }
  ]
});

export default router;
