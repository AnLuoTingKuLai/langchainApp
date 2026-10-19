<template>
  <!-- 左右布局：左菜单、右页面 -->
  <a-layout class="mainLayout">
    <!-- 左侧：练习菜单 -->
    <SiderMenu />

    <!-- 右侧：当前菜单对应的页面 -->
    <a-layout-content class="mainLayout__content">
      <RouterView />
    </a-layout-content>
  </a-layout>
</template>

<script setup lang="ts">
/**
 * 主布局：左侧练习菜单，右侧渲染当前菜单对应的页面。
 */
import SiderMenu from './components/siderMenu/index.vue';
</script>

<style scoped lang="less">
.mainLayout {
  min-height: 100vh;

  .mainLayout__content {
    box-sizing: border-box;
    padding: 24px;
    background: var(--color-fill-2);
  }
}
</style>
