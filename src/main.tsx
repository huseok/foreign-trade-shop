/**
 * 应用入口：路由 + 全局 Provider。
 * OrdersProvider 在外层，以便结账写入订单后任意页面可读订单列表/详情。
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { CartProvider } from './context/CartContext'
import { OrdersProvider } from './context/OrdersContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <OrdersProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </OrdersProvider>
    </BrowserRouter>
  </StrictMode>,
)
