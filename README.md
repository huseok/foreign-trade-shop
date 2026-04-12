# Globuy Supply（foreign-trade-shop）

外贸 B2B/B2C **买家端商城** + **独立管理后台**（同仓库、不同路由与布局）。商品、购物车、订单、售后等主流程对接 **voyage** 后端；API 契约以 **OpenAPI** 文件为源，经脚本生成 TypeScript 类型。

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 8 |
| 路由 | react-router-dom 7（`BrowserRouter` + `useRoutes`） |
| 服务端状态 | TanStack React Query 5 |
| HTTP | Axios（统一 baseURL、Bearer、401） |
| 管理 UI | Ant Design 6 + `@ant-design/icons` |
| 商城样式 | 全局 `index.css` + 页面/组件级 **SCSS** |
| API 契约 | `openapi/openapi.json` → `openapi-typescript` → `src/generated/voyage-paths.ts` |

本项目启用了 **React Compiler**（Babel），dev/build 可能略慢，属预期。

## 快速开始

```bash
npm install
npm run dev
```

- 开发：`npm run dev`，默认 <http://localhost:5173>
- 生产构建：`npm run build`
- 预览：`npm run preview`
- 代码检查：`npm run lint`
- **从 OpenAPI 重新生成类型**：`npm run codegen:openapi`

后端基地址见环境变量 **`VITE_API_BASE_URL`**（默认 `http://localhost:8080`），详 **`INTEGRATION.md`**。

## 路由一览

路由表在 [`src/router/index.tsx`](./src/router/index.tsx)，由 [`src/App.tsx`](./src/App.tsx) 挂载；未匹配路径重定向到商城首页 `/`。

### 商城（`MainLayout`）

| 路径 | 说明 |
|------|------|
| `/` | 首页 |
| `/catalog` | 商品目录 |
| `/products/:id` | 商品详情、加购 |
| `/cart`、`/checkout` | 购物车、结账（**需登录**） |
| `/orders/:id` | 订单详情，`:id` 为 **订单号 orderNo**（URL 编码）（**需登录**） |
| `/login`、`/register` | 登录、注册 |

### 管理后台（独立 `AdminLayout`，Ant Design）

| 路径 | 说明 |
|------|------|
| `/admin/login` | 后台登录（仅 **ADMIN** 可进入下方业务页） |
| `/admin` | 进入后默认跳到 `/admin/orders` |
| `/admin/orders` | 全量订单、物流与状态（**需 ADMIN**） |
| `/admin/products` | 新建商品与列表（**需 ADMIN**） |
| `/admin/after-sales` | 售后工单（**需 ADMIN**） |

## 数据与状态（重要）

- **商品列表/详情**：来自后端 API；`src/data/mockProducts.ts` 仅作遗留/演示数据时参考，主流程以接口为准。
- **购物车**：`CartContext` 与 React Query 并存时以 **React Query + voyage** 为准（见 `INTEGRATION.md`）。
- **订单**：创建与列表来自 **voyage**；不再使用 `localStorage` 演示订单流。
- **OpenAPI**：修改 `openapi/openapi.json` 后务必 `npm run codegen:openapi` 并检查 `voyageSdk.ts`。

## 目录结构（摘要）

```
src/
  main.tsx                 # ConfigProvider、AntdApp、QueryClient、Router
  App.tsx                  # useRoutes + 通配符回首页
  openapi/
    voyageSdk.ts           # 与 OpenAPI 对齐的 API 调用（解包 data）
  generated/
    voyage-paths.ts        # openapi-typescript 生成（勿手改）
  router/                  # 商城与 /admin 路由
  admin/                   # 后台布局、守卫、页面
  hooks/apiHooks.ts        # React Query 封装
  lib/http/                # apiClient、错误类型
  pages/                   # 商城页面
  types/api.ts             # 从生成 schema 导出的别名
openapi/
  openapi.json             # 契约（与 voyage 对齐）
```

更完整的联调、账号与接口清单见 **[`INTEGRATION.md`](./INTEGRATION.md)**。OpenAPI 维护说明见 **`openapi/README.md`**，生成物说明见 **`src/generated/README.md`**。

## 其他

- 产品级规划若存在于仓库其他文档，以前端 **`INTEGRATION.md`** 为对接事实补充。
- ESLint 可按团队规范扩展 type-aware 规则。
