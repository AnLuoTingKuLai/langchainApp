<template>
  <!-- 左侧练习入口：栏目标题 + 路由模块菜单 -->
  <a-layout-sider
    class="siderMenu"
    theme="light"
    :width="220"
  >
    <!-- 栏目标题：标明这里是练习目录 -->
    <div class="siderMenu__brand">
      练习
    </div>

    <a-menu
      :selected-keys="selectedMenuKeys"
      @menu-item-click="onMenuSelect"
    >
      <a-menu-item
        v-for="menuItem in menuList"
        :key="String(menuItem.name)"
      >
        {{ menuItem.meta?.title }}
      </a-menu-item>
    </a-menu>
  </a-layout-sider>
</template>

<script setup lang="ts">
/**
 * 左侧练习菜单：展示 routes/modules 里的模块，点击后进入对应页面。
 */
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';

import { appRoutes } from '@/router';

// ====== 状态 ======

const route = useRoute();
const router = useRouter();

// 带标题且未隐藏的模块，作为左侧练习菜单
const menuList = computed(() => {
  return appRoutes.filter((routeItem) => {
    return Boolean(routeItem.meta?.title) && !routeItem.meta?.hideInMenu;
  });
});

// 当前匹配到的模块名，驱动菜单高亮
const selectedMenuKeys = computed(() => {
  const menuNameSet = new Set(menuList.value.map((menuItem) => String(menuItem.name)));

  return route.matched
    .map((matchedRoute) => matchedRoute.name)
    .filter((routeName): routeName is string => {
      return typeof routeName === 'string' && menuNameSet.has(routeName);
    });
});

// ====== 事件处理 ======

/**
 * 切换练习页：菜单 key 即模块路由 name。
 */
const onMenuSelect = (key: string) => {
  router.push({ name: key });
};
</script>

<style scoped lang="less">
.siderMenu {
  border-right: 1px solid var(--color-border-2);

  .siderMenu__brand {
    height: 48px;
    padding: 0 20px;
    overflow: hidden;
    font-weight: 600;
    line-height: 48px;
    color: var(--color-text-1);
    text-overflow: ellipsis;
    white-space: nowrap;
  }
}
</style>
