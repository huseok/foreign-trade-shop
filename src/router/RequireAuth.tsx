import type { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { authStore } from '../lib/auth/authStore'

/**
 * 商城侧路由守卫：未登录访问受保护页面时重定向到 **`/login`**。
 *
 * 与 `admin/RequireAdmin.tsx` 不同：本组件不校验 ADMIN 角色；
 * 管理后台请使用 `/admin/login` + `RequireAdmin`。
 */
export function RequireAuth({ children }: { children: ReactElement }) {
  const location = useLocation()
  if (!authStore.isLoggedIn()) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return children
}
