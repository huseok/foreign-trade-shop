# CHZautokeys（foreign-trade-shop）

外贸 B2B/B2C **买家端商城** + **后台管理端**（同一前端项目、不同路由与布局）。商品、购物车、订单、售后等主流程对接 **voyage** 后端；API 契约以 **OpenAPI** 文件为源，经脚本生成 TypeScript 类型。

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

本项目可选用 **React Compiler**（Babel）减少运行时无效重渲染。档位由环境变量 **`REACT_COMPILER_SCOPE`** 控制（与发版脚本 **`RELEASE_FRONTEND_COMPILER_SCOPE`** 对应）：

| 值 | 含义 |
|----|------|
| **0** | 关闭 Compiler，构建最快 |
| **1** | 仅 **`src/`** 下除 **`admin/`** 外的源码（默认本地 **`npm run build`**） |
| **2** | 整个 **`src/`** 含后台，构建最慢 |

详见根目录 **`vite.config.ts`** 顶部注释。快捷：`npm run build:scope0`、`npm run build:scope2`。

## 快速开始

```bash
npm install
npm run dev
```

- 开发：`npm run dev`，默认 <http://localhost:5173>
- 生产构建：`npm run build`（默认 scope **1**）；`npm run build:scope0` / `build:scope2` 见上表
- 预览：`npm run preview`
- 代码检查：`npm run lint`
- **从 OpenAPI 重新生成类型**：`npm run codegen:openapi`

### 后端 API 地址（`VITE_API_BASE_URL`）

- **代码读取位置**：`src/lib/http/apiClient.ts` 中的 `API_BASE_URL`（`import.meta.env.VITE_API_BASE_URL`，未配置时默认 `http://localhost:8080`）。
- **本地开发**：在 **`foreign-trade-shop` 根目录** 创建 **`.env.local`**（勿提交密钥；若团队用 gitignore 可忽略该文件）：

  ```bash
  VITE_API_BASE_URL=https://你的后端域名
  ```

  一般**不要**写末尾的 `/api/v1`（请求路径已在 `voyageSdk` 里带前缀）。修改后需 **重启** `npm run dev` 才会生效。

- **生产 / CI**：在托管平台（Vercel、Netlify 等）配置同名环境变量 **`VITE_API_BASE_URL`**，再执行 `npm run build`。

- **跨域**：后端需把前端 **Origin** 配进 **`APP_CORS_ALLOWED_ORIGINS`**（生产域名见 **[`../voyage/deploy/aliyun/DOMAIN_SETUP.md`](../voyage/deploy/aliyun/DOMAIN_SETUP.md)**），详见 **[`INTEGRATION.md`](./INTEGRATION.md)** §4、§9。

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
