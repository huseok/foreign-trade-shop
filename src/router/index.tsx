import type { RouteObject } from 'react-router-dom'
import { MainLayout } from '../layouts/MainLayout'
import { AdminOrders } from '../pages/AdminOrders'
import { Login, Register } from '../pages/Auth'
import { Cart } from '../pages/Cart'
import { Catalog } from '../pages/Catalog'
import { Checkout } from '../pages/Checkout'
import { Home } from '../pages/Home'
import { OrderDetail } from '../pages/OrderDetail'
import { ProductDetail } from '../pages/ProductDetail'

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Home />,
      },
      {
        path: 'catalog',
        element: <Catalog />,
      },
      {
        path: 'products/:id',
        element: <ProductDetail />,
      },
      {
        path: 'cart',
        element: <Cart />,
      },
      {
        path: 'checkout',
        element: <Checkout />,
      },
      {
        path: 'login',
        element: <Login />,
      },
      {
        path: 'register',
        element: <Register />,
      },
      {
        path: 'orders/:id',
        element: <OrderDetail />,
      },
      {
        path: 'admin',
        element: <AdminOrders />,
      },
    ],
  },
]
