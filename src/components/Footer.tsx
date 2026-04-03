import { Link } from 'react-router-dom'
import './Footer.css'

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
                <Link to="/admin">Admin · Orders</Link>
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
