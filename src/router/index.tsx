import type { RouteObject } from 'react-router-dom'
import { Navigate, Outlet } from 'react-router-dom'
import { AdminLayout } from '../admin/AdminLayout'
import { AdminAfterSalesPage } from '../admin/pages/after-sales/AdminAfterSalesPage'
import { AdminAuditPage } from '../admin/pages/audit/AdminAuditPage'
import { AdminCategoriesPage } from '../admin/pages/categories/AdminCategoriesPage'
import { AdminCustomersPage } from '../admin/pages/customers/AdminCustomersPage'
import { AdminDictsPage } from '../admin/pages/dicts/AdminDictsPage'
import { AdminLogin } from '../admin/pages/auth/AdminLogin'
import { AdminOrdersPage } from '../admin/pages/orders/AdminOrdersPage'
import { AdminProductFormPage } from '../admin/pages/products/AdminProductFormPage'
import { AdminProductListPage } from '../admin/pages/products/AdminProductListPage'
import { AdminProductSkuMatrixPage } from '../admin/pages/products/AdminProductSkuMatrixPage'
import { AdminShippingPage } from '../admin/pages/shipping/AdminShippingPage'
import { AdminSiteContentsPage } from '../admin/pages/site-contents/AdminSiteContentsPage'
import { AdminMarketingPage } from '../admin/pages/marketing/AdminMarketingPage'
import { AdminMembershipRulesPage } from '../admin/pages/membership/AdminMembershipRulesPage'
import { AdminTagsPage } from '../admin/pages/tags/AdminTagsPage'
import { AdminStatsPage } from '../admin/pages/stats/AdminStatsPage'
import { RequireAdmin } from '../admin/RequireAdmin'
import { MainLayout } from '../layouts/MainLayout'
import { ContactPage } from '../pages/Contact'
import { Cart } from '../pages/Cart'
import { Catalog } from '../pages/Catalog'
import { Checkout } from '../pages/Checkout'
import { Home } from '../pages/Home'
import { OrderDetail } from '../pages/OrderDetail'
import { ProductDetail } from '../pages/ProductDetail'
import { UserAddressesPage } from '../pages/user-center/addresses/Addresses'
import { UserOrdersPage } from '../pages/user-center/orders/Orders'
import { UserProfilePage } from '../pages/user-center/profile/Profile'
import { Login, Register } from '../pages/Auth'
import { RequireAuth } from './RequireAuth'

/**
 * 应用级路由表。
 *
 * **结构说明**
 * - `/admin/*`：管理后台。`login` 无侧栏；其余子路由挂在 `AdminLayout`（侧栏 + 顶栏）下，
 *   业务页由 `RequireAdmin` 包裹，要求已登录且 `role === 'ADMIN'`。
 * - `/admin/products`：商品列表（index）；`/admin/products/new` 新建；`/admin/products/:id/edit` 编辑。
 * - `/admin/stats`：数据看板；`/admin/membership-rules`：会员档位规则。
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
            path: 'stats',
            element: (
              <RequireAdmin>
                <AdminStatsPage />
              </RequireAdmin>
            ),
          },
          {
            path: 'orders',
            element: (
              <RequireAdmin>
                <AdminOrdersPage />
              </RequireAdmin>
            ),
          },
          {
            path: 'customers',
            element: (
              <RequireAdmin>
                <AdminCustomersPage />
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
            path: 'marketing',
            element: (
              <RequireAdmin>
                <AdminMarketingPage />
              </RequireAdmin>
            ),
          },
          {
            path: 'membership-rules',
            element: (
              <RequireAdmin>
                <AdminMembershipRulesPage />
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
