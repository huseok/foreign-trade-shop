/**
 * 购物车页：
 * 基于后端真实购物车接口，支持改数量、删除和金额汇总。
 */
import { Link } from 'react-router-dom'
import { useCart, useRemoveCartItem, useUpdateCartItem } from '../../hooks/apiHooks'
import { authStore } from '../../lib/auth/authStore'
import {
  getLocalCartItems,
  onLocalCartUpdated,
  removeLocalCartItem,
  updateLocalCartItem,
} from '../../lib/cart/localCart'
import { useEffect, useState } from 'react'
import { useI18n } from '../../i18n/I18nProvider'
import './Cart.scss'

export function Cart() {
  const { t } = useI18n()
  const loggedIn = authStore.isLoggedIn()
  const { data: cart, isLoading } = useCart(loggedIn)
  const [localItems, setLocalItems] = useState(() => getLocalCartItems())
  useEffect(() => onLocalCartUpdated(() => setLocalItems(getLocalCartItems())), [])
  const updateMutation = useUpdateCartItem()
  const removeMutation = useRemoveCartItem()
  const rows = loggedIn
    ? cart?.items ?? []
    : localItems.map((x) => ({
        itemId: x.productId,
        productId: x.productId,
        title: `${t('common.product')} #${x.productId}`,
        quantity: x.quantity,
        unitPrice: '0',
        currency: 'USD',
        lineAmount: '0',
        moq: 1,
      }))
  const itemCount = rows.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = Number(cart?.totalAmount ?? 0)
  const currency = cart?.currency ?? 'USD'

  const handleQtyChange = (itemId: number, qty: number) => {
    const row = rows.find((x) => x.itemId === itemId)
    const minQty = Math.max(1, Number((row as { moq?: number } | undefined)?.moq ?? 1))
    if (!loggedIn) {
      updateLocalCartItem(itemId, Math.max(minQty, qty))
      return
    }
    if (
      updateMutation.isPending &&
      updateMutation.variables?.itemId === itemId
    ) {
      return
    }
    if (removeMutation.isPending && removeMutation.variables === itemId) return
    void updateMutation.mutate({ itemId, payload: { quantity: Math.max(minQty, qty) } })
  }

  const handleRemove = (itemId: number) => {
    if (!loggedIn) {
      removeLocalCartItem(itemId)
      return
    }
    if (removeMutation.isPending && removeMutation.variables === itemId) return
    if (
      updateMutation.isPending &&
      updateMutation.variables?.itemId === itemId
    ) {
      return
    }
    void removeMutation.mutate(itemId)
  }

  return (
    <div className="cart page-pad">
      <div className="container">
        <header className="page-header">
          <h1 className="page-header__title">{t('cart.title')}</h1>
          <p className="page-header__desc">
            {loggedIn ? t('cart.descLoggedIn') : t('cart.descGuest')}
          </p>
        </header>

        {isLoading ? (
          <div className="cart__empty"><p>{t('common.loading')}</p></div>
        ) : itemCount === 0 ? (
          <div className="cart__empty">
            <p>{t('cart.empty')}</p>
            <Link to="/catalog" className="btn btn--primary">
              {t('common.browseCatalog')}
            </Link>
          </div>
        ) : (
          <div className="cart__layout">
            <div className="cart__table-wrap">
              <table className="cart-table">
                <thead>
                  <tr>
                    <th scope="col">{t('cart.colProduct')}</th>
                    <th scope="col">{t('cart.colPrice')}</th>
                    <th scope="col">{t('cart.colQty')}</th>
                    <th scope="col">{t('cart.colSubtotal')}</th>
                    <th scope="col">
                      <span className="visually-hidden">{t('common.remove')}</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((item) => {
                    const rowUpdating =
                      updateMutation.isPending &&
                      updateMutation.variables?.itemId === item.itemId
                    const rowRemoving =
                      removeMutation.isPending &&
                      removeMutation.variables === item.itemId
                    const rowBusy = rowUpdating || rowRemoving
                    return (
                    <tr key={item.itemId}>
                      <td>
                        <div className="cart-table__product">
                          <div
                            className="cart-table__thumb"
                            style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #0d9488 100%)' }}
                            role="img"
                            aria-hidden
                          />
                          <div>
                            <Link
                              to={`/products/${item.productId}`}
                              className="cart-table__name"
                            >
                              {item.title}
                            </Link>
                            <div className="cart-table__sku">ID: {item.productId}</div>
                          </div>
                        </div>
                      </td>
                      <td data-label={t('cart.colPrice')}>
                        {item.currency} {Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td data-label={t('cart.colQty')}>
                        <input
                          type="number"
                          min={Math.max(1, Number((item as { moq?: number }).moq ?? 1))}
                          className="input input--qty"
                          value={item.quantity}
                          disabled={rowBusy}
                          onChange={(e) =>
                            handleQtyChange(item.itemId, parseInt(e.target.value, 10) || 1)
                          }
                          aria-label={t('cart.removeAria').replace('{{title}}', item.title)}
                        />
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {t('product.moq')}: {Math.max(1, Number((item as { moq?: number }).moq ?? 1))}
                        </div>
                      </td>
                      <td data-label={t('cart.colSubtotal')}>
                        {item.currency} {Number(item.lineAmount).toFixed(2)}
                      </td>
                      <td data-label={t('common.remove')}>
                        <button
                          type="button"
                          className="cart-table__remove"
                          disabled={rowBusy}
                          onClick={() => handleRemove(item.itemId)}
                        >
                          {rowRemoving ? '…' : t('common.remove')}
                        </button>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <aside className="cart__summary">
              <h2 className="cart__summary-title">{t('cart.summaryTitle')}</h2>
              <div className="cart__summary-row">
                <span>{t('common.subtotal')}</span>
                <span>
                  {currency} {subtotal.toFixed(2)}
                </span>
              </div>
              <div className="cart__summary-row cart__summary-row--muted">
                <span>{t('common.shipping')}</span>
                <span>{t('common.calculatedAtCheckout')}</span>
              </div>
              <div className="cart__summary-total">
                <span>{t('common.estimated')}</span>
                <span>
                  {currency} {subtotal.toFixed(2)}
                </span>
              </div>
              <Link to="/checkout" className="btn btn--primary btn--block">
                {loggedIn ? t('cart.checkout') : t('cart.checkoutLogin')}
              </Link>
              {!loggedIn && (
                <Link to="/login" className="btn btn--ghost btn--block" style={{ marginTop: 8 }}>
                  {t('common.loginSync')}
                </Link>
              )}
              <Link to="/catalog" className="cart__continue">
                {t('common.continueShopping')}
              </Link>
            </aside>
          </div>
        )}
      </div>
    </div>
  )
}
