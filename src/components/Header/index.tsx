import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useCart, useMe } from '../../hooks/apiHooks'
import { authStore } from '../../lib/auth/authStore'
import './Header.scss'

export function Header() {
  const loggedIn = authStore.isLoggedIn()
  const { data: cart } = useCart(loggedIn)
  const { data: me } = useMe(loggedIn)
  const [open, setOpen] = useState(false)
  const itemCount = cart?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0

  return (
    <header className="site-header">
      <div className="site-header__inner container">
        <Link to="/" className="site-header__logo" onClick={() => setOpen(false)}>
          <span className="site-header__mark" aria-hidden />
          Globuy Supply
        </Link>

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
          <span className="visually-hidden">Menu</span>
        </button>

        <nav
          id="site-nav"
          className={`site-header__nav ${open ? 'is-open' : ''}`}
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) =>
              isActive ? 'site-header__link is-active' : 'site-header__link'
            }
            onClick={() => setOpen(false)}
          >
            Home
          </NavLink>
          <NavLink
            to="/catalog"
            className={({ isActive }) =>
              isActive ? 'site-header__link is-active' : 'site-header__link'
            }
            onClick={() => setOpen(false)}
          >
            Catalog
          </NavLink>
          <NavLink
            to="/cart"
            className={({ isActive }) =>
              isActive ? 'site-header__link is-active' : 'site-header__link'
            }
            onClick={() => setOpen(false)}
          >
            Cart
            {itemCount > 0 && (
              <span className="site-header__badge">{itemCount}</span>
            )}
          </NavLink>
          <NavLink
            to="/login"
            className={({ isActive }) =>
              isActive ? 'site-header__link is-active' : 'site-header__link'
            }
            onClick={() => setOpen(false)}
          >
            {loggedIn ? me?.name ?? 'My account' : 'Account'}
          </NavLink>
          {loggedIn && me?.role === 'ADMIN' && (
            <NavLink
              to="/admin/products"
              className={({ isActive }) =>
                isActive ? 'site-header__link is-active' : 'site-header__link'
              }
              onClick={() => setOpen(false)}
            >
              Admin Products
            </NavLink>
          )}
        </nav>

        <div className="site-header__search" role="search">
          <label htmlFor="header-search" className="visually-hidden">
            Search products
          </label>
          <input
            id="header-search"
            type="search"
            placeholder="Search catalog…"
            className="site-header__input"
            autoComplete="off"
          />
        </div>
      </div>
    </header>
  )
}
