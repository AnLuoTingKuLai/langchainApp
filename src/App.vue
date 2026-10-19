/**
 * 应用根组件：Arco Layout + 路由出口。
 */
<template>
  <!-- 全页布局：顶栏 + 内容区 -->
  <a-layout class="appShell">
    <!-- 主内容：路由页面 -->
    <a-layout-content class="appShell__content">
      <RouterView />
    </a-layout-content>
  </a-layout>
</template>

<style scoped lang="less">
.appShell {
  min-height: 100vh;
  background: var(--color-fill-2);
  .appShell__content {
    box-sizing: border-box;
    width: 100%;
    max-width: 720px;
    margin: 0 auto;
    padding: 24px 16px;
  }
}
</style>
