/**
 * 商城顶栏（市集 marketplace 布局）：促销条 + 顶栏（Logo / 桌面搜索 / 账户）+ 类目横滑条。
 * 搜索回车跳转 `/catalog?q=`；语言切换见 LanguageSwitcher。
 */
import { useEffect, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { storefrontCatalogHref } from '../../lib/catalogUrls'
import { useCart, useCategories, useMe } from '../../hooks/apiHooks'
import { authStore } from '../../lib/auth/authStore'
import { getLocalCartCount, onLocalCartUpdated } from '../../lib/cart/localCart'
import { useI18n } from '../../i18n/I18nProvider'
import { LanguageSwitcher } from '../LanguageSwitcher'
import './Header.scss'

export function Header() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const loggedIn = authStore.isLoggedIn()
  const { data: cart } = useCart(loggedIn)
  const { data: me } = useMe(loggedIn)
  const { data: categories = [] } = useCategories()
  const [open, setOpen] = useState(false)
  const [localCount, setLocalCount] = useState(() => getLocalCartCount())
  const [searchQ, setSearchQ] = useState('')
  useEffect(() => onLocalCartUpdated(() => setLocalCount(getLocalCartCount())), [])
  const itemCount = loggedIn ? cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0 : localCount

  const runSearch = () => {
    const q = searchQ.trim()
    const sp = new URLSearchParams()
    if (q) sp.set('q', q)
    navigate(sp.toString() ? `/catalog?${sp}` : '/catalog')
    setOpen(false)
  }

  return (
    <>
      <div className="sf-mp-promo">{t('header.promo')}</div>
      <header className="site-header">
        <div className="site-header__inner container">
          <Link to="/" className="site-header__logo" onClick={() => setOpen(false)}>
            <span className="site-header__mark" aria-hidden />
            {t('brand')}
          </Link>

          <div className="site-header__search-market" role="search">
            <label htmlFor="header-search-market" className="visually-hidden">
              {t('header.searchPlaceholder')}
            </label>
            <select className="site-header__search-scope" aria-hidden disabled title="Catalog">
              <option>{t('nav.catalog')}</option>
            </select>
            <input
              id="header-search-market"
              type="search"
              placeholder={t('header.searchPlaceholder')}
              className="site-header__search-input"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  runSearch()
                }
              }}
              autoComplete="off"
            />
            <button type="button" className="site-header__search-btn" onClick={() => runSearch()}>
              {t('header.searchGo')}
            </button>
          </div>

          <button
            type="button"
            className="site-header__toggle"
            aria-expanded={open}
            aria-controls="site-nav"
            onClick={() => setOpen((v) => !v)}
          >
            <span className="site-header__toggle-bar" />
            <span className="site-header__toggle-bar" />
            <span className="site-header__toggle-bar" />
            <span className="visually-hidden">{t('header.menu')}</span>
          </button>

          <nav id="site-nav" className={`site-header__nav ${open ? 'is-open' : ''}`}>
            <NavLink
              to="/"
              end
              className={({ isActive }) => (isActive ? 'site-header__link is-active' : 'site-header__link')}
              onClick={() => setOpen(false)}
            >
              {t('nav.home')}
            </NavLink>
            <NavLink
              to="/catalog"
              className={({ isActive }) => (isActive ? 'site-header__link is-active' : 'site-header__link')}
              onClick={() => setOpen(false)}
            >
              {t('nav.catalog')}
            </NavLink>
            <NavLink
              to="/cart"
              className={({ isActive }) => (isActive ? 'site-header__link is-active' : 'site-header__link')}
              onClick={() => setOpen(false)}
            >
              {t('nav.cart')}
              {itemCount > 0 && <span className="site-header__badge">{itemCount}</span>}
            </NavLink>
            <NavLink
              to={loggedIn ? '/user/profile' : '/login'}
              className={({ isActive }) => (isActive ? 'site-header__link is-active' : 'site-header__link')}
              onClick={() => setOpen(false)}
            >
              {loggedIn ? me?.name ?? t('nav.account') : t('nav.login')}
            </NavLink>
            <NavLink
              to="/contact"
              className={({ isActive }) => (isActive ? 'site-header__link is-active' : 'site-header__link')}
              onClick={() => setOpen(false)}
            >
              {t('nav.contact')}
            </NavLink>
          </nav>

          <div className="site-header__lang">
            <LanguageSwitcher />
          </div>

          <div className="site-header__search-mobile" role="search">
            <input
              type="search"
              placeholder={t('header.searchPlaceholder')}
              className="site-header__input"
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault()
                  runSearch()
                }
              }}
              autoComplete="off"
            />
          </div>
        </div>

        <nav className="sf-mp-category-strip container" aria-label={t('header.categories')}>
          {categories.slice(0, 24).map((c) => (
            <Link key={c.id} to={storefrontCatalogHref({ categoryId: c.id })} onClick={() => setSearchQ('')}>
              {c.name}
            </Link>
          ))}
        </nav>
      </header>
    </>
  )
}
