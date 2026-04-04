/**
 * 前台商城 + 订单详情 + 管理员订单列表，共用 MainLayout（顶栏/底栏）。
 */
import { useRoutes, Navigate } from 'react-router-dom'
import { routes } from './router'

export default function App() {
  const element = useRoutes([
    ...routes,
    {
      path: '*',
      element: <Navigate to="/" replace />,
    },
  ])

  return element
}
