/**
 * 用户中心统一壳：顶栏标题 + 横向子导航（与市集主题一致）+ 退出登录。
 */
import { Button } from 'antd'
import { useQueryClient } from '@tanstack/react-query'
import { NavLink, useNavigate } from 'react-router-dom'
import { useI18n } from '../i18n/useI18n'
import { authStore } from '../lib/auth/authStore'
import { cancelScheduledAccessTokenRefresh } from '../lib/http/apiClient'

const links = [
  { to: '/user/profile', key: 'user.navProfile' },
  { to: '/user/orders', key: 'user.navOrders' },
  { to: '/user/history', key: 'user.navHistory' },
  { to: '/user/addresses', key: 'user.navAddresses' },
] as const

export function UserCenterShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const onLogout = () => {
    cancelScheduledAccessTokenRefresh()
    authStore.clearToken()
    qc.clear()
    navigate('/login', { replace: true })
  }

  return (
    <section className="page-pad sf-user-center">
      <div className="container">
        <header className="page-header sf-user-center__header">
          <h1 className="page-header__title">{t('user.shellTitle')}</h1>
          {authStore.isLoggedIn() && (
            <Button type="default" className="sf-user-center__logout" onClick={onLogout}>
              {t('user.logout')}
            </Button>
          )}
        </header>
        <nav className="sf-user-nav" aria-label={t('user.shellTitle')}>
          {links.map(({ to, key }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? 'sf-user-nav__link is-active' : 'sf-user-nav__link')}
              end={to === '/user/profile'}
            >
              {t(key)}
            </NavLink>
          ))}
        </nav>
        {children}
      </div>
    </section>
  )
}
