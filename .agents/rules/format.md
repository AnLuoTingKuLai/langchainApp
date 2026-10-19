---
description: "格式与代码规范"
globs: **/*.vue, **/*.ts, **/*.js, **/*.json
alwaysApply: false
---

# 格式与代码规范

## 总原则

- 代码格式以 `eslint.config.cjs` 为准（对齐 web-admin-movie-engine：`plugin:vue/vue3-recommended`、`@typescript-eslint/recommended`、`standard`）。
- 修改代码后执行：`npm run lint`（`--fix --cache`，可能自动格式化）。
- 需要确认类型安全时执行：`npm run type-check`。
- 不为格式问题大面积改动无关代码；不用注释大面积关闭 ESLint。

## 缩进与符号

- JavaScript、TypeScript 和 Vue 模板统一使用 2 个空格缩进。
- 语句结尾使用分号；禁止连续多余分号，如 `;;`。
- 字符串默认使用单引号。
- 禁止嵌套三目表达式（如 `const a = b ? c : d ? e : f`）；单层三目允许，多分支改用 `if/else`、映射对象或提取为函数/计算属性。

## 命名

- 变量、函数、对象属性使用驼峰命名。
- 组件名不强制多单词，但应保持语义清晰。
- 导出符号、文件名和目录名尽量贴合业务含义，不使用含糊缩写。
- 命名简洁明了、通俗易懂，禁止长命名（除非特殊需要），避免复杂的命名规则。
- 承载业务含义的命名禁止单单词（如 `list` 应写为 `cinemaList`、`data` 应写为 `movieData`）；纯工具类命名不受限。
- 路由 `path` 各级片段使用小驼峰（camelCase），与路由 `name` 保持一致风格；禁止使用 kebab-case（如 `cinema-list` 应写为 `cinemaList`）。

### 配置常量（全大写下划线）

模块内**不会重新赋值**的配置型数据，使用 **SCREAMING_SNAKE_CASE**（全大写 + 下划线）：

- 选项列表（如操作符、逻辑符、下拉项）
- 表格列配置、按钮配置、条件 chips 等用于 `v-for` 的静态数组
- 映射表、枚举式常量对象（键名同样全大写下划线）

命名示例：`conditionChipList` → `CONDITION_CHIP_LIST`，`previewColumns` → `PREVIEW_COLUMNS`。

```ts
const CONDITION_CHIP_LIST = [
  { key: 'keyword', label: '关键词' },
] as const;

const PREVIEW_COLUMNS = [
  { title: '影院名称', dataIndex: 'name' },
];

const previewList = ref<CinemaRow[]>([]);
```

**不适用全大写：**

- 普通变量、`ref` / `reactive` 包裹的运行时状态（即使初始值来自上方常量）
- 从 mock、API 或外部模块导入的命名保持其导出命名（如 `investorOptions`）
- TypeScript `enum` 成员按语言惯例（PascalCase 或项目既有风格）

## TypeScript

- 禁止未使用变量。
- `any` 只允许在无法精确建模或第三方类型缺失时使用。
- 公共函数、组合式函数、接口返回值应保持类型清晰。
- 模块内类型默认放同级 `types.ts`；可复用逻辑（工具函数、组合式函数、配置常量等）放 `index.ts`。
- Vue 组件 `props` 的 TS 类型必须在当前 `.vue` 文件内就近定义，不抽离到 `types.ts` / `index.ts`，避免 `withDefaults(defineProps<T>())` 默认值失效。
- 类型仅单文件内使用时，可就近定义；跨文件或跨组件复用时提取到 `types.ts`。

## Vue

- 允许带参数的 `v-model`。
- 单行和多行元素内容不强制换行，但要保持可读。
- 不强制自闭合标签，按当前文件风格处理。

### Props 与事件

- `props` 使用 `defineProps` + 泛型声明类型，如 `defineProps<{ ... }>()`；有默认值时用 `withDefaults`，默认值内联字面量。
- `defineProps` 的 TS 类型必须在当前 `.vue` 文件内定义，不从其他文件 `import type`，尤其是 `withDefaults(defineProps<T>())` 场景。
- `emit` 必须显式声明事件名和参数类型，如 `defineEmits<{ event: [payload] }>()`。
- 不直接修改 `props`，需要本地状态时复制为内部响应式数据。
- 双向绑定优先用 `v-model` 约定。

### 表单校验规则（Form Rules）

- 表单校验规则（`rules`）必须定义在 `<script>` 中，写在表单组件上方。
- 校验规则对象必须命名为 `formRules`，定义在组件 `<script>` 中，模板中通过 `:rules` 绑定。仅当 `formRules` 已被占用时，可使用其他名称。

### `types.ts`、`index.ts` 与 `index.vue` 分工

- **`types.ts`**：存放可跨文件复用的 TS 类型定义（如 `XxxEmits`、接口与类型别名）；禁止存放 Vue 组件 Props 类型。
- **`index.ts`**：存放可复用的业务逻辑（工具函数、组合式函数、配置常量等）；从 `types.ts` `import type` 引用类型。
- **`index.vue`**：组件视图逻辑与模板；Props 类型在当前文件内定义，其他复用类型可从 `types.ts` `import type` 引入，Props 默认值在 `withDefaults` 里内联。

## 导入

- **导入书写规范**:
  - 顺序:  ts 类型定义 → 第三方库 → `@/` 别名 -> 相对路径 `./`。
  - 排序: 每组内**按导入完整语句长度（从import 开始到分号结束）排序（短 → 长）**。
  - 清理: 立即删除未使用的导入。

## 全局对象

- 如需访问浏览器能力，优先使用标准 Web API，并通过类型表达清楚。
- 不要把业务数据挂到 `window` 上绕过模块边界或类型检查。
