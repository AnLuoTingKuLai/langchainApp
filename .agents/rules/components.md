---
description: "组件规则描述"
globs: src/**/*.vue, src/components/**/*, src/layout/**/*
alwaysApply: false
---

# 组件开发和使用规则

## 规则引用

组件开发必须同时遵循以下规则文件：

- **格式规则**：`format.md`（缩进、命名、导入、TypeScript、Vue 规范）
- **样式规则**：`styling.md`（scoped 样式、组件库样式覆盖）
- **备注规则**：`comments.md`（文件头、分区标题、模板注释、JSDoc）

## 基本原则

- 新组件用 Vue 3 Composition API + `<script setup>`。
- `.vue` 块顺序为 `<template>`、`<script>`、`<style>`。
- 页面与表单优先使用 Arco Design Vue 组件（`a-layout` / `a-form` / `a-input` / `a-button` / `a-card` 等），布局与交互对齐 [Arco 文档](https://arco.design/vue/docs/start)。
- 组件职责单一：页面组件管业务流程，公共组件管复用展示/交互。
- 不用 mixin。旧代码已有 mixin 保留，新逻辑抽成 composable。
- 不提前抽象，有明确复用场景再抽取。
- 表单校验规则遵循 `format.md` 中的「表单校验规则」规范。

## 命名与目录

- 页面组件放 `src/views`，通用组件放 `src/components`，布局组件放 `src/layout`。
- `src/components` 下的组件需提供 `types.ts` 存放跨文件复用类型；Vue 组件 Props 类型必须放在当前 `.vue` 文件内，不抽离到 `types.ts` / `index.ts`；有抽取逻辑时提供 `index.ts`。
- mock 数据放同级 `mock.ts`。
- 子组件优先放当前模块的 `components` 目录，不污染全局。
- 文件名遵循目录已有风格；同目录已有 `index.vue` 时继续沿用。

## Props 与事件

遵循 `format.md` 中的「Props 与事件」和「`types.ts`、`index.ts` 与 `index.vue` 分工」规范。

## 模板与逻辑

- 模板保持简洁，复杂条件/过滤/格式化放计算属性或函数。
- 列表渲染必须提供稳定且唯一的 `key`。
- 异步逻辑明确加载态和错误态，不用无意义 fallback 掩盖真实错误。
- 事件处理函数命名表达意图，模板不写大段内联逻辑。

## 样式

遵循 `styling.md` 规范。
