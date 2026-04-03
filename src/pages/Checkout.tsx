/**
 * 结账页：收集联系人与地址，提交时组装 StoredOrder 写入 OrdersContext，并清空购物车。
 */
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'
import { useOrders } from '../context/OrdersContext'
import { getProductById } from '../data/mockProducts'
import type { StoredOrder } from '../types/order'
import { createDemoOrderId } from '../utils/orderId'
import './Checkout.css'

export function Checkout() {
  const { lines, itemCount, clear } = useCart()
  const { addOrder } = useOrders()
  const navigate = useNavigate()

  const rows = lines.map((line) => {
    const p = getProductById(line.productId)
    return p ? { line, product: p } : null
  }).filter(Boolean) as {
    line: { productId: string; qty: number }
    product: NonNullable<ReturnType<typeof getProductById>>
  }[]

  const subtotal = rows.reduce(
    (sum, { line, product }) => sum + product.price * line.qty,
    0,
  )
  const currency = rows[0]?.product.currency ?? 'USD'

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const id = createDemoOrderId()

    // 快照行项目：含名称、SKU，订单详情不依赖后续 mock 商品是否仍存在
    const orderLines = rows.map(({ line, product }) => {
      const lineTotal = product.price * line.qty
      return {
        productId: product.id,
        name: product.name,
        sku: product.sku,
        qty: line.qty,
        unitPrice: product.price,
        lineTotal,
        currency: product.currency,
      }
    })

    const order: StoredOrder = {
      id,
      createdAt: new Date().toISOString(),
      status: 'pending',
      customer: {
        name: String(fd.get('name') ?? '').trim(),
        email: String(fd.get('email') ?? '').trim(),
        phone: String(fd.get('phone') ?? '').trim(),
        company: String(fd.get('company') ?? '').trim(),
      },
      shipping: {
        address1: String(fd.get('address1') ?? '').trim(),
        address2: String(fd.get('address2') ?? '').trim(),
        city: String(fd.get('city') ?? '').trim(),
        region: String(fd.get('region') ?? '').trim(),
        zip: String(fd.get('zip') ?? '').trim(),
        country: String(fd.get('country') ?? '').trim(),
      },
      notes: String(fd.get('notes') ?? '').trim(),
      lines: orderLines,
      subtotal,
      currency,
    }

    addOrder(order)
    clear()
    navigate(`/orders/${id}`)
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
            Demo form — submission navigates to a sample order page.
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
                {rows.map(({ line, product }) => (
                  <li key={product.id} className="checkout__line">
                    <span>
                      {product.name} × {line.qty}
                    </span>
                    <span>
                      {product.currency}{' '}
                      {(product.price * line.qty).toFixed(2)}
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
                Place order (demo)
              </button>
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
