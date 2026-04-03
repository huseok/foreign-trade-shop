/**
 * 订单详情：从 OrdersContext 按 URL 参数 id 取单；无则显示未找到。
 */
import { Link, useParams } from 'react-router-dom'
import { useOrders } from '../context/OrdersContext'
import type { OrderStatus } from '../types/order'
import './OrderDetail.css'

function statusLabel(s: OrderStatus) {
  switch (s) {
    case 'pending':
      return 'Pending payment'
    case 'paid':
      return 'Paid'
    case 'fulfilled':
      return 'Fulfilled'
    case 'cancelled':
      return 'Cancelled'
    default:
      return s
  }
}

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'full',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

export function OrderDetail() {
  const { id: rawId } = useParams<{ id: string }>()
  // 兼容 URL 编码的订单号
  const id = rawId ? decodeURIComponent(rawId) : undefined
  const { getOrderById } = useOrders()
  const order = getOrderById(id)

  if (!id || !order) {
    return (
      <div className="order page-pad">
        <div className="container narrow">
          <h1 className="page-header__title">Order not found</h1>
          <p className="page-header__desc">
            This order ID is not in local storage. It may have been cleared or
            never placed in this browser.
          </p>
          <div className="order__actions">
            <Link to="/catalog" className="btn btn--primary">
              Browse catalog
            </Link>
            <Link to="/admin" className="btn btn--ghost">
              Admin orders
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="order page-pad">
      <div className="container narrow">
        <header className="page-header">
          <p className="order__eyebrow">Order</p>
          <h1 className="page-header__title">{order.id}</h1>
          <p className="page-header__desc">
            Placed {formatDate(order.createdAt)}
          </p>
        </header>

        <div className="order__status">
          <span
            className={`order__badge order__badge--${order.status}`}
          >
            {statusLabel(order.status)}
          </span>
          <span className="order__meta">
            {order.currency} {order.subtotal.toFixed(2)} total
          </span>
        </div>

        <section className="order__card">
          <h2 className="order__card-title">Line items</h2>
          <table className="order-table">
            <thead>
              <tr>
                <th scope="col">Item</th>
                <th scope="col">SKU</th>
                <th scope="col">Qty</th>
                <th scope="col">Price</th>
              </tr>
            </thead>
            <tbody>
              {order.lines.map((line) => (
                <tr key={`${line.productId}-${line.sku}`}>
                  <td>{line.name}</td>
                  <td>{line.sku}</td>
                  <td>{line.qty}</td>
                  <td>
                    {line.currency}{' '}
                    {line.lineTotal.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        <section className="order__card">
          <h2 className="order__card-title">Contact</h2>
          <dl className="order__dl">
            <div>
              <dt>Name</dt>
              <dd>{order.customer.name || '—'}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>
                <a href={`mailto:${order.customer.email}`}>
                  {order.customer.email || '—'}
                </a>
              </dd>
            </div>
            {order.customer.phone && (
              <div>
                <dt>Phone</dt>
                <dd>{order.customer.phone}</dd>
              </div>
            )}
            {order.customer.company && (
              <div>
                <dt>Company</dt>
                <dd>{order.customer.company}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="order__card">
          <h2 className="order__card-title">Shipping</h2>
          <p className="order__text order__address">
            {order.shipping.address1}
            {order.shipping.address2 ? (
              <>
                <br />
                {order.shipping.address2}
              </>
            ) : null}
            <br />
            {order.shipping.city}
            {order.shipping.region ? `, ${order.shipping.region}` : ''}{' '}
            {order.shipping.zip}
            <br />
            {order.shipping.country}
          </p>
          {order.notes && (
            <div className="order__notes">
              <strong>Notes</strong>
              <p className="order__text">{order.notes}</p>
            </div>
          )}
        </section>

        <div className="order__actions">
          <Link to="/catalog" className="btn btn--primary">
            Continue shopping
          </Link>
          <Link to="/admin" className="btn btn--ghost">
            All orders (admin)
          </Link>
          <Link to="/" className="btn btn--ghost">
            Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
