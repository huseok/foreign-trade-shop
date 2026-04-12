import type { ReactElement } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Spin } from 'antd'
import { useMe } from '../hooks/apiHooks'
import { authStore } from '../lib/auth/authStore'

/**
 * 管理后台路由守卫。
 *
 * 1. 未登录 → 重定向到 **`/admin/login`**，并携带 `state.from` 便于登录后跳回。
 * 2. 已登录但 `me.role !== 'ADMIN'` → 重定向到商城首页 **`/`**（避免非管理员猜路径进入）。
 * 3. 拉取 `me` 过程中展示加载态，避免角色未判定时闪烁受保护内容。
 */
export function RequireAdmin({ children }: { children: ReactElement }) {
  const location = useLocation()
  const loggedIn = authStore.isLoggedIn()
  const { data: me, isLoading } = useMe(loggedIn)

  if (!loggedIn) {
    return <Navigate to="/admin/login" replace state={{ from: location.pathname }} />
  }

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
        <Spin size="large" />
      </div>
    )
  }

  if (me?.role !== 'ADMIN') {
    return <Navigate to="/" replace />
  }

  return children
}
