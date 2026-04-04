/**
 * 管理员订单列表（演示）：只读 localStorage 中的订单，无登录校验。
 */
import { Link } from 'react-router-dom'
import { useOrders } from '../../context/OrdersContext'
import type { OrderStatus } from '../../types/order'
import './AdminOrders.scss'

function formatDate(iso: string) {
  try {
    return new Intl.DateTimeFormat('en', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(iso))
  } catch {
    return iso
  }
}

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

export function AdminOrders() {
  const { orders } = useOrders()

  const sorted = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )

  return (
    <div className="admin-orders page-pad">
      <div className="container">
        <header className="page-header">
          <p className="admin-orders__eyebrow">Admin</p>
          <h1 className="page-header__title">Orders</h1>
          <p className="page-header__desc">
            Demo: orders are stored in this browser (localStorage). Clear site
            data to reset.
          </p>
        </header>

        {sorted.length === 0 ? (
          <div className="admin-orders__empty">
            <p>No orders yet. Complete a checkout from the storefront to see data here.</p>
            <Link to="/catalog" className="btn btn--primary">
              Open catalog
            </Link>
          </div>
        ) : (
          <div className="admin-orders__table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th scope="col">Order</th>
                  <th scope="col">Date</th>
                  <th scope="col">Customer</th>
                  <th scope="col">Email</th>
                  <th scope="col">Total</th>
                  <th scope="col">Status</th>
                  <th scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((o) => (
                  <tr key={o.id}>
                    <td>
                      <code className="admin-table__id">{o.id}</code>
                    </td>
                    <td>{formatDate(o.createdAt)}</td>
                    <td>{o.customer.name || '—'}</td>
                    <td className="admin-table__email">{o.customer.email}</td>
                    <td>
                      {o.currency} {o.subtotal.toFixed(2)}
                    </td>
                    <td>
                      <span
                        className={`admin-table__status admin-table__status--${o.status}`}
                      >
                        {statusLabel(o.status)}
                      </span>
                    </td>
                    <td>
                      <Link
                        to={`/orders/${encodeURIComponent(o.id)}`}
                        className="admin-table__link"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
