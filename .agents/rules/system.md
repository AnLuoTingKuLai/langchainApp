---
description: "项目概述、通用开发规则与常用命令"
globs: **/*
alwaysApply: true
---

# 通用规则与项目描述

## 项目定位

- 本项目是 Vue 3 + Vite 的翻译助手，用于熟悉 LangChain（前端直接调用 LangChain，无 Express）。
- 新代码使用 Vue 3 Composition API（优先 `<script setup lang="ts">`）、Vue Router、Pinia。
- UI 组件与布局使用 [Arco Design Vue](https://arco.design/vue/docs/start)（`@arco-design/web-vue`，在 `main.ts` 完整引入）；不随意再引入其他 UI 库。
- 工程基建（ESLint / TS / axios / Less / Pinia）对齐 `web-admin-movie-engine` 的精简版。

## 工作方式

- 沟通使用简体中文。
- 先读当前文件和相关调用点，再修改代码。
- 保持最小改动，不做无关重构。
- 代码与文档冲突时，以代码和实际配置为准。
- 发现范围外问题时只说明风险，不擅自扩大修改范围。

## 目录结构

```text
src/
├── ai/                   # LangChain 链路（提示词 / 模型 / 链）
├── api/                  # axios 封装与拦截器
├── assets/style/         # 全局 Less
├── store/                # Pinia
├── router/               # 路由
├── views/                # 页面（优先用 Arco 组件）
├── App.vue               # Arco Layout 壳
└── main.ts               # 注册 ArcoVue + Pinia + 路由
```

## 路径别名

- `@` → `src/`（如 `@/ai`）
- Vite / IDE：`vite.config.ts`、`tsconfig.app.json`

## 常用命令

- 本地开发：`npm run dev`
- 生产构建：`npm run build`（含 `vue-tsc`）
- 类型检查：`npm run type-check`
- 代码检查：`npm run lint`
- 预览构建：`npm run preview`

## 修改原则

- 修改公共接口、路由、请求封装前，必须先检查引用。
- 不新增未明确要求的功能或兜底逻辑；错误应在靠近源头的位置暴露。
- 不为了“更优雅”引入额外抽象，除非能明确减少重复或降低复杂度。
- 禁止嵌套三元表达式（如 `const a = b ? c : d ? e : f`）；单层三元允许；多分支改用 `if/else`、映射对象或提取为函数/计算属性。
- 配置型常量（选项列表、列配置、静态映射等）使用全大写下划线命名，详见 `format.md`。
- 不自动提交 Git；用户明确要求提交时再提交，详见 `git.md`。
- 密钥与环境变量规范见 `security.md`。

## 验证原则

- 配置文件和构建脚本变更后，至少执行对应构建或启动命令确认。
- 改 TS / Vue 后执行 `npm run lint` 与 `npm run type-check`。
- 只改 Markdown 规则文件时，做路径和 UTF-8 内容检查即可。
