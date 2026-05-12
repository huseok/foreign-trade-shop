/**
 * Cart page: server cart when logged in; guest cart uses localStorage and fetches product details by id for thumbs/titles.
 */
import { useQueries } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { useMemo, useEffect, useState } from 'react'
import {
  queryKeys,
  useBulkDeleteCartItems,
  useCart,
  useClearCart,
  useRemoveCartItem,
  useUpdateCartItem,
  useUpdateCartSelection,
} from '../../hooks/apiHooks'
import { authStore } from '../../lib/auth/authStore'
import {
  getLocalCartItems,
  onLocalCartUpdated,
  removeLocalCartItem,
  updateLocalCartItem,
} from '../../lib/cart/localCart'
import { useI18n } from '../../i18n/I18nProvider'
import { productThumbUrl } from '../../lib/media/resolveMediaUrl'
import { voyage } from '../../openapi/voyageSdk'
import './Cart.scss'

const CART_PRODUCT_STALE_MS = 5 * 60 * 1000

type ResolvedRow = {
  itemId: number
  productId: number
  title: string
  quantity: number
  unitPrice: string
  currency: string
  lineAmount: string
  moq: number
  thumbUrl: string
  selected: boolean
  productActive: boolean
}

export function Cart() {
  const { t } = useI18n()
  const loggedIn = authStore.isLoggedIn()
  const { data: cart, isLoading } = useCart(loggedIn)
  const [localItems, setLocalItems] = useState(() => getLocalCartItems())
  useEffect(() => onLocalCartUpdated(() => setLocalItems(getLocalCartItems())), [])
  const updateMutation = useUpdateCartItem()
  const removeMutation = useRemoveCartItem()
  const selectionMutation = useUpdateCartSelection()
  const bulkDeleteMutation = useBulkDeleteCartItems()
  const clearMutation = useClearCart()

  const rows = useMemo(
    () =>
      loggedIn
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
            selected: true,
            productActive: true,
          })),
    [loggedIn, cart?.items, localItems, t],
  )

  const productIds = useMemo(() => [...new Set(rows.map((r) => r.productId))], [rows])

  const productQueries = useQueries({
    queries: productIds.map((id) => ({
      queryKey: queryKeys.product(id),
      queryFn: () => voyage.products.getById(id),
      staleTime: CART_PRODUCT_STALE_MS,
      gcTime: 15 * 60 * 1000,
      enabled: productIds.length > 0,
    })),
  })

  const metaByProductId = useMemo(() => {
    const m = new Map<number, { thumb: string; title?: string; moq: number }>()
    productIds.forEach((id, i) => {
      const p = productQueries[i]?.data
      const moq = Math.max(1, p?.moq ?? 1)
      m.set(id, {
        thumb: productThumbUrl(p ?? {}),
        title: p?.title,
        moq,
      })
    })
    return m
  }, [productIds, productQueries])

  const rowsResolved: ResolvedRow[] = useMemo(
    () =>
      rows.map((row) => {
        const meta = metaByProductId.get(row.productId)
        const moq = Math.max(1, Number((row as { moq?: number }).moq ?? meta?.moq ?? 1))
        const title = meta?.title && !loggedIn ? meta.title : row.title
        const serverThumb = (row as { thumbUrl?: string | null }).thumbUrl
        const thumbUrl = (serverThumb && serverThumb.length > 0 ? serverThumb : null) ?? meta?.thumb ?? ''
        const selected =
          !loggedIn ? true : (row as { selected?: boolean }).selected !== false
        const productActive =
          !loggedIn ? true : (row as { productActive?: boolean }).productActive !== false
        return { ...row, title, moq, thumbUrl, selected, productActive }
      }),
    [rows, metaByProductId, loggedIn],
  )

  const itemCount = rowsResolved.reduce((sum, item) => sum + item.quantity, 0)
  const currency = cart?.currency ?? 'USD'
  const subtotalAll = Number(cart?.totalAmount ?? 0)
  const subtotalSelected = Number(cart?.selectedSubtotal ?? cart?.totalAmount ?? 0)
  const summaryAmount = loggedIn ? subtotalSelected : subtotalAll

  const activeRows = useMemo(
    () => rowsResolved.filter((r) => r.productActive),
    [rowsResolved],
  )
  const allActiveSelected =
    loggedIn &&
    activeRows.length > 0 &&
    activeRows.every((r) => r.selected)

  const selectedIds = useMemo(
    () => rowsResolved.filter((r) => r.selected).map((r) => r.itemId),
    [rowsResolved],
  )

  const selectionBusy = selectionMutation.isPending || bulkDeleteMutation.isPending || clearMutation.isPending

  const handleQtyChange = (itemId: number, qty: number) => {
    const row = rowsResolved.find((x) => x.itemId === itemId)
    const minQty = Math.max(1, Number(row?.moq ?? 1))
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

  const toggleRowSelected = (item: ResolvedRow) => {
    if (!loggedIn || !item.productActive || selectionBusy) return
    void selectionMutation.mutate({
      itemIds: [item.itemId],
      selected: !item.selected,
    })
  }

  const toggleSelectAll = () => {
    if (!loggedIn || activeRows.length === 0 || selectionBusy) return
    void selectionMutation.mutate({
      itemIds: activeRows.map((r) => r.itemId),
      selected: !allActiveSelected,
    })
  }

  const deleteSelected = () => {
    if (!loggedIn || selectedIds.length === 0 || selectionBusy) return
    void bulkDeleteMutation.mutate({ itemIds: selectedIds })
  }

  const clearServerCart = () => {
    if (!loggedIn || selectionBusy) return
    void clearMutation.mutate()
  }

  const checkoutDisabled = loggedIn && subtotalSelected <= 0

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
              {loggedIn && (
                <div className="cart__toolbar" style={{ marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                  <label style={{ display: 'inline-flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={allActiveSelected}
                      disabled={selectionBusy || activeRows.length === 0}
                      onChange={toggleSelectAll}
                    />
                    <span>{t('cart.selectAll')}</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn--ghost"
                    disabled={selectionBusy || selectedIds.length === 0}
                    onClick={deleteSelected}
                  >
                    {t('cart.deleteSelected')}
                  </button>
                  <button type="button" className="btn btn--ghost" disabled={selectionBusy} onClick={clearServerCart}>
                    {t('cart.clearCart')}
                  </button>
                </div>
              )}
              <table className="cart-table">
                <thead>
                  <tr>
                    {loggedIn && (
                      <th scope="col" className="cart-table__col-check">
                        <span className="visually-hidden">{t('cart.colSelect')}</span>
                      </th>
                    )}
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
                  {rowsResolved.map((item) => {
                    const rowUpdating =
                      updateMutation.isPending &&
                      updateMutation.variables?.itemId === item.itemId
                    const rowRemoving =
                      removeMutation.isPending &&
                      removeMutation.variables === item.itemId
                    const rowBusy = rowUpdating || rowRemoving || selectionBusy
                    const minQ = Math.max(1, Number(item.moq ?? 1))
                    return (
                    <tr key={item.itemId} className={!item.productActive ? 'cart-table__row--inactive' : undefined}>
                      {loggedIn && (
                        <td data-label={t('cart.colSelect')}>
                          <input
                            type="checkbox"
                            checked={item.selected}
                            disabled={rowBusy || !item.productActive}
                            onChange={() => toggleRowSelected(item)}
                            aria-label={t('cart.colSelect')}
                          />
                        </td>
                      )}
                      <td>
                        <div className="cart-table__product">
                          <div className="cart-table__thumb" role="img" aria-hidden={!item.thumbUrl}>
                            {item.thumbUrl ? (
                              <img className="cart-table__thumb-img" src={item.thumbUrl} alt="" loading="lazy" />
                            ) : null}
                          </div>
                          <div>
                            <Link
                              to={`/products/${item.productId}`}
                              className="cart-table__name"
                            >
                              {item.title}
                            </Link>
                            <div className="cart-table__sku">ID: {item.productId}</div>
                            {loggedIn && !item.productActive && (
                              <div style={{ fontSize: 12, color: 'var(--danger, #c00)' }}>{t('cart.inactive')}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td data-label={t('cart.colPrice')}>
                        {item.currency} {Number(item.unitPrice).toFixed(2)}
                      </td>
                      <td data-label={t('cart.colQty')}>
                        <input
                          type="number"
                          min={minQ}
                          className="input input--qty"
                          value={item.quantity}
                          disabled={rowBusy || (loggedIn && !item.productActive)}
                          onChange={(e) =>
                            handleQtyChange(item.itemId, parseInt(e.target.value, 10) || 1)
                          }
                          aria-label={t('cart.removeAria').replace('{{title}}', item.title)}
                        />
                        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                          {t('product.moq')}: {minQ}
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
                          {rowRemoving ? '...' : t('common.remove')}
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
              {loggedIn && (
                <div className="cart__summary-row cart__summary-row--muted">
                  <span>{t('cart.cartTotal')}</span>
                  <span>
                    {currency} {subtotalAll.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="cart__summary-row">
                <span>{loggedIn ? t('cart.selectedSubtotal') : t('common.subtotal')}</span>
                <span>
                  {currency} {summaryAmount.toFixed(2)}
                </span>
              </div>
              <div className="cart__summary-row cart__summary-row--muted">
                <span>{t('common.shipping')}</span>
                <span>{t('common.calculatedAtCheckout')}</span>
              </div>
              <div className="cart__summary-total">
                <span>{t('common.estimated')}</span>
                <span>
                  {currency} {summaryAmount.toFixed(2)}
                </span>
              </div>
              {checkoutDisabled ? (
                <p className="cart__summary-hint" style={{ fontSize: 13, margin: '8px 0' }}>
                  {t('cart.checkoutNeedSelection')}
                </p>
              ) : null}
              <Link
                to="/checkout"
                className="btn btn--primary btn--block"
                aria-disabled={checkoutDisabled}
                onClick={(e) => {
                  if (checkoutDisabled) e.preventDefault()
                }}
                style={checkoutDisabled ? { pointerEvents: 'none', opacity: 0.55 } : undefined}
              >
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
