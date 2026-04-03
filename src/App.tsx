/**
 * 前台商城 + 订单详情 + 管理员订单列表，共用 MainLayout（顶栏/底栏）。
 */
import { Navigate, Route, Routes } from 'react-router-dom'
import { MainLayout } from './layouts/MainLayout'
import { Cart } from './pages/Cart'
import { Catalog } from './pages/Catalog'
import { Checkout } from './pages/Checkout'
import { Home } from './pages/Home'
import { Login } from './pages/Login'
import { AdminOrders } from './pages/AdminOrders'
import { OrderDetail } from './pages/OrderDetail'
import { ProductDetail } from './pages/ProductDetail'
import { Register } from './pages/Register'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route index element={<Home />} />
        <Route path="catalog" element={<Catalog />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="cart" element={<Cart />} />
        <Route path="checkout" element={<Checkout />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="orders/:id" element={<OrderDetail />} />
        <Route path="admin" element={<AdminOrders />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}
