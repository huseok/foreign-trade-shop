# Globuy Supply（foreign-trade-shop）

面向外贸 B2B/B2C 的买家端前端演示：商品浏览、购物车、结账、订单确认，以及**管理员订单列表**（本地演示，无后端）。

## 技术栈

| 类别 | 选型 |
|------|------|
| 框架 | React 19 + TypeScript |
| 构建 | Vite 8 |
| 路由 | react-router-dom 7（`BrowserRouter` + `useRoutes`） |
| 样式 | 全局 `index.css`（变量与工具类）+ 各组件/页面目录下的 **SCSS**（未使用 Tailwind / MUI） |

本项目通过 `@vitejs/plugin-react` 与 `@rolldown/plugin-babel` 启用了 **React Compiler**（`babel-plugin-react-compiler`），可能影响 dev/build 耗时，属预期行为。

## 快速开始

```bash
npm install
npm run dev
```

- 开发：`npm run dev`，默认 <http://localhost:5173>
- 生产构建：`npm run build`
- 预览构建结果：`npm run preview`
- 代码检查：`npm run lint`

## 路由一览

路由表定义在 [`src/router/index.tsx`](./src/router/index.tsx)，由 [`src/App.tsx`](./src/App.tsx) 通过 `useRoutes` 挂载；未知路径重定向到首页。

| 路径 | 说明 |
|------|------|
| `/` | 首页 |
| `/catalog` | 商品目录（支持 `?category=` 筛选） |
| `/products/:id` | 商品详情、加入购物车 |
| `/cart` | 购物车 |
| `/checkout` | 结账表单；提交后生成订单并跳转订单详情 |
| `/orders/:id` | 订单详情（数据来自本地存储，见下） |
| `/login`、`/register` | 登录/注册 UI 占位，未接后端 |
| `/admin` | **管理员**：订单列表（仅前端演示，无鉴权） |
| 其他 | 重定向到首页 |

页脚含 **Admin · Orders** 入口，可进入 `/admin`。

## 数据与状态（重要）

### 商品数据

- 文件：`src/data/mockProducts.ts`
- 全部为本地 **mock**，未请求 API。

### 购物车

- 实现：`src/context/CartContext.tsx`
- 状态仅存于**内存**，刷新页面会清空；与 `plan.md` 中「匿名购物车 / 后续接后端」一致。

### 订单

- 实现：`src/context/OrdersContext.tsx`
- 结账成功时写入 **`localStorage`**，键名：**`globuy_orders_v1`**
- 订单号由 `src/utils/orderId.ts` 的 `createDemoOrderId()` 生成（演示用，生产环境应改为服务端生成）。
- 清除站点数据或更换浏览器后，订单列表会变化或为空。

### 管理员页

- `/admin` **无登录校验**，任何人可访问，仅适合本地/演示。
- 接入 Kotlin 后端后应改为：鉴权 + 调用订单 API，并移除或禁用纯前端 `localStorage` 方案。

## 目录结构

约定：**页面与共享组件**各放一个目录，入口为 `index.tsx`，样式为与目录同名的 `*.scss`（如 `Catalog/Catalog.scss`）。布局层使用 `MainLayout.css`。

```
src/
  main.tsx                 # 入口：BrowserRouter、OrdersProvider、CartProvider、App
  App.tsx                  # useRoutes：合并 router 与通配符回首页
  index.css                # 全局主题与工具类
  router/
    index.tsx              # RouteObject[]：MainLayout 子路由
  context/                 # CartContext、OrdersContext
  data/                    # mock 商品与分类
  types/                   # 订单等类型定义
  utils/                   # 如订单号生成（orderId）
  layouts/
    MainLayout.tsx         # 顶栏/底栏布局
    MainLayout.css
  components/
    Header/                # index.tsx + Header.scss
    Footer/
    ProductCard/
  pages/
    Home/
    Catalog/
    ProductDetail/
    Cart/
    Checkout/
    OrderDetail/
    AdminOrders/
    Auth/                  # Login.tsx、Register.tsx、Auth.scss、index.ts（导出）
```

## 后续对接后端（备忘）

- 在环境变量中配置 API 基地址（例如 `VITE_API_BASE_URL`），用 `fetch` 或 React Query 替换 mock。
- 购物车：按 `plan.md` 使用匿名 `cartId`（Cookie / 头）与后端同步。
- 订单：创建、支付、Webhook 以后端为准；前端 `localStorage` 订单仅作当前演示。

## 其他

- 更完整的产品与技术方案见仓库内 [`plan.md`](./plan.md)。
- ESLint 配置可参考模板说明扩展 type-aware 规则（见原 Vite 模板注释）。
