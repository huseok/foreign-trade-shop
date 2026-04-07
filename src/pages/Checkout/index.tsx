/**
 * 结账页：
 * 收集地址后调用后端创建订单，成功跳转到订单详情页。
 */
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart, useCreateOrder } from '../../hooks/apiHooks'
import { toErrorMessage } from '../../lib/http/error'
import './Checkout.scss'

export function Checkout() {
  const { data: cart, isLoading } = useCart()
  const createOrderMutation = useCreateOrder()
  const navigate = useNavigate()
  const rows = cart?.items ?? []
  const itemCount = rows.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = Number(cart?.totalAmount ?? 0)
  const currency = cart?.currency ?? 'USD'
  const [submitMsg, setSubmitMsg] = useState<string | null>(null)

  /**
   * 提交结账：
   * 把表单映射为后端 CreateOrderRequest，成功后跳转到 /orders/{orderNo}。
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      receiverName: String(fd.get('name') ?? '').trim(),
      receiverPhone: String(fd.get('phone') ?? '').trim(),
      country: String(fd.get('country') ?? '').trim(),
      addressLine: String(fd.get('address1') ?? '').trim(),
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
      setSubmitMsg(toErrorMessage(err, 'Place order failed'))
    }
  }

  if (isLoading) {
    return <div className="checkout page-pad"><div className="container narrow"><p>Loading cart...</p></div></div>
  }

  if (itemCount === 0) {
    return (
      <div className="checkout page-pad">
        <div className="container narrow">
          <h1 className="page-header__title">Checkout</h1>
          <p className="page-header__desc">Your cart is empty.</p>
          <Link to="/catalog" className="btn btn--primary">
            Browse catalog
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="checkout page-pad">
      <div className="container">
        <header className="page-header">
          <h1 className="page-header__title">Checkout</h1>
          <p className="page-header__desc">
            Submit address and create a real backend order.
          </p>
        </header>

        <form className="checkout__grid" onSubmit={handleSubmit}>
          <div className="checkout__forms">
            <section className="checkout__card">
              <h2 className="checkout__card-title">Contact</h2>
              <div className="field-row">
                <label className="field">
                  <span className="field__label">Full name</span>
                  <input
                    className="input"
                    name="name"
                    required
                    autoComplete="name"
                    placeholder="Jane Buyer"
                  />
                </label>
              </div>
              <div className="field-row field-row--2">
                <label className="field">
                  <span className="field__label">Email</span>
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
                  <span className="field__label">Phone</span>
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
              <h2 className="checkout__card-title">Shipping address</h2>
              <label className="field">
                <span className="field__label">Company (optional)</span>
                <input
                  className="input"
                  name="company"
                  autoComplete="organization"
                />
              </label>
              <label className="field">
                <span className="field__label">Address line 1</span>
                <input
                  className="input"
                  name="address1"
                  required
                  autoComplete="address-line1"
                />
              </label>
              <label className="field">
                <span className="field__label">Address line 2</span>
                <input className="input" name="address2" autoComplete="address-line2" />
              </label>
              <div className="field-row field-row--2">
                <label className="field">
                  <span className="field__label">Tax No (optional)</span>
                  <input className="input" name="taxNo" />
                </label>
                <label className="field">
                  <span className="field__label">Incoterm (optional)</span>
                  <input className="input" name="incoterm" placeholder="FOB" />
                </label>
              </div>
              <label className="field">
                <span className="field__label">Shipping method (optional)</span>
                <input className="input" name="shippingMethod" placeholder="SEA / AIR" />
              </label>
              <div className="field-row field-row--3">
                <label className="field">
                  <span className="field__label">City</span>
                  <input className="input" name="city" required autoComplete="address-level2" />
                </label>
                <label className="field">
                  <span className="field__label">Region</span>
                  <input className="input" name="region" autoComplete="address-level1" />
                </label>
                <label className="field">
                  <span className="field__label">Postal code</span>
                  <input className="input" name="zip" required autoComplete="postal-code" />
                </label>
              </div>
              <label className="field">
                <span className="field__label">Country</span>
                <select className="input" name="country" required autoComplete="country">
                  <option value="">Select</option>
                  <option value="US">United States</option>
                  <option value="GB">United Kingdom</option>
                  <option value="DE">Germany</option>
                  <option value="CN">China</option>
                  <option value="OTHER">Other</option>
                </select>
              </label>
            </section>

            <section className="checkout__card">
              <h2 className="checkout__card-title">Notes</h2>
              <label className="field">
                <span className="field__label">Order notes (optional)</span>
                <textarea
                  className="input input--textarea"
                  name="notes"
                  rows={3}
                  placeholder="Delivery window, customs references…"
                />
              </label>
            </section>
          </div>

          <aside className="checkout__aside">
            <div className="checkout__summary">
              <h2 className="checkout__summary-title">Order summary</h2>
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
                <span>Subtotal</span>
                <span>
                  {currency} {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="checkout__summary-row checkout__summary-row--muted">
                <span>Shipping</span>
                <span>TBD</span>
              </div>
              <div className="checkout__summary-total">
                <span>Total</span>
                <span>
                  {currency} {subtotal.toFixed(2)}
                </span>
              </div>
              <button type="submit" className="btn btn--primary btn--block">
                {createOrderMutation.isPending ? 'Placing order...' : 'Place order'}
              </button>
              {submitMsg && <p className="checkout__legal">{submitMsg}</p>}
              <p className="checkout__legal">
                By placing an order you agree to our Terms and Privacy Policy
                (placeholder).
              </p>
            </div>
          </aside>
        </form>
      </div>
    </div>
  )
}
