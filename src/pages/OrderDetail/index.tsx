/**
 * 订单详情：
 * 从后端按 orderNo 查询，支持确认收货与提交售后申请。
 */
import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { afterSalesApi } from '../../api/afterSales'
import { ordersApi } from '../../api/orders'
import { useOrderDetail } from '../../hooks/apiHooks'
import { toErrorMessage } from '../../lib/http/error'
import './OrderDetail.scss'

function statusLabel(s: string) {
  switch (s) {
    case 'PENDING_PAYMENT':
      return 'Pending payment'
    case 'PAID':
      return 'Paid'
    case 'SHIPPED':
      return 'Shipped'
    case 'DELIVERED':
      return 'Delivered'
    case 'COMPLETED':
      return 'Completed'
    default:
      return s
  }
}

export function OrderDetail() {
  const { id: rawId } = useParams<{ id: string }>()
  // 兼容 URL 编码的订单号
  const orderNo = rawId ? decodeURIComponent(rawId) : undefined
  const { data: order, isLoading, refetch } = useOrderDetail(orderNo)
  const [msg, setMsg] = useState<string | null>(null)

  const onConfirmCompleted = async () => {
    if (!order) return
    try {
      await ordersApi.confirmCompleted(order.orderNo)
      setMsg('Order marked as completed.')
      await refetch()
    } catch (err) {
      setMsg(toErrorMessage(err, 'Confirm failed'))
    }
  }

  const onCreateAfterSale = async () => {
    if (!order) return
    try {
      await afterSalesApi.create({
        orderNo: order.orderNo,
        content: 'Need after-sales support for this order.',
      })
      setMsg('After-sale ticket created.')
    } catch (err) {
      setMsg(toErrorMessage(err, 'Create after-sale failed'))
    }
  }

  if (isLoading) {
    return <div className="page-pad"><div className="container narrow"><p>Loading order...</p></div></div>
  }

  if (!orderNo || !order) {
    return (
      <div className="order page-pad">
        <div className="container narrow">
          <h1 className="page-header__title">Order not found</h1>
          <p className="page-header__desc">
            This order number does not exist in backend.
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
          <h1 className="page-header__title">{order.orderNo}</h1>
          <p className="page-header__desc">
            Status synchronized from backend.
          </p>
        </header>

        <div className="order__status">
          <span
            className={`order__badge order__badge--${order.status}`}
          >
            {statusLabel(order.status)}
          </span>
          <span className="order__meta">
            {order.currency} {Number(order.totalAmount).toFixed(2)} total
          </span>
        </div>
        {msg && <p className="order__text">{msg}</p>}

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
              {order.items.map((line) => (
                <tr key={`${line.productId}-${line.titleSnapshot}`}>
                  <td>{line.titleSnapshot}</td>
                  <td>{line.productId}</td>
                  <td>{line.quantity}</td>
                  <td>
                    {order.currency} {Number(line.priceSnapshot).toFixed(2)}
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
              <dd>{order.receiverName || '—'}</dd>
            </div>
            <div>
              <dt>Phone</dt>
              <dd>{order.receiverPhone || '—'}</dd>
            </div>
            {order.receiverCompany && (
              <div>
                <dt>Company</dt>
                <dd>{order.receiverCompany}</dd>
              </div>
            )}
            {order.taxNo && (
              <div>
                <dt>Tax No</dt>
                <dd>{order.taxNo}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="order__card">
          <h2 className="order__card-title">Shipping</h2>
          <p className="order__text order__address">
            {order.addressLine}
            <br />
            {order.postalCode ?? ''}
            <br />
            {order.country}
          </p>
          {order.trackingNo && (
            <div className="order__notes">
              <strong>Tracking</strong>
              <p className="order__text">
                {order.logisticsCompany ?? 'Carrier'} / {order.trackingNo}
              </p>
            </div>
          )}
        </section>

        <div className="order__actions">
          <button type="button" className="btn btn--primary" onClick={onConfirmCompleted}>
            Confirm completed
          </button>
          <button type="button" className="btn btn--ghost" onClick={onCreateAfterSale}>
            Request after-sale
          </button>
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
