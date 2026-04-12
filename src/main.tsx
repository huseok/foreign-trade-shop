/**
 * 应用入口。
 *
 * 自外向内依次提供：
 * - `ConfigProvider`：Ant Design 中文语言包与主题 token（与商城 CSS 主色协调）
 * - `App`（AntdApp）：为子树提供 `message` / `modal` 等静态方法上下文
 * - `QueryClientProvider`：React Query
 * - `BrowserRouter`：路由
 *
 * API 类型由 OpenAPI（`openapi/openapi.json`）经 `openapi-typescript` 生成至 `src/generated/`。
 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { App as AntdApp, ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { queryClient } from './lib/query/queryClient'
import { bootstrapAuthRefreshSchedule } from './lib/http/apiClient'
import './index.css'
import App from './App.tsx'

bootstrapAuthRefreshSchedule()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#0d9488',
          borderRadius: 8,
        },
      }}
    >
      <AntdApp>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <App />
          </BrowserRouter>
        </QueryClientProvider>
      </AntdApp>
    </ConfigProvider>
  </StrictMode>,
)
