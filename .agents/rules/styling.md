---
description: "通用样式规则（Less）"
globs: **/*.vue, **/*.less, src/assets/**/*
alwaysApply: false
---

# 样式规则

## 样式栈

- 项目统一使用 **Less**（`lang="less"` / `.less`），不引入 SCSS / Stylus。
- 全局样式放在 `src/assets/style/global.less`，由 `main.ts` 引入。
- 需安装 `less` 作为 Vite 预处理器依赖。

## 使用优先级

- 简单样式优先写在组件内 `<style scoped lang="less">`。
- 复杂交互态、伪元素、复杂动画，用 `<style scoped lang="less">`。
- 全局基础重置与主题变量放 `src/assets/style/global.less`，不散落到页面组件。

## 类名命名（BEM，camelCase 版本）

- **Block 必须用小驼峰（camelCase）**：如 `esiSplitLayout`、`userInfoCard`；禁止 kebab-case（如 `user-info-card`）。
- **Element 用 `__`**：如 `esiSplitLayout__left`、`userInfoCard__header`；禁止 `-left`、`_header` 等写法。
- **Modifier 用单个 `-` 挂在完整类名后**：如 `esiSplitLayout__left-collapsed`；本规范不使用双短横 `--`。
- 类名必须语义化、无拼写错误，能表达结构或业务含义，不使用无意义缩写。
- 同一组件内禁止混用 camelCase 与 kebab-case；与其他命名习惯冲突时，以 camelCase Block 为准。
- Less **禁止**使用 `&__` 简写 Element，必须写完整类名（如 `.esiSplitLayout__left`，不得写 `&__left`）。
- Modifier 同样禁止 `&--` / `&-` 简写，必须写 `&.完整类名`（如 `&.esiSplitLayout__left-collapsed`）。
- 允许在同一选择器内使用 `&:hover`、`&:focus` 等伪类/伪元素简写。
- 层级清晰，避免过深嵌套；优先平铺完整类名选择器。

```html
<div class="esiSplitLayout">
  <div class="esiSplitLayout__left esiSplitLayout__left-collapsed"></div>
  <div class="esiSplitLayout__right"></div>
</div>
```

```less
// ✅ 正确：完整类名
.esiSplitLayout {
  .esiSplitLayout__left {
    &.esiSplitLayout__left-collapsed {
    }
  }

  .esiSplitLayout__right {
  }
}

// ❌ 禁止：&__ / &-- 简写
.esiSplitLayout {
  &__left {
    &--collapsed {
    }
  }
}
```

## 布局

- 固定尺寸控件设稳定宽高，避免加载态导致布局抖动。
- 文本考虑换行、溢出和省略，不遮挡相邻内容。

## 颜色

- 优先复用 Arco CSS 变量与已有色值；禁止多文件散落重复色值。
- 界面保持克制、清晰，不被单一高饱和色系支配。

## 维护

- 不引入无关样式体系。
- 不新增全局样式文件承载页面局部样式。
