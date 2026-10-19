---
name: mq-prototype-to-arco-vue
description: 根据 Axure 原型地址（shell.html#/m/x.x.x 锚点）和已有参考目录，将原型「切图」还原为本项目 Vue 3 + Arco + mq 组件规范的功能页。触发词含「切图」「还原页面」「实现原型」「按原型做页面」等。产出静态结构、交互骨架、同级 mock.ts 演示数据与目录复现说明；不写真实 API（见 mq-apifox-interface-writer），不做需求覆盖度评估（见 mq-requirement-coverage-checker）。
---

# 原型切图 → 本项目 Vue 页面

## 唤起关键词

`切图` / `还原页面` / `实现原型` / `按原型做页面`

## 何时使用

- 用户给出一个或多个 Axure 导出锚点（`shell.html#/m/x.x.x`），要求切出 / 还原 / 实现页面。
- 参考目录固定，无需用户每次指定；落盘路径由 AI 根据需求 / 原型业务域自动生成。

## 写之前必读（按需，不要一次读完所有 rules）

1. `.agents/rules/components-catalog.md`：页面骨架、场景选组件、误用清单
2. 固定参考目录内现有 `index.vue` / `components/` / `types.ts` / `index.md`
3. 涉及新组件拆分时：`.agents/rules/components.md`、备注规则（文件头 / 分区 / 模板注释）

## 输入约定

1. **原型地址**（用户必给，缺则先问）：多个时按用户给定顺序逐个做完，不合并跳跃。
2. **参考项目目录**（固定，不问用户）：`src/views/salesOrder/contractManagement/contractList`，用于学习：
   - 目录拆解（`index.vue` / `index.ts` / `types.ts` / `components/`）
   - Props / Emit、抽屉挂载位置（`#extra`）
   - 查询项、列配置、组合式逻辑如何拆到 `index.ts`
3. **落盘路径**（AI 自动生成，不问用户）：根据需求文档 / 原型业务域 / 模块语义，在 `src/views/...` 下推断并创建目标模块路径；生成后在交付说明中写明实际路径即可。

## 本项目硬约束

| 项 | 约定 |
|----|------|
| 技术栈 | Vue 3 `<script setup lang="ts">`，Arco Design Vue，本地 mq / module 组件 |
| 页面根容器 | `<MqMainContent>`（`#top` 放标题/Tab/查询，主区放表格，`#extra` 挂抽屉） |
| 查询区 | `<MqSearch>`，禁止手写 `a-form` 查询布局 |
| 列表 | `mq-table-list`，禁止 `a-table` + 手写分页；插槽行数据用 `#slot="{ row }"`，**禁止 `record`** |
| 组件导入 | barrel：`@/components/common`、`@/components/module`；禁止深路径直引 |
| 私有弹层 | 放当前页 `components/`，不塞进全局 `src/components` |
| 布局 | 不实现顶栏 / 侧栏 / 面包屑 / Footer（`layoutMain` 已有） |
| 编辑/详情传参 | 打开编辑、详情及与外部联动时，**只传一个 id**（或参考目录已有的单一主键字段），不设计多参数打开 |

## Mock 数据（切图阶段必做）

切图阶段用**模块同级 `mock.ts`** 支撑列表 / 表单 / 下拉演示，**不要**把假数据写进 `src/mock/modules/`（那是全局 Axios 拦截 Mock，留给真实联调）。

### 放置规则

- **页面级**演示数据：与页面入口同级，如 `src/views/.../fooPage/mock.ts`。
- **子组件私有**演示数据：与该组件同级，如 `components/xxxDrawer/mock.ts`。
- 页面与多个子组件共用同一份数据时，放在**页面根** `mock.ts`，子组件从相对路径导入；不要复制多份。
- 类型放同级 `types.ts`（或参考目录已有命名如 `type.ts`），`mock.ts` 只导出数据 / 纯函数，`import type` 自 `./types`。

### 写法约定

```ts
/**
 * <模块名> 模拟数据
 * @description 后端未接入前支撑页面交互；接口就绪后由真实 API 替换，本文件仅作占位。
 */
import type { FooItem } from './types';

/** 列表 mock */
export const mockFooList: FooItem[] = [
  { id: '1', name: '示例 A', status: 'enabled' }
];
```

- 页面内：`import { mockFooList } from './mock'`，可深拷贝后再包 `ref`，避免直接改导出常量。
- `mq-table-list` 的 `:api` 可先包一层返回 mock 列表的函数（形状对齐日后真实接口的 data），**不要**在切图阶段调用 `src/api/modules`。
- 真实 API / 类型写入交给 `mq-apifox-interface-writer`；切图结束时在清单里标明「仍依赖 mock.ts 的数据点」。

## 执行步骤

1. **读原型**（只看主体内容区）  
   记录：模块（查询 / Tab / 表格 / 按钮 / 抽屉）、字段类型与校验文案、弹层触发与内容。忽略原型里的顶栏和左侧菜单。

2. **读参考目录**  
   对齐文件拆分、命名、抽屉宽度与挂载方式；新页面按同样方式组织，不自创另一套结构。

3. **按组件清单搭骨架**  
   - 列表页优先对照 catalog「标准页面骨架」：`MqMainContent` + `#top`（`MqPageHeader` / `MqTab` / `MqSearch`）+ `mq-table-list` + `#extra`。  
   - 只读详情字段：`MqDetail` 或 `MqLayoutRow`（按场景选，见 catalog）。  
   - 区域标题：`MqTitle`。  
   - 状态 Tab 带徽标：优先 `MqTab`。

4. **弹层规则**  
   - 新增 / 编辑 / 详情 / 关联选择等，默认用 **`MqDrawer`**（右侧滑出），配合 `v-model:visible`；需要脏检查时用 `useFormDirty` + `confirmOnDirty` / `requestClose`（参考现有抽屉）。  
   - **宽度**：默认跟参考目录同类抽屉；无参考时简单表单约 `480`（组件默认），复杂表单常用 `800` / `960`，选择类大表可到 `1100`。**禁止**不问场景一律写死 `800`。  
   - 多层抽屉需要叠加时开 `stackable`（见 `mqDrawer/index.md`）。  
   - 极简单确认仍可用 `a-modal` / `Modal.confirm`，不要为确认框硬套大抽屉。

5. **指定业务选择器必须复用**（禁止页面内重写一套）  

   | 字段场景 | 组件 |
   |----------|------|
   | 所属客户 | `SelectModalCustomer` |
   | 关联票源产品 | `SelectModalTicketSourceProduct` |
   | 影院 / 影投 / 影片 / 渠道 / 合同 / 员工等 | catalog `select/` 下对应 `SelectModal*` / `ScopeSelect*` / `CascadeSelect*` |

   用户另行指定的映射同样记录并复用。

6. **补 mock.ts 并接线**  
   按上文「Mock 数据」写出列表行、详情、下拉选项等，让查询 / 翻页（可简化）/ 打开抽屉回填在无后端时也能走通主路径。

7. **顺序**  
   多原型地址时按用户顺序逐个完成（含该页 mock + index.md），再进入下一个。

8. **生成 / 更新 `index.md`**  
   放在对应页面目录，用自然语言写清：结构、字段、交互、抽屉规则、复用组件、mock 文件位置与用途、编辑详情只传 id。  
   **不要**写死大段示例业务数据（mock 文件里已有即可）；要写清「数据来自 `./mock.ts`，接口未接」。

## 明确不做

- 不写真实 `src/api/modules` 请求体（可留与参考页一致的调用形状，但切图默认走 mock）。
- 不写 `src/mock/modules/` 全局拦截。
- 不新增未要求的依赖或 UI 库。
- 不改 layout / 路由权限（除非用户明确要求挂菜单）。

## 与其他 skill 边界

| 诉求 | 去向 |
|------|------|
| 原型 → 页面结构 + 本地 mock | **本 skill** |
| Apifox → 真实 API 函数/类型 | `mq-apifox-interface-writer` |
| 对照 PRD 查覆盖度 | `mq-requirement-coverage-checker` |

## 校验清单

- [ ] 主体区与原型字段 / 按钮 / 弹层逐项对应
- [ ] 未重复实现顶栏 / 菜单 / 面包屑
- [ ] 使用 `MqMainContent` + `MqSearch` + `mq-table-list`（场景适用时）
- [ ] 表格插槽使用 `row` 而非 `record`
- [ ] 公共 / 业务选择器走 barrel 与 catalog 复用
- [ ] 抽屉为 `MqDrawer`，宽度合理（非无脑 800）
- [ ] 编辑 / 详情打开只传一个 id
- [ ] 演示数据在页面或子组件同级 `mock.ts`，页面已引用
- [ ] 未把切图假数据写入 `src/mock/modules/`
- [ ] 目录拆解与参考项目一致；已写 `index.md`
- [ ] 多原型按给定顺序全部完成
