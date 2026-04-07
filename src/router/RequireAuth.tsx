import type { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { authStore } from '../lib/auth/authStore'

/**
 * 路由守卫：
 * 仅用于需要登录后访问的核心页面。
 */
export function RequireAuth({ children }: { children: ReactElement }) {
  const location = useLocation()
  if (!authStore.isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}
