<template>
  <!-- 根出口：页面由当前路由决定 -->
  <a-config-provider global>
    <router-view />
  </a-config-provider>
</template>

<script setup lang="ts">
/**
 * 应用根组件：全局配置包住路由出口，布局由路由上的 LAYOUT_MAIN 承担。
 */
</script>
