# CHZfobkey 前端架构说明

## 1. 项目定位

- 单一前端项目：`foreign-trade-shop`
- 同时包含：
  - 客户站（商城）页面
  - 后台管理页面（`/admin/*`）

## 2. 目录职责

- `src/router`：路由总入口与鉴权守卫
- `src/pages`：客户站业务页面（首页、分类、购物车、用户中心等）
- `src/admin`：后台布局与后台业务页
  - `src/admin/components/AdminPageHeader.tsx`：后台页面头部统一封装
  - `src/admin/components/AdminFilterBar.tsx`：后台筛选栏统一封装
- `src/components`：可复用通用组件（Header、Footer、ProductCard）
- `src/hooks`：React Query 查询/变更 hooks
- `src/openapi`：接口 SDK（统一解包后端响应）
- `src/lib/http`：Axios 实例、拦截器、错误处理
- `src/index.css`：全局变量与基础样式

## 2.2 管理后台 UI 技术栈（已切 Pro）

- 组件库：`antd@5`
- 管理后台框架组件：`@ant-design/pro-components`
- 当前已落地：
  - `src/admin/AdminLayout.tsx` 使用 `ProLayout`
  - 业务页统一：`PageContainer` +（列表类）`ProTable`；`/admin/login` 仍为独立登录页
  - 已迁移：`AdminOrdersPage`、`AdminProductListPage`、`AdminCategoriesPage`、`AdminAfterSalesPage`、`AdminShippingPage`、`AdminDictsPage`、`AdminSiteContentsPage`、`AdminAuditPage`、`AdminProductFormPage`（表单壳）、`AdminProductSkuMatrixPage`
- 迁移策略：按业务页逐步从基础 Antd 组件迁移到 Pro 组件，优先高频页（订单/商品）

## 2.1 订单状态字典化（ORDER_STATUS）

- 订单状态来源：字典模块 `ORDER_STATUS`，不再在前端/后端硬编码状态常量
- 字典项顺序规则：按 `sortNo` 升序作为状态流转链路
- 管理端订单页（`/admin/orders`）：
  - 手动改状态：弹窗下拉选择字典项（非自由输入）
  - 自动流转：点击“流转下一环节”按当前状态推进到字典中的下一项
  - 流转备注：支持填写备注，写入订单状态历史日志
- 关键实现位置：
  - 前端：`src/admin/pages/AdminOrdersPage.tsx`
  - hooks：`src/hooks/apiHooks.ts`
  - SDK：`src/openapi/voyageSdk.ts`

## 3. 路由设计

- 商城路由：
  - `/` 首页
  - `/catalog`、`/catalog/:categoryId` 分类与筛选
  - `/products/:id`、`/product/:id` 商品详情
  - `/cart`、`/checkout` 交易流程
  - `/user/profile` `/user/orders` `/user/history` `/user/addresses` 用户中心
  - `/contact` 联系人页面
- 后台路由：
  - `/admin/login`
  - `/admin/orders` `/admin/products` `/admin/after-sales`
  - `/admin/categories` `/admin/shipping` `/admin/dicts`
  - `/admin/site-contents` `/admin/audit`

## 4. 样式组织

- 全局样式放在 `src/index.css`（主题变量、布局工具类）
- 页面样式按页面自维护（例如 `src/pages/Home/Home.scss`）
- 后台主要使用 Ant Design 5 + Pro Components 样式体系

## 5. 如何调整

- 改页面结构：编辑对应 `src/pages/*` 或 `src/admin/pages/*`
- 改后台筛选与页头风格：优先复用 `AdminFilterBar` / `AdminPageHeader`
- 改路由：编辑 `src/router/index.tsx`
- 改全局风格：编辑 `src/index.css`
- 改 API：优先调整 `src/openapi/voyageSdk.ts` 与 `src/hooks/apiHooks.ts`
- 改后台壳层与表格：优先在 `src/admin/AdminLayout.tsx` 和各 `Admin*Page.tsx` 使用 Pro 组件
- 改订单状态流转：先维护 `ORDER_STATUS` 字典项与 `sortNo`，再测试 `/admin/orders` 手动改状态与自动流转
