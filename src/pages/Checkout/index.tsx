/**
 * 结账页：
 * 支持「已保存地址」或手动填写；仅结算购物车中**已勾选**的在售行。
 */
import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart, useCreateOrder, useUserAddresses } from '../../hooks/apiHooks'
import { authStore } from '../../lib/auth/authStore'
import { useI18n } from '../../i18n/I18nProvider'
import { toErrorMessage } from '../../lib/http/error'
import './Checkout.scss'

export function Checkout() {
  const { t } = useI18n()
  const loggedIn = authStore.isLoggedIn()
  const { data: cart, isLoading } = useCart()
  const { data: addresses = [], isLoading: addrLoading } = useUserAddresses(loggedIn)
  const createOrderMutation = useCreateOrder()
  const navigate = useNavigate()
  const [couponCode, setCouponCode] = useState('')
  const [shipMode, setShipMode] = useState<'saved' | 'manual'>('manual')
  const [selectedAddrId, setSelectedAddrId] = useState<number | null>(null)
  const boot = useRef(false)

  useEffect(() => {
    if (addresses.length === 0) {
      setShipMode('manual')
      setSelectedAddrId(null)
      boot.current = false
      return
    }
    setSelectedAddrId((prev) => {
      if (prev != null && addresses.some((a) => a.id === prev)) return prev
      const pick = addresses.find((a) => a.isDefault) ?? addresses[0]
      return pick.id
    })
    if (!boot.current) {
      boot.current = true
      setShipMode('saved')
    }
  }, [addresses])

  const rows =
    cart?.items.filter((it) => {
      const selected = (it as { selected?: boolean }).selected !== false
      const active = (it as { productActive?: boolean }).productActive !== false
      return selected && active
    }) ?? []

  const itemCount = rows.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = Number(cart?.selectedSubtotal ?? cart?.totalAmount ?? 0)
  const currency = cart?.currency ?? 'USD'
  const [submitMsg, setSubmitMsg] = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const coupon = (couponCode || String(fd.get('couponCode') ?? '')).trim()
    const base = {
      cartItemIds: rows.map((r) => r.itemId),
      couponCode: coupon || undefined,
      taxNo: String(fd.get('taxNo') ?? '').trim() || undefined,
      shippingMethod: String(fd.get('shippingMethod') ?? '').trim() || undefined,
    }

    const useSaved = shipMode === 'saved' && addresses.length > 0 && selectedAddrId != null

    const payload = useSaved
      ? {
          ...base,
          savedAddressId: selectedAddrId!,
        }
      : (() => {
          const city = String(fd.get('city') ?? '').trim()
          const region = String(fd.get('region') ?? '').trim()
          const address2 = String(fd.get('address2') ?? '').trim()
          const lineMain = String(fd.get('address1') ?? '').trim()
          const composedLine = [lineMain, city, region, address2].filter(Boolean).join(', ')
          return {
            ...base,
            receiverName: String(fd.get('name') ?? '').trim(),
            receiverPhone: String(fd.get('phone') ?? '').trim(),
            country: String(fd.get('country') ?? '').trim(),
            addressLine: composedLine || lineMain,
            postalCode: String(fd.get('zip') ?? '').trim() || undefined,
            receiverCompany: String(fd.get('company') ?? '').trim() || undefined,
            receiverProvince: region || undefined,
            receiverCity: city || undefined,
          }
        })()

    try {
      setSubmitMsg(null)
      const resp = await createOrderMutation.mutateAsync(payload)
      navigate(`/orders/${encodeURIComponent(resp.orderNo)}`)
    } catch (err) {
      setSubmitMsg(toErrorMessage(err, t('checkout.failDefault')))
    }
  }

  if (isLoading || (loggedIn && addrLoading)) {
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
                    required={shipMode === 'manual'}
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
                    required={shipMode === 'manual'}
                    autoComplete="tel"
                    placeholder="+1 ···"
                  />
                </label>
              </div>
            </section>

            <section className="checkout__card">
              <h2 className="checkout__card-title">{t('checkout.shipTitle')}</h2>
              {addresses.length > 0 && (
                <div className="field-row" style={{ marginBottom: 12, gap: 16, display: 'flex', flexWrap: 'wrap' }}>
                  <label className="field" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="radio"
                      name="shipMode"
                      checked={shipMode === 'saved'}
                      onChange={() => setShipMode('saved')}
                    />
                    <span>{t('checkout.useSavedAddress')}</span>
                  </label>
                  <label className="field" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <input
                      type="radio"
                      name="shipMode"
                      checked={shipMode === 'manual'}
                      onChange={() => setShipMode('manual')}
                    />
                    <span>{t('checkout.fillManually')}</span>
                  </label>
                </div>
              )}

              {shipMode === 'saved' && addresses.length > 0 ? (
                <div className="checkout__saved-list">
                  <p className="field__label" style={{ marginBottom: 8 }}>
                    {t('checkout.pickAddress')}
                  </p>
                  <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                    {addresses.map((a) => (
                      <li key={a.id} style={{ marginBottom: 8 }}>
                        <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
                          <input
                            type="radio"
                            name="savedAddressId"
                            value={a.id}
                            checked={selectedAddrId === a.id}
                            onChange={() => setSelectedAddrId(a.id)}
                          />
                          <span style={{ fontSize: 14, lineHeight: 1.45 }}>
                            <strong>{a.receiverName}</strong> · {a.receiverPhone}
                            <br />
                            {a.country} {a.city ?? ''} {a.province ?? ''} · {a.addressLine}
                            {a.postalCode ? ` · ${a.postalCode}` : ''}
                            {a.isDefault ? ` · ${t('common.default')}` : ''}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <>
                  {addresses.length === 0 && (
                    <p className="checkout__legal" style={{ marginBottom: 12 }}>
                      {t('checkout.noSavedAddresses')}{' '}
                      <Link to="/user/addresses">{t('user.navAddresses')}</Link>
                    </p>
                  )}
                  <label className="field">
                    <span className="field__label">{t('checkout.company')}</span>
                    <input className="input" name="company" autoComplete="organization" />
                  </label>
                  <label className="field">
                    <span className="field__label">{t('checkout.address1')}</span>
                    <input className="input" name="address1" required autoComplete="address-line1" />
                  </label>
                  <label className="field">
                    <span className="field__label">{t('checkout.address2')}</span>
                    <input className="input" name="address2" autoComplete="address-line2" />
                  </label>
                  <label className="field">
                    <span className="field__label">{t('checkout.taxNo')}</span>
                    <input className="input" name="taxNo" />
                  </label>
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
                </>
              )}

              {shipMode === 'saved' && addresses.length > 0 && (
                <>
                  <label className="field" style={{ marginTop: 12 }}>
                    <span className="field__label">{t('checkout.taxNo')}</span>
                    <input className="input" name="taxNo" />
                  </label>
                  <label className="field">
                    <span className="field__label">{t('checkout.shipMethod')}</span>
                    <input className="input" name="shippingMethod" placeholder={t('checkout.shipMethodPh')} />
                  </label>
                </>
              )}
            </section>

            <section className="checkout__card">
              <h2 className="checkout__card-title">{t('checkout.promoTitle')}</h2>
              <label className="field">
                <span className="field__label">{t('checkout.couponCode')}</span>
                <input
                  className="input"
                  name="couponCode"
                  value={couponCode}
                  onChange={(ev) => setCouponCode(ev.target.value)}
                  placeholder={t('checkout.couponPlaceholder')}
                  autoComplete="off"
                />
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
              <p className="checkout__legal" style={{ fontSize: 12, opacity: 0.8 }}>
                {t('checkout.pricingNote')}
              </p>
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
