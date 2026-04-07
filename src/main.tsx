/**
 * 应用入口：路由 + 全局 Provider。
 * 现已切换到 React Query + 后端 API；仅保留 OrdersProvider 兼容旧 admin 演示页。
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { OrdersProvider } from './context/OrdersContext'
import { queryClient } from './lib/query/queryClient'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <OrdersProvider>
          <App />
        </OrdersProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
)
