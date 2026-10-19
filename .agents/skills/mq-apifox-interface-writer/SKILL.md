---
name: mq-apifox-interface-writer
description: 根据用户提供的 Apifox 关键字（目录名或单个接口名），从 Apifox（优先 CLI）拉取契约，写入本项目的 TypeScript API：src/api/modules/*Api.ts + src/api/types/*Api.ts，并严格遵循项目既有写法（@/api/axios、{ params } 包装、Params/Result 命名、主实体类型同源索引、无 code/msg 信封）。当用户说「把xxx接口写进 cinemaApi」「参考 Apifox 写接口」「补 API 类型」等时使用。第一步必须先判断关键字是目录还是单个接口。
---

# Apifox 接口写入（本项目约定）

## 唤起关键词

`把xxx接口写进 cinemaApi` / `参考 Apifox 写接口` / `补 API 类型` / `按 Apifox 生成 xxxApi`

## 何时使用

用户给出 Apifox 关键字，要求把接口写入项目 API 层（模块函数 + 类型），例如：

- 「把影院目录下的接口写进 cinemaApi」
- 「参考 Apifox 补客户详情接口」
- 「按 Apifox 生成 xxxApi」

本 skill **只写** `src/api/modules` / `src/api/types`，不负责页面调用（页面对接交给后续开发或 `mq-prototype-to-arco-vue`）。

## 项目硬约束（写之前先记住）

| 项 | 约定 |
|----|------|
| 模块文件 | `src/api/modules/<name>Api.ts`（少数历史文件如 `ticketSource.ts` 除外） |
| 类型文件 | `src/api/types/<name>Api.ts`，与模块一一对应；**禁止**把入参/出参类型写进 modules |
| 请求封装 | **必须** `import axios from '@/api/axios'`，不要用裸 `import axios from 'axios'`（新代码） |
| 响应类型 | 拦截器已剥离 `{ code, message, data }`，`Result` / 泛型 `T` 只描述 **data 本体**，禁止再包 `code`/`msg` |
| 分页公共类型 | 复用 `@/api/types/common` 的 `TablePageParams` / `TablePageResult`（列表 `data` 挂在 Result 上） |
| 类型同源 | 选定主实体后，列表行 / 入参 / 出参中**同名字段**用 `Main['field']` 索引引用，禁止复制粘贴一套重复字段类型 |
| Mock | 假数据只放 `src/mock/modules/`，本 skill **不写** Mock |

配套规则：`.agents/rules/system.md` 的「API 模块与 Mock 约定」。

## 第一步：判断关键字类型（必须先做）

1. 用关键字查 Apifox（优先 CLI，见下方「契约来源」）。
2. 判定：
   - **目录**：文件夹/分组，下挂多个接口 → 写入该目录下**全部**接口，不扩写目录外。
   - **接口**：唯一 method + path → **只写这一条**。
3. 同时命中目录与接口、或完全找不到 → **向用户确认**，不要猜。

## 第二步：确定目标文件

1. 用户指定了文件（如 `cinemaApi`）→ 写入对应 `modules` + `types`。
2. 未指定 → 按业务域匹配已有 `*Api.ts`；没有合适文件时再新建一对 `modules`/`types`，命名与业务一致（如 `channelApi`）。
3. **追写已有文件时**：先通读该文件，函数风格、传参方式、注释密度以**该文件现状**为准，不要强行改成另一种写法。
4. **新建文件时**：按下节「标准模板」写，对齐 `channelApi` / `cinemaApi` / `contractApi` 这一路主流写法。

## 第三步：契约来源（Apifox）

优先顺序：

1. **Apifox CLI**（读 `.agents/skills/apifox-cli/SKILL.md`）：`endpoint list` / `endpoint get`、必要时查 schema；项目 ID 优先看工作区 `.apifox/settings.json`。
2. 用户粘贴的 Apifox 文档 / OpenAPI / 截图字段说明。
3. 已连接的其他 Apifox 文档源。

每个接口至少确认：method、path、query/path/body 字段与类型、响应 `data` 结构、接口中文名（用于注释与命名）。

信息不全时：按同文件类似接口推断，并在类型注释里写清依据；**不要编造** Apifox 里没有的字段。

## 第四步：标准写法（新建或无冲突的默认）

### 模块函数（`src/api/modules`）

```ts
/**
 * <业务域>接口：<能力摘要，顿号分隔>。
 */
import type { PostXxxParams, PostXxxResult } from '@/api/types/xxxApi';
import axios from '@/api/axios';

/** <接口中文名/职责一句话> */
export function postXxx (params: PostXxxParams) {
  return axios.post<PostXxxResult>('/v1/...', { params });
}

/** GET 示例 */
export function getXxx (params: GetXxxParams) {
  return axios.get<GetXxxResult>('/v1/...', { params });
}
```

强制细节：

- 具名 `export function`（不要默认导出；新建不要用 `export const fn = () =>`，除非目标文件已是箭头函数风格）。
- 函数名：`get` / `post` + 业务语义（与 path 末段或 Apifox 接口名对应），如 `postCinemaEdit`、`getChannelDetail`。
- **POST body**：默认传 `{ params }`。拦截器约定：POST 用 `{ params }` 包装，会拆包清洗空值并参与签名；直接传裸对象会跳过这套清洗（仅当目标文件已统一裸传 `params` 时才跟随该文件）。
- **GET**：第二参为 `{ params }`（query）。
- path 参数用模板字符串，如 `` `/v1/schedules/cinemas/${cinemaCode}/halls/page` ``，其余筛选仍走 body/query 的 Params。
- 无返回 data 时用 `axios.post<void>(...)` / `get<void>`。
- 需要页面自行处理业务错误时，函数可预留 `config?: AxiosRequestConfig` 并往下传（参考 `investorApi` 的 delete）；普通接口不必加。
- 每个函数上方一行 `/** ... */`；文件头块注释说明模块职责。

### 类型（`src/api/types`）

```ts
/**
 * <业务域>接口类型：<能力摘要>。
 * 与 xxxApi 模块各方法一一对应，Result 表示接口响应 data 字段。
 * 以 XxxDetailResp 为主实体，其余通过索引引用同源。
 */
import type { TablePageParams, TablePageResult } from '@/api/types/common';

/** 详情/编辑主实体（其余类型同源引用） */
export interface XxxDetailResp {
  /** 主键；新建未保存时可为 undefined */
  id?: number;
  /** 名称 */
  name: string;
  /** 状态：0=停用，1=启用 */
  status: number;
}

/** 列表行：同名字段索引主实体，仅保留列表需要的列 */
export interface XxxPageResp {
  id: XxxDetailResp['id'];
  name: XxxDetailResp['name'];
  status: XxxDetailResp['status'];
}

/** 列表筛选：同名字段同样索引主实体 */
export interface XxxListFilterParams {
  status?: XxxDetailResp['status'];
  name?: XxxDetailResp['name'];
  ids?: NonNullable<XxxDetailResp['id']>[];
}

export type GetXxxListParams = XxxListFilterParams & TablePageParams;

export interface GetXxxListResult extends TablePageResult {
  data: XxxPageResp[];
}

export interface GetXxxDetailParams {
  id: XxxDetailResp['id'];
}

export type GetXxxDetailResult = XxxDetailResp;
```

强制细节：

- 与函数一一对应优先：`GetXxxParams` / `GetXxxResult`、`PostXxxParams` / `PostXxxResult`（Xxx 与函数名主体一致）。
- **类型同源（新建 / 扩写时强制，对齐 `channelApi` / `contractApi` / `customerApi`）**：
  1. 先定**一个主实体**（常见：`XxxDetailResp` 或列表主行 `XxxListItem`），文件头注释写明「以 Xxx 为主实体，其余通过索引引用同源」。
  2. 列表行、筛选 Params、详情 Params、创建/编辑入参里，凡与主实体**同名同义**的字段，一律写成 `Main['field']`（可选时用 `Main['field']` 或 `NonNullable<Main['field']>`），**禁止**再手写一遍 `string` / `number` 导致漂移。
  3. 仅主实体没有的字段（列表专有 `statusName`、接口独有扩展等）才在派生类型里单独声明类型。
  4. 追写已有 types 时：若该文件已有主实体，新字段先加到主实体，再在派生类型里索引；不要另起一套平行字段定义。
- **每个字段**写简体中文 JSDoc；枚举注明取值含义（主实体写全；派生类型可简写，但含义须与主实体一致）。
- 枚举优先复用 `@/constants` 已有类型，不要在 api types 里重复散落魔法数说明却不引用常量。
- Result **不是**整包 `HttpResponse`；不要写 `code`/`message`/`success`。
- 导入顺序：类型 import → 第三方 → `@/` → 相对路径；同组按语句长度短→长（见 format 规则）。

### 对照示例（摘自现有代码）

```ts
// modules：POST + { params }
export function postCustomerList (params: PostCustomerListParams) {
  return axios.post<PostCustomerListResult>('/v1/customers/list', { params });
}

// modules：GET + { params }
export function getCustomerDetail (params: GetCustomerDetailParams) {
  return axios.get<GetCustomerDetailResult>('/v1/customers/detail', { params });
}

// types：同源索引（channelApi 风格）
export interface ChannelPageResp {
  status: ChannelDetailResp['status'];
  companyCode: ChannelDetailResp['companyCode'];
}
export interface GetChannelDetailParams {
  id: ChannelDetailResp['id'];
}
```
## 第五步：去重与落盘

1. 若 method+path 或同名函数已存在 → **不重复新增**；提示已存在，除非用户明确要求覆盖更新。
2. 新函数追加到模块内相近业务旁；新类型追加到 types 内对应分区（实体 → Params/Result）。
3. 同步改 `modules` 的 `import type { ... }` 列表。
4. 写完后向用户列出清单：`函数名` | Apifox 接口名 | `METHOD path` | 类型名。

## 不要做的事

- 不在 views 里直接写 axios。
- 不把类型塞进 `modules`，不把请求函数塞进 `types`。
- 不新增未要求的依赖；不改拦截器 / `axios.ts` 封装，除非用户明确要求。
- 不写 `if (res.code === 200)` 示例或返回信封类型给业务层用。
- 不把 Apifox 的「整包响应」原样生成成 Result。
- 不在列表/入参里重复手写主实体已有字段的原始类型（同名字段必须 `Main['field']` 同源索引）。
- 不以 `pricingSchemeApi`（裸 `axios` + Request/Response 命名）作为**新建**默认模板；仅当用户指定改该文件时跟随其局部风格。

## 与其他 skill 的边界

| 诉求 | 去向 |
|------|------|
| 从 Apifox 写前端 API 函数/类型 | **本 skill** |
| 维护 Apifox 上的接口定义/分支/测试 | `apifox-cli` 及子 skill |
| 原型切页面、先留 API 空壳 | `mq-prototype-to-arco-vue` |
