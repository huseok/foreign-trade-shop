/**
 * 联系人页面：
 * 展示站点商务联系人信息，满足「姓名/WA/微信」需求。
 */
import { useI18n } from '../../i18n/I18nProvider'

export function ContactPage() {
  const { t } = useI18n()
  return (
    <section className="page-pad">
      <div className="container">
        <h1 className="page-header__title">{t('contact.title')}</h1>
        <p className="page-header__desc">{t('contact.desc')}</p>
        <div style={{ marginTop: 24, display: 'grid', gap: 12 }}>
          <div>
            {t('contact.name')}：CHZautokeys Team
          </div>
          <div>
            {t('contact.wa')}：+86 188-0000-0000
          </div>
          <div>
            {t('contact.wechat')}：CHZautokeys_Biz
          </div>
        </div>
      </div>
    </section>
  )
}
