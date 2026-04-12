/**
 * 商城页脚导航与版权条。
 */
import { Link } from 'react-router-dom'
import './Footer.scss'

export function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="site-footer__inner container">
        <div className="site-footer__brand">
          <span className="site-footer__logo-mark" aria-hidden />
          <strong>Globuy Supply</strong>
          <p className="site-footer__tagline">
            Sourcing, quality checks, and export-friendly documentation for
            growing brands.
          </p>
        </div>
        <div className="site-footer__cols">
          <div>
            <h3 className="site-footer__heading">Shop</h3>
            <ul className="site-footer__list">
              <li>
                <Link to="/catalog">Catalog</Link>
              </li>
              <li>
                <Link to="/cart">Cart</Link>
              </li>
              <li>
                <Link to="/checkout">Checkout</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="site-footer__heading">Company</h3>
            <ul className="site-footer__list">
              <li>
                <a href="#about">About</a>
              </li>
              <li>
                <a href="#shipping">Shipping</a>
              </li>
              <li>
                <a href="#returns">Returns</a>
              </li>
              <li>
                {/* 与商城顶栏一致：后台独立入口，避免与主购物流程混排 */}
                <Link to="/admin/login">商家后台</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="site-footer__heading">Legal</h3>
            <ul className="site-footer__list">
              <li>
                <a href="#privacy">Privacy Policy</a>
              </li>
              <li>
                <a href="#terms">Terms</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="site-footer__bar">
        <div className="container site-footer__bar-inner">
          <span>© {year} Globuy Supply. All rights reserved.</span>
        </div>
      </div>
    </footer>
  )
}
