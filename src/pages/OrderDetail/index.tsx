/**
 * 订单详情页：路由参数 `id` 实际为 **orderNo**（URL 编码）。
 *
 * 使用 `useOrderDetail` 与 `voyage.orders.getByOrderNo`；类型见 `voyageSdk` 生成 schema。
 */
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { voyage } from '../../openapi/voyageSdk'
import { useDictItems, useOrderDetail, useReorderToCart } from '../../hooks/apiHooks'
import { useDictLabel, useI18n } from '../../i18n/I18nProvider'
import { toErrorMessage } from '../../lib/http/error'
import { resolveMediaUrl } from '../../lib/media/resolveMediaUrl'
import './OrderDetail.scss'

export function OrderDetail() {
  const { t } = useI18n()
  const { id: rawId } = useParams<{ id: string }>()
  const orderNo = rawId ? decodeURIComponent(rawId) : undefined
  const { data: order, isLoading, refetch } = useOrderDetail(orderNo)
  const { data: orderStatusItems = [] } = useDictItems('ORDER_STATUS')
  const reorderMut = useReorderToCart()
  const navigate = useNavigate()
  const [msg, setMsg] = useState<string | null>(null)

  const labelForStatus = (code: string) =>
    orderStatusItems.find((i) => i.itemCode === code)?.itemLabel ?? code

  const statusText = useDictLabel(
    'ORDER_STATUS',
    order?.status ?? '',
    order ? labelForStatus(order.status) : '',
  )

  const onConfirmCompleted = async () => {
    if (!order) return
    try {
      await voyage.orders.confirmCompleted(order.orderNo)
      setMsg(t('order.msgConfirmed'))
      await refetch()
    } catch (err) {
      setMsg(toErrorMessage(err, t('order.failConfirm')))
    }
  }

  const onCreateAfterSale = async () => {
    if (!order) return
    try {
      await voyage.afterSales.create({
        orderNo: order.orderNo,
        content: 'Need after-sales support for this order.',
      })
      setMsg(t('order.msgAfterSale'))
    } catch (err) {
      setMsg(toErrorMessage(err, t('order.failAfterSale')))
    }
  }

  const onReorderToCart = async () => {
    if (!order) return
    try {
      setMsg(null)
      await reorderMut.mutateAsync(order.orderNo)
      navigate('/cart')
    } catch (err) {
      setMsg(toErrorMessage(err, t('order.reorderFail')))
    }
  }

  if (isLoading) {
    return (
      <div className="page-pad">
        <div className="container narrow">
          <p>{t('order.loading')}</p>
        </div>
      </div>
    )
  }

  if (!orderNo || !order) {
    return (
      <div className="order page-pad">
        <div className="container narrow">
          <h1 className="page-header__title">{t('order.notFoundTitle')}</h1>
          <p className="page-header__desc">{t('order.notFoundDesc')}</p>
          <div className="order__actions">
            <Link to="/catalog" className="btn btn--primary">
              {t('common.browseCatalog')}
            </Link>
            <Link to="/user/orders" className="btn btn--ghost">
              {t('order.myOrders')}
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
          <p className="order__eyebrow">{t('order.eyebrow')}</p>
          <h1 className="page-header__title">{order.orderNo}</h1>
          <p className="page-header__desc">{t('order.statusSynced')}</p>
        </header>

        <div className="order__status">
          <span className={`order__badge order__badge--${order.status}`}>{statusText}</span>
          <span className="order__meta">
            {t('order.payment')}: {order.paymentStatus} · {order.currency}{' '}
            {Number(order.totalAmount).toFixed(2)} {t('common.total')}
          </span>
        </div>
        <section className="order__card">
          <h2 className="order__card-title">{t('checkout.summaryTitle')}</h2>
          <dl className="order__dl">
            <div>
              <dt>{t('order.goodsSubtotal')}</dt>
              <dd>
                {order.currency} {Number(order.subtotalAmount).toFixed(2)}
              </dd>
            </div>
            {Number(order.discountMember) > 0 && (
              <div>
                <dt>{t('order.discMember')}</dt>
                <dd>
                  −{order.currency} {Number(order.discountMember).toFixed(2)}
                </dd>
              </div>
            )}
            {Number(order.discountPromo) > 0 && (
              <div>
                <dt>{t('order.discPromo')}</dt>
                <dd>
                  −{order.currency} {Number(order.discountPromo).toFixed(2)}
                </dd>
              </div>
            )}
            {Number(order.discountCoupon) > 0 && (
              <div>
                <dt>{t('order.discCoupon')}</dt>
                <dd>
                  −{order.currency} {Number(order.discountCoupon).toFixed(2)}
                  {order.couponCodeSnapshot ? ` (${order.couponCodeSnapshot})` : ''}
                </dd>
              </div>
            )}
            <div>
              <dt>{t('order.shippingLine')}</dt>
              <dd>
                {order.currency} {Number(order.shippingFee).toFixed(2)}
              </dd>
            </div>
          </dl>
        </section>
        {msg && <p className="order__text">{msg}</p>}
        <p className="order__text" style={{ opacity: 0.75, fontSize: 13 }}>
          {t('order.guestNoAdmin')}
        </p>

        <section className="order__card">
          <h2 className="order__card-title">{t('order.itemsTitle')}</h2>
          <table className="order-table">
            <thead>
              <tr>
                <th scope="col" className="order-table__col-thumb" />
                <th scope="col">{t('order.colItem')}</th>
                <th scope="col">{t('order.colSku')}</th>
                <th scope="col">{t('order.colQty')}</th>
                <th scope="col">{t('order.colPrice')}</th>
              </tr>
            </thead>
            <tbody>
              {order.items.map((line) => (
                <tr key={`${line.productId}-${line.titleSnapshot}`}>
                  <td>
                    {line.thumbUrl ? (
                      <img
                        src={resolveMediaUrl(line.thumbUrl)}
                        alt=""
                        width={48}
                        height={48}
                        style={{ objectFit: 'cover', borderRadius: 4 }}
                        loading="lazy"
                      />
                    ) : (
                      <span style={{ opacity: 0.35 }}>—</span>
                    )}
                  </td>
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
          <h2 className="order__card-title">{t('order.contactTitle')}</h2>
          <dl className="order__dl">
            <div>
              <dt>{t('order.name')}</dt>
              <dd>{order.receiverName || '?'}</dd>
            </div>
            <div>
              <dt>{t('order.phone')}</dt>
              <dd>{order.receiverPhone || '?'}</dd>
            </div>
            {order.receiverCompany && (
              <div>
                <dt>{t('order.company')}</dt>
                <dd>{order.receiverCompany}</dd>
              </div>
            )}
            {order.taxNo && (
              <div>
                <dt>{t('order.taxNo')}</dt>
                <dd>{order.taxNo}</dd>
              </div>
            )}
          </dl>
        </section>

        <section className="order__card">
          <h2 className="order__card-title">{t('order.shipTitle')}</h2>
          <p className="order__text order__address">
            {order.addressLine}
            <br />
            {[order.receiverCity, order.receiverProvince].filter(Boolean).length > 0 ? (
              <>
                {[order.receiverCity, order.receiverProvince].filter(Boolean).join(', ')}
                <br />
              </>
            ) : null}
            {order.postalCode ?? ''}
            <br />
            {order.country}
          </p>
          {order.trackingNo && (
            <div className="order__notes">
              <strong>{t('order.tracking')}</strong>
              <p className="order__text">
                {order.logisticsCompany ?? t('order.carrier')} / {order.trackingNo}
              </p>
            </div>
          )}
        </section>

        <div className="order__actions">
          <button type="button" className="btn btn--primary" onClick={onConfirmCompleted}>
            {t('order.confirmDone')}
          </button>
          <button type="button" className="btn btn--ghost" onClick={onCreateAfterSale}>
            {t('order.afterSale')}
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            disabled={reorderMut.isPending}
            onClick={() => void onReorderToCart()}
          >
            {t('order.reorderToCart')}
          </button>
          <Link to="/catalog" className="btn btn--primary">
            {t('common.continueShopping')}
          </Link>
          <Link to="/user/orders" className="btn btn--ghost">
            {t('order.myOrders')}
          </Link>
          <Link to="/" className="btn btn--ghost">
            {t('common.backHome')}
          </Link>
        </div>
      </div>
    </div>
  )
}
