/**
 * 商城页脚导航与版权条。
 */
import { Link } from 'react-router-dom'
import { useI18n } from '../../i18n/I18nProvider'
import { i18nTpl } from '../../lib/i18nTpl'
import './Footer.scss'

export function Footer() {
  const { t } = useI18n()
  const year = new Date().getFullYear()

  return (
    <footer className="site-footer">
      <div className="site-footer__inner container">
        <div className="site-footer__brand">
          <img
            src={`${import.meta.env.BASE_URL}favicon.png`}
            alt=""
            className="site-footer__logo-mark"
            width={40}
            height={40}
            decoding="async"
          />
          <strong>{t('brand')}</strong>
          <p className="site-footer__tagline">{t('footer.tagline')}</p>
        </div>
        <div className="site-footer__cols">
          <div>
            <h3 className="site-footer__heading">{t('footer.shop')}</h3>
            <ul className="site-footer__list">
              <li>
                <Link to="/catalog">{t('nav.catalog')}</Link>
              </li>
              <li>
                <Link to="/cart">{t('nav.cart')}</Link>
              </li>
              <li>
                <Link to="/checkout">{t('checkout.title')}</Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="site-footer__heading">{t('footer.company')}</h3>
            <ul className="site-footer__list">
              <li>
                <a href="#about">{t('footer.about')}</a>
              </li>
              <li>
                <a href="#shipping">{t('footer.shipping')}</a>
              </li>
              <li>
                <a href="#returns">{t('footer.returns')}</a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="site-footer__heading">{t('footer.legal')}</h3>
            <ul className="site-footer__list">
              <li>
                <a href="#privacy">{t('footer.privacy')}</a>
              </li>
              <li>
                <a href="#terms">{t('footer.terms')}</a>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="site-footer__bar">
        <div className="container site-footer__bar-inner">
          <span>{i18nTpl(t('footer.rights'), { year: String(year) })}</span>
        </div>
      </div>
    </footer>
  )
}
