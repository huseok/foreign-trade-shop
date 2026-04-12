import { useRoutes, Navigate } from 'react-router-dom'
import { routes } from './router'

/**
 * 根组件：挂载 `routes` 并在末尾追加通配符路由，将未知路径重定向到商城首页。
 */
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
