# AGENTS.md

本项目使用 `.agents/rules/` 目录管理 AI 编码规则。所有 AI 编码助手（Claude Code、Cursor、Codex 等）均通过本文件了解项目约定。

当前项目是 **Vue 3 + Vite 的翻译助手**，用于熟悉 LangChain（前端直接调用 LangChain，无 Express）；路由使用 Vue Router；状态使用 Pinia；HTTP 使用 axios；前端以 **TypeScript** 为主，样式使用 **Less**；UI 使用 [Arco Design Vue](https://arco.design/vue/docs/start)（`@arco-design/web-vue`）。工程约定参考 `web-admin-movie-engine`。不随意再引入其他 UI 库或框架。

## 规则索引

| 规则文件 | 说明 | 适用范围 |
|----------|------|----------|
| [系统规则](./.agents/rules/system.md) | 项目概述、目录结构、常用命令、通用修改与验证原则 | 所有文件 |
| [Vue 规则](./.agents/rules/vue.md) | Vue 3 组件、响应式、组合式函数、路由、表单 | Vue / TS 文件 |
| [组件规则](./.agents/rules/components.md) | 组件拆分、目录约定、模板与异步态 | 组件 / 页面文件 |
| [样式规则](./.agents/rules/styling.md) | Less、scoped、BEM（camelCase）、全局样式入口 | 样式 / Vue 文件 |
| [格式规则](./.agents/rules/format.md) | ESLint、缩进命名、配置常量全大写下划线、Props/表单约定 | 源文件 |
| [注释规则](./.agents/rules/comments.md) | 文件头、逻辑分区、模板模块备注、JSDoc | 源文件 |
| [Git 规则](./.agents/rules/git.md) | 提交格式、分支与协作；禁止自动提交 | 所有文件 |
| [安全规则](./.agents/rules/security.md) | 密钥与环境变量、XSS、请求与日志 | 所有文件 |

## 阅读顺序

0. **首次使用**：先读 `system.md`，了解项目定位、目录与常用命令
1. **写 Vue / 前端逻辑前**：读 `vue.md`
2. **按任务加读**：
   - 写组件 / 写页面 → `components.md` + `comments.md`
   - 写样式 → `styling.md`
   - 写 API / 工具函数 / 命名 → `format.md`
   - 改密钥 / 环境变量 → `security.md`
   - 改 LangChain 链路 → 先看 `src/ai/`，再按最小改动原则修改
3. **涉及 Git 操作前**：先读 `git.md`，禁止自动提交

## 核心原则（速查）

- 沟通语言：中文
- 最小改动：不修改无关代码、不删注释、不升级依赖
- 代码胜文档：代码与文档冲突时以代码和实际配置为准
- 不过度设计：写当前需求的最简代码
- 新代码使用 Vue 3 Composition API 与 `<script setup lang="ts">`
- `.vue` 块顺序为 `<template>`、`<script>`、`<style>`
- 新逻辑不使用 mixin，优先抽成组合式函数
- 配置型常量（选项列表、静态映射等）使用全大写下划线，如 `CONDITION_CHIP_LIST`
- 禁止嵌套三元表达式；单层三元允许
- 不新增未明确要求的依赖、框架或 UI 组件库
- 本地开发：`npm run dev`；改完代码执行 `npm run lint` / `npm run type-check`
