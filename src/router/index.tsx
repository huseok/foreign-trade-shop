import type { RouteObject } from 'react-router-dom'
import { Navigate, Outlet } from 'react-router-dom'
import { AdminLayout } from '../admin/AdminLayout'
import { AdminAfterSalesPage } from '../admin/pages/AdminAfterSalesPage'
import { AdminAuditPage } from '../admin/pages/AdminAuditPage'
import { AdminCategoriesPage } from '../admin/pages/AdminCategoriesPage'
import { AdminDictsPage } from '../admin/pages/AdminDictsPage'
import { AdminLogin } from '../admin/pages/AdminLogin'
import { AdminOrdersPage } from '../admin/pages/AdminOrdersPage'
import { AdminProductFormPage } from '../admin/pages/AdminProductFormPage'
import { AdminProductListPage } from '../admin/pages/AdminProductListPage'
import { AdminProductSkuMatrixPage } from '../admin/pages/AdminProductSkuMatrixPage'
import { AdminShippingPage } from '../admin/pages/AdminShippingPage'
import { AdminSiteContentsPage } from '../admin/pages/AdminSiteContentsPage'
import { AdminTagsPage } from '../admin/pages/AdminTagsPage'
import { RequireAdmin } from '../admin/RequireAdmin'
import { MainLayout } from '../layouts/MainLayout'
import { ContactPage } from '../pages/Contact'
import { Cart } from '../pages/Cart'
import { Catalog } from '../pages/Catalog'
import { Checkout } from '../pages/Checkout'
import { Home } from '../pages/Home'
import { OrderDetail } from '../pages/OrderDetail'
import { ProductDetail } from '../pages/ProductDetail'
import { UserAddressesPage } from '../pages/UserCenter/Addresses'
import { UserHistoryPage } from '../pages/UserCenter/History'
import { UserOrdersPage } from '../pages/UserCenter/Orders'
import { UserProfilePage } from '../pages/UserCenter/Profile'
import { Login, Register } from '../pages/Auth'
import { RequireAuth } from './RequireAuth'

/**
 * 应用级路由表。
 *
 * **结构说明**
 * - `/admin/*`：管理后台。`login` 无侧栏；其余子路由挂在 `AdminLayout`（侧栏 + 顶栏）下，
 *   业务页由 `RequireAdmin` 包裹，要求已登录且 `role === 'ADMIN'`。
 * - `/admin/products`：商品列表（index）；`/admin/products/new` 新建；`/admin/products/:id/edit` 编辑。
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
                <Outlet />
              </RequireAdmin>
            ),
            children: [
              { index: true, element: <AdminProductListPage /> },
              { path: 'new', element: <AdminProductFormPage /> },
              { path: ':productId/edit', element: <AdminProductFormPage /> },
              { path: ':productId/sku-matrix', element: <AdminProductSkuMatrixPage /> },
            ],
          },
          {
            path: 'after-sales',
            element: (
              <RequireAdmin>
                <AdminAfterSalesPage />
              </RequireAdmin>
            ),
          },
          {
            path: 'categories',
            element: (
              <RequireAdmin>
                <AdminCategoriesPage />
              </RequireAdmin>
            ),
          },
          {
            path: 'tags',
            element: (
              <RequireAdmin>
                <AdminTagsPage />
              </RequireAdmin>
            ),
          },
          {
            path: 'shipping',
            element: (
              <RequireAdmin>
                <AdminShippingPage />
              </RequireAdmin>
            ),
          },
          {
            path: 'dicts',
            element: (
              <RequireAdmin>
                <AdminDictsPage />
              </RequireAdmin>
            ),
          },
          {
            path: 'site-contents',
            element: (
              <RequireAdmin>
                <AdminSiteContentsPage />
              </RequireAdmin>
            ),
          },
          {
            path: 'audit',
            element: (
              <RequireAdmin>
                <AdminAuditPage />
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
      { path: 'catalog/:categoryId', element: <Catalog /> },
      { path: 'products/:id', element: <ProductDetail /> },
      { path: 'product/:id', element: <ProductDetail /> },
      { path: 'contact', element: <ContactPage /> },
      {
        path: 'cart',
        element: <Cart />,
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
        path: 'user/profile',
        element: (
          <RequireAuth>
            <UserProfilePage />
          </RequireAuth>
        ),
      },
      {
        path: 'user/orders',
        element: (
          <RequireAuth>
            <UserOrdersPage />
          </RequireAuth>
        ),
      },
      {
        path: 'user/history',
        element: (
          <RequireAuth>
            <UserHistoryPage />
          </RequireAuth>
        ),
      },
      {
        path: 'user/addresses',
        element: (
          <RequireAuth>
            <UserAddressesPage />
          </RequireAuth>
        ),
      },
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
