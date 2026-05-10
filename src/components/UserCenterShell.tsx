/**
 * 用户中心统一壳：顶栏标题 + 横向子导航（与市集主题一致）。
 */
import { NavLink } from 'react-router-dom'
import { useI18n } from '../i18n/I18nProvider'

const links = [
  { to: '/user/profile', key: 'user.navProfile' },
  { to: '/user/orders', key: 'user.navOrders' },
  { to: '/user/history', key: 'user.navHistory' },
  { to: '/user/addresses', key: 'user.navAddresses' },
] as const

export function UserCenterShell({ children }: { children: React.ReactNode }) {
  const { t } = useI18n()
  return (
    <section className="page-pad sf-user-center">
      <div className="container">
        <header className="page-header">
          <h1 className="page-header__title">{t('user.shellTitle')}</h1>
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
