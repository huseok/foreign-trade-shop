/**
 * 结账页：
 * 收集地址后调用后端创建订单，成功跳转到订单详情页。
 */
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart, useCreateOrder } from '../../hooks/apiHooks'
import { useI18n } from '../../i18n/I18nProvider'
import { toErrorMessage } from '../../lib/http/error'
import './Checkout.scss'

export function Checkout() {
  const { t } = useI18n()
  const { data: cart, isLoading } = useCart()
  const createOrderMutation = useCreateOrder()
  const navigate = useNavigate()
  const rows = cart?.items ?? []
  const itemCount = rows.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = Number(cart?.totalAmount ?? 0)
  const currency = cart?.currency ?? 'USD'
  const [submitMsg, setSubmitMsg] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const city = String(fd.get('city') ?? '').trim()
    const region = String(fd.get('region') ?? '').trim()
    const address2 = String(fd.get('address2') ?? '').trim()
    const lineMain = String(fd.get('address1') ?? '').trim()
    const composedLine = [lineMain, city, region, address2].filter(Boolean).join(', ')
    const payload = {
      receiverName: String(fd.get('name') ?? '').trim(),
      receiverPhone: String(fd.get('phone') ?? '').trim(),
      country: String(fd.get('country') ?? '').trim(),
      addressLine: composedLine || lineMain,
      postalCode: String(fd.get('zip') ?? '').trim() || undefined,
      receiverCompany: String(fd.get('company') ?? '').trim() || undefined,
      taxNo: String(fd.get('taxNo') ?? '').trim() || undefined,
      incoterm: String(fd.get('incoterm') ?? '').trim() || undefined,
      shippingMethod: String(fd.get('shippingMethod') ?? '').trim() || undefined,
    }
    try {
      setSubmitMsg(null)
      const resp = await createOrderMutation.mutateAsync(payload)
      navigate(`/orders/${encodeURIComponent(resp.orderNo)}`)
    } catch (err) {
      setSubmitMsg(toErrorMessage(err, t('checkout.failDefault')))
    }
  }

  if (isLoading) {
    return (
      <div className="checkout page-pad">
        <div className="container narrow">
          <p>{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (itemCount === 0) {
    return (
      <div className="checkout page-pad">
        <div className="container narrow">
          <h1 className="page-header__title">{t('checkout.title')}</h1>
          <p className="page-header__desc">{t('checkout.empty')}</p>
          <Link to="/catalog" className="btn btn--primary">
            {t('common.browseCatalog')}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout page-pad">
      <div className="container">
        <header className="page-header">
          <h1 className="page-header__title">{t('checkout.title')}</h1>
          <p className="page-header__desc">{t('checkout.subtitle')}</p>
        </header>

        <form className="checkout__grid" onSubmit={handleSubmit}>
          <div className="checkout__forms">
            <section className="checkout__card">
              <h2 className="checkout__card-title">{t('checkout.contactTitle')}</h2>
              <div className="field-row">
                <label className="field">
                  <span className="field__label">{t('checkout.fullName')}</span>
                  <input
                    className="input"
                    name="name"
                    required
                    autoComplete="name"
                    placeholder={t('checkout.fullNamePh')}
                  />
                </label>
              </div>
              <div className="field-row field-row--2">
                <label className="field">
                  <span className="field__label">{t('checkout.email')}</span>
                  <input
                    className="input"
                    type="email"
                    name="email"
                    required
                    autoComplete="email"
                    placeholder="procurement@company.com"
                  />
                </label>
                <label className="field">
                  <span className="field__label">{t('checkout.phone')}</span>
                  <input
                    className="input"
                    type="tel"
                    name="phone"
                    required
                    autoComplete="tel"
                    placeholder="+1 ···"
                  />
                </label>
              </div>
            </section>

            <section className="checkout__card">
              <h2 className="checkout__card-title">{t('checkout.shipTitle')}</h2>
              <label className="field">
                <span className="field__label">{t('checkout.company')}</span>
                <input
                  className="input"
                  name="company"
                  autoComplete="organization"
                />
              </label>
              <label className="field">
                <span className="field__label">{t('checkout.address1')}</span>
                <input
                  className="input"
                  name="address1"
                  required
                  autoComplete="address-line1"
                />
              </label>
              <label className="field">
                <span className="field__label">{t('checkout.address2')}</span>
                <input className="input" name="address2" autoComplete="address-line2" />
              </label>
              <div className="field-row field-row--2">
                <label className="field">
                  <span className="field__label">{t('checkout.taxNo')}</span>
                  <input className="input" name="taxNo" />
                </label>
                <label className="field">
                  <span className="field__label">{t('checkout.incoterm')}</span>
                  <input className="input" name="incoterm" placeholder={t('checkout.incotermPh')} />
                </label>
              </div>
              <label className="field">
                <span className="field__label">{t('checkout.shipMethod')}</span>
                <input className="input" name="shippingMethod" placeholder={t('checkout.shipMethodPh')} />
              </label>
              <div className="field-row field-row--3">
                <label className="field">
                  <span className="field__label">{t('checkout.city')}</span>
                  <input className="input" name="city" required autoComplete="address-level2" />
                </label>
                <label className="field">
                  <span className="field__label">{t('checkout.region')}</span>
                  <input className="input" name="region" autoComplete="address-level1" />
                </label>
                <label className="field">
                  <span className="field__label">{t('checkout.postal')}</span>
                  <input className="input" name="zip" required autoComplete="postal-code" />
                </label>
              </div>
              <label className="field">
                <span className="field__label">{t('checkout.country')}</span>
                <select className="input" name="country" required autoComplete="country">
                  <option value="">{t('common.select')}</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="DE">Germany</option>
                  <option value="CN">China</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
            </section>

            <section className="checkout__card">
              <h2 className="checkout__card-title">{t('checkout.notesTitle')}</h2>
              <label className="field">
                <span className="field__label">{t('checkout.orderNotes')}</span>
                <textarea
                  className="input input--textarea"
                  name="notes"
                  rows={3}
                  placeholder={t('checkout.notesPh')}
                />
              </label>
            </section>
          </div>

          <aside className="checkout__aside">
            <div className="checkout__summary">
              <h2 className="checkout__summary-title">{t('checkout.summaryTitle')}</h2>
              <ul className="checkout__lines">
                {rows.map((item) => (
                  <li key={item.itemId} className="checkout__line">
                    <span>
                      {item.title} × {item.quantity}
                    </span>
                    <span>
                      {item.currency} {Number(item.lineAmount).toFixed(2)}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="checkout__summary-row">
                <span>{t('common.subtotal')}</span>
                <span>
                  {currency} {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="checkout__summary-row checkout__summary-row--muted">
                <span>{t('common.shipping')}</span>
                <span>{t('checkout.shipTbd')}</span>
              </div>
              <div className="checkout__summary-total">
                <span>{t('common.total')}</span>
                <span>
                  {currency} {subtotal.toFixed(2)}
                </span>
              </div>
              <button
                type="submit"
                className="btn btn--primary btn--block"
                disabled={createOrderMutation.isPending}
              >
                {createOrderMutation.isPending ? t('checkout.placing') : t('checkout.placeOrder')}
              </button>
              {submitMsg && <p className="checkout__legal">{submitMsg}</p>}
              <p className="checkout__legal">{t('common.termsHint')}</p>
            </div>
          </aside>
        </form>
      </div>
    </div>
  )
}
