/**
 * 应用入口。
 *
 * 自外向内依次提供：
 * - `I18nProvider` + `AntdLocaleBridge`：文件型文案与 Ant Design locale（见 theme/adminAntdTheme.ts）
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
import { App as AntdApp } from 'antd'
import { queryClient } from './lib/query/queryClient'
import { bootstrapAuthRefreshSchedule } from './lib/http/apiClient'
import { I18nProvider } from './i18n/I18nProvider'
import { AntdLocaleBridge } from './theme/antdLocaleBridge'
import './index.css'
import App from './App.tsx'
import { AppErrorBoundary } from './components/AppErrorBoundary'

bootstrapAuthRefreshSchedule()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <AntdLocaleBridge>
            <AntdApp>
              <AppErrorBoundary>
                <App />
              </AppErrorBoundary>
            </AntdApp>
          </AntdLocaleBridge>
        </I18nProvider>
      </QueryClientProvider>
    </BrowserRouter>
  </StrictMode>,
)
