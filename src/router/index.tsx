import type { RouteObject } from 'react-router-dom'
import { Navigate } from 'react-router-dom'
import { AdminLayout } from '../admin/AdminLayout'
import { AdminAfterSalesPage } from '../admin/pages/AdminAfterSalesPage'
import { AdminLogin } from '../admin/pages/AdminLogin'
import { AdminOrdersPage } from '../admin/pages/AdminOrdersPage'
import { AdminProductsPage } from '../admin/pages/AdminProductsPage'
import { RequireAdmin } from '../admin/RequireAdmin'
import { MainLayout } from '../layouts/MainLayout'
import { Cart } from '../pages/Cart'
import { Catalog } from '../pages/Catalog'
import { Checkout } from '../pages/Checkout'
import { Home } from '../pages/Home'
import { OrderDetail } from '../pages/OrderDetail'
import { ProductDetail } from '../pages/ProductDetail'
import { Login, Register } from '../pages/Auth'
import { RequireAuth } from './RequireAuth'

/**
 * 应用级路由表。
 *
 * **结构说明**
 * - `/admin/*`：管理后台。`login` 无侧栏；其余子路由挂在 `AdminLayout`（侧栏 + 顶栏）下，
 *   业务页由 `RequireAdmin` 包裹，要求已登录且 `role === 'ADMIN'`。
 * - `/`：商城。根布局为 `MainLayout`；需登录的购物车/结账/订单等由 `RequireAuth` 包裹。
 *
 * 路由顺序在 `App.tsx` 中与通配符 `*` 合并；未知路径回商城首页。
 */
export const routes: RouteObject[] = [
  {
    path: '/admin',
    children: [
      { path: 'login', element: <AdminLogin /> },
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <Navigate to="orders" replace /> },
          {
            path: 'orders',
            element: (
              <RequireAdmin>
                <AdminOrdersPage />
              </RequireAdmin>
            ),
          },
          {
            path: 'products',
            element: (
              <RequireAdmin>
                <AdminProductsPage />
              </RequireAdmin>
            ),
          },
          {
            path: 'after-sales',
            element: (
              <RequireAdmin>
                <AdminAfterSalesPage />
              </RequireAdmin>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '/',
    element: <MainLayout />,
    children: [
      { index: true, element: <Home /> },
      { path: 'catalog', element: <Catalog /> },
      { path: 'products/:id', element: <ProductDetail /> },
      {
        path: 'cart',
        element: (
          <RequireAuth>
            <Cart />
          </RequireAuth>
        ),
      },
      {
        path: 'checkout',
        element: (
          <RequireAuth>
            <Checkout />
          </RequireAuth>
        ),
      },
      { path: 'login', element: <Login /> },
      { path: 'register', element: <Register /> },
      {
        path: 'orders/:id',
        element: (
          <RequireAuth>
            <OrderDetail />
          </RequireAuth>
        ),
      },
    ],
  },
]
