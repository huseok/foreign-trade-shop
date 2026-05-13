/**
 * 购物车页：登录态走服务端购物车；访客态为 localStorage，并按商品 id 拉详情补全缩略图、标题、价格与上下架。
 *
 * 登录态与访客态均支持：全选（仅上架行参与「全选为勾选」）、行勾选、按勾选计算已选小计；下架行未勾选时置灰且不可勾选，
 * 已勾选的下架行可取消勾选或移除；勾选上架行时行背景为浅杏色高亮。
 * 勾选下架商品点「去结算」时弹窗说明，并可一键移除全部下架行。
 */
import { App, Button, Modal } from 'antd'
import { useQueries } from '@tanstack/react-query'
import { type MouseEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
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
  clearLocalCart,
  getLocalCartItems,
  onLocalCartUpdated,
  removeLocalCartItem,
  setLocalCartItemSelected,
  updateLocalCartItem,
} from '../../lib/cart/localCart'
import { useI18n } from '../../i18n/useI18n'
import { productThumbUrl } from '../../lib/media/resolveMediaUrl'
import { voyage } from '../../openapi/voyageSdk'
import './Cart.scss'

const CART_PRODUCT_STALE_MS = 5 * 60 * 1000

/** 行点击切换勾选时，忽略来自可独立交互的子元素（避免与链接、数量框等冲突）。 */
function isCartRowInteractiveTarget(el: EventTarget | null): boolean {
  if (el == null || !(el instanceof Element)) return false
  return Boolean(el.closest('button, a, input, label, textarea, select'))
}

type ResolvedRow = {
  /** 登录态为后端购物车行 id（数字）；访客态为商品 publicId 字符串（与本地车一致）。 */
  itemId: number | string
  productId: string
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
  const { modal } = App.useApp()
  const loggedIn = authStore.isLoggedIn()
  const { data: cart, isLoading } = useCart(loggedIn)
  const [localItems, setLocalItems] = useState(() => getLocalCartItems())
  useEffect(() => onLocalCartUpdated(() => setLocalItems(getLocalCartItems())), [])
  const bumpLocal = useCallback(() => setLocalItems(getLocalCartItems()), [])
  const updateMutation = useUpdateCartItem()
  const removeMutation = useRemoveCartItem()
  const selectionMutation = useUpdateCartSelection()
  const bulkDeleteMutation = useBulkDeleteCartItems()
  const clearMutation = useClearCart()

  const rows = useMemo(
    () =>
      loggedIn
        ? (cart?.items ?? []).map((it) => ({
            ...it,
            productId: String(it.productId),
          }))
        : [...localItems]
            .sort((a, b) => a.productId.localeCompare(b.productId, 'en', { numeric: true }))
            .map((x) => ({
              itemId: x.productId,
              productId: x.productId,
              title: `${t('common.product')} #${x.productId}`,
              quantity: x.quantity,
              unitPrice: '0',
              currency: 'USD',
              lineAmount: '0',
              moq: 1,
              selected: x.selected !== false,
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
    const m = new Map<
      string,
      { thumb: string; title?: string; moq: number; unitPrice: number; currency: string; isActive: boolean }
    >()
    productIds.forEach((id, i) => {
      const p = productQueries[i]?.data
      const moq = Math.max(1, p?.moq ?? 1)
      const unitPrice = p?.price != null && Number.isFinite(Number(p.price)) ? Number(p.price) : 0
      const currency = (p?.currency ?? 'USD').trim() || 'USD'
      const isActive = p ? p.isActive !== false : true
      m.set(id, {
        thumb: productThumbUrl(p ?? {}),
        title: p?.title,
        moq,
        unitPrice,
        currency,
        isActive,
      })
    })
    return m
  }, [productIds, productQueries])

  const rowsResolved: ResolvedRow[] = useMemo(
    () =>
      rows.map((row) => {
        const meta = metaByProductId.get(row.productId)
        const moq = Math.max(1, Number((row as { moq?: number }).moq ?? meta?.moq ?? 1))
        const title =
          meta?.title ??
          (loggedIn ? row.title : `${t('common.product')} #${row.productId}`)
        const serverThumb = (row as { thumbUrl?: string | null }).thumbUrl
        const thumbUrl = (serverThumb && serverThumb.length > 0 ? serverThumb : null) ?? meta?.thumb ?? ''

        const unitPriceNum = loggedIn
          ? Number((row as { unitPrice?: string }).unitPrice ?? 0)
          : Number(meta?.unitPrice ?? 0)
        const unitPrice = unitPriceNum.toFixed(2)
        const lineAmount = (unitPriceNum * row.quantity).toFixed(2)

        const currency = loggedIn
          ? String((row as { currency?: string }).currency ?? 'USD')
          : meta?.currency ?? 'USD'

        const selected = (row as { selected?: boolean }).selected !== false
        const productActive = loggedIn
          ? (row as { productActive?: boolean }).productActive !== false
          : meta?.isActive !== false

        return {
          ...row,
          title,
          moq,
          thumbUrl,
          unitPrice,
          lineAmount,
          currency,
          selected,
          productActive,
        }
      }),
    [rows, metaByProductId, loggedIn, t],
  )

  /** 稳定展示顺序：先按商品 id，再按购物车行 id（避免接口顺序抖动）。 */
  const rowsSorted: ResolvedRow[] = useMemo(() => {
    const copy = [...rowsResolved]
    copy.sort((a, b) => {
      const pc = a.productId.localeCompare(b.productId, 'en', { numeric: true })
      if (pc !== 0) return pc
      const na = typeof a.itemId === 'number' ? a.itemId : Number(a.itemId) || 0
      const nb = typeof b.itemId === 'number' ? b.itemId : Number(b.itemId) || 0
      return na - nb
    })
    return copy
  }, [rowsResolved])

  const itemCount = rowsResolved.reduce((sum, item) => sum + item.quantity, 0)
  const currency = cart?.currency ?? rowsSorted[0]?.currency ?? 'USD'
  const subtotalAll = Number(cart?.totalAmount ?? 0)
  const subtotalSelected = Number(cart?.selectedSubtotal ?? cart?.totalAmount ?? 0)

  const guestSubtotalAll = useMemo(() => {
    if (loggedIn) return 0
    return rowsResolved.reduce((s, r) => s + Number(r.lineAmount), 0)
  }, [loggedIn, rowsResolved])

  const selectedCheckoutableSubtotal = useMemo(
    () =>
      rowsResolved.filter((r) => r.selected && r.productActive).reduce((s, r) => s + Number(r.lineAmount), 0),
    [rowsResolved],
  )

  const summaryAmount = loggedIn ? subtotalSelected : selectedCheckoutableSubtotal

  const activeRows = useMemo(() => rowsSorted.filter((r) => r.productActive), [rowsSorted])
  const allRowsSelected = activeRows.length > 0 && activeRows.every((r) => r.selected)

  const hasSelectedInactive = useMemo(
    () => rowsResolved.some((r) => r.selected && !r.productActive),
    [rowsResolved],
  )

  const selectedIds = useMemo(
    () =>
      rowsResolved
        .filter((r) => r.selected && typeof r.itemId === 'number')
        .map((r) => r.itemId as number),
    [rowsResolved],
  )

  const selectionBusy =
    selectionMutation.isPending || bulkDeleteMutation.isPending || clearMutation.isPending

  const handleQtyChange = (itemId: number | string, qty: number) => {
    const row = rowsResolved.find((x) => x.itemId === itemId)
    const minQty = Math.max(1, Number(row?.moq ?? 1))
    if (!loggedIn) {
      updateLocalCartItem(String(itemId), Math.max(minQty, qty))
      bumpLocal()
      return
    }
    if (typeof itemId !== 'number') return
    if (
      updateMutation.isPending &&
      updateMutation.variables?.itemId === itemId
    ) {
      return
    }
    if (removeMutation.isPending && removeMutation.variables === itemId) return
    void updateMutation.mutate({ itemId, payload: { quantity: Math.max(minQty, qty) } })
  }

  const handleRemove = (itemId: number | string) => {
    if (!loggedIn) {
      removeLocalCartItem(String(itemId))
      bumpLocal()
      return
    }
    if (typeof itemId !== 'number') return
    if (removeMutation.isPending && removeMutation.variables === itemId) return
    if (
      updateMutation.isPending &&
      updateMutation.variables?.itemId === itemId
    ) {
      return
    }
    void removeMutation.mutate(itemId)
  }

  const removeAllInactiveLines = useCallback(() => {
    if (loggedIn) {
      const ids = rowsResolved
        .filter((r) => !r.productActive && typeof r.itemId === 'number')
        .map((r) => r.itemId as number)
      if (ids.length > 0) void bulkDeleteMutation.mutate({ itemIds: ids })
    } else {
      rowsResolved.filter((r) => !r.productActive).forEach((r) => removeLocalCartItem(String(r.productId)))
      bumpLocal()
    }
    Modal.destroyAll()
  }, [loggedIn, rowsResolved, bulkDeleteMutation, bumpLocal])

  const openInactiveCheckoutModal = useCallback(() => {
    modal.warning({
      title: t('cart.checkoutInactiveTitle'),
      content: (
        <div className="cart__inactive-modal">
          <p className="cart__inactive-modal-text">{t('cart.checkoutInactiveBody')}</p>
          <Button type="primary" danger className="cart__inactive-modal-btn" onClick={() => removeAllInactiveLines()}>
            {t('cart.removeAllInactive')}
          </Button>
        </div>
      ),
    })
  }, [modal, removeAllInactiveLines, t])

  const toggleRowSelected = useCallback(
    (item: ResolvedRow) => {
      if (!item.productActive && !item.selected) return
      if (selectionBusy && loggedIn) return
      if (!loggedIn) {
        setLocalCartItemSelected(item.productId, !item.selected)
        bumpLocal()
        return
      }
      if (typeof item.itemId !== 'number') return
      void selectionMutation.mutate({
        itemIds: [item.itemId],
        selected: !item.selected,
      })
    },
    [loggedIn, selectionBusy, selectionMutation, bumpLocal],
  )

  const onRowClick = useCallback(
    (item: ResolvedRow, e: MouseEvent<HTMLTableRowElement>) => {
      if (!item.productActive && !item.selected) return
      if (selectionBusy && loggedIn) return
      if (isCartRowInteractiveTarget(e.target)) return
      toggleRowSelected(item)
    },
    [loggedIn, selectionBusy, toggleRowSelected],
  )

  const toggleSelectAll = () => {
    if (rowsSorted.length === 0) return
    if (selectionBusy && loggedIn) return
    const turningOn = !allRowsSelected
    if (!loggedIn) {
      if (turningOn) {
        activeRows.forEach((r) => setLocalCartItemSelected(r.productId, true))
      } else {
        rowsSorted.forEach((r) => setLocalCartItemSelected(r.productId, false))
      }
      bumpLocal()
      return
    }
    if (selectionBusy) return
    if (turningOn) {
      const ids = rowsSorted.filter((r) => r.productActive).map((r) => r.itemId).filter((id): id is number => typeof id === 'number')
      if (ids.length === 0) return
      void selectionMutation.mutate({ itemIds: ids, selected: true })
    } else {
      const ids = rowsSorted.map((r) => r.itemId).filter((id): id is number => typeof id === 'number')
      if (ids.length === 0) return
      void selectionMutation.mutate({ itemIds: ids, selected: false })
    }
  }

  const deleteSelected = () => {
    if (selectionBusy && loggedIn) return
    if (!loggedIn) {
      rowsResolved.filter((r) => r.selected).forEach((r) => removeLocalCartItem(String(r.productId)))
      bumpLocal()
      return
    }
    if (selectedIds.length === 0 || selectionBusy) return
    void bulkDeleteMutation.mutate({ itemIds: selectedIds })
  }

  const clearEntireCart = () => {
    if (selectionBusy && loggedIn) return
    if (!loggedIn) {
      clearLocalCart()
      bumpLocal()
      return
    }
    if (selectionBusy) return
    void clearMutation.mutate()
  }

  /** 无可结算的已选上架金额且未勾选下架行时禁用（仅勾选下架时仍可点进弹窗）。 */
  const checkoutDisabled = selectedCheckoutableSubtotal <= 0 && !hasSelectedInactive

  const handleCheckoutNavClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!hasSelectedInactive) return
    e.preventDefault()
    openInactiveCheckoutModal()
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
              <div className="cart__toolbar">
                <label className="cart__toolbar-label">
                  <input
                    type="checkbox"
                    checked={allRowsSelected}
                    disabled={(selectionBusy && loggedIn) || rowsSorted.length === 0}
                    onChange={toggleSelectAll}
                  />
                  <span>{t('cart.selectAll')}</span>
                </label>
                <button
                  type="button"
                  className="btn btn--ghost cart__toolbar-btn"
                  disabled={(selectionBusy && loggedIn) || !rowsResolved.some((r) => r.selected)}
                  onClick={deleteSelected}
                >
                  {t('cart.deleteSelected')}
                </button>
                <button
                  type="button"
                  className="btn btn--ghost cart__toolbar-btn"
                  disabled={selectionBusy && loggedIn}
                  onClick={clearEntireCart}
                >
                  {t('cart.clearCart')}
                </button>
              </div>
              <table className="cart-table">
                <thead>
                  <tr>
                    <th scope="col" className="cart-table__col-check">
                      <span className="visually-hidden">{t('cart.colSelect')}</span>
                    </th>
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
                  {rowsSorted.map((item) => {
                    const rowUpdating =
                      updateMutation.isPending &&
                      updateMutation.variables?.itemId === item.itemId
                    const rowRemoving =
                      removeMutation.isPending &&
                      removeMutation.variables === item.itemId
                    const rowBusy = rowUpdating || rowRemoving || (selectionBusy && loggedIn)
                    const minQ = Math.max(1, Number(item.moq ?? 1))
                    const inactiveUnselected = !item.productActive && !item.selected
                    const rowClass = [
                      !item.productActive ? 'cart-table__row--inactive' : '',
                      inactiveUnselected ? 'cart-table__row--inactive-muted' : '',
                      item.selected ? 'cart-table__row--selected' : '',
                    ]
                      .filter(Boolean)
                      .join(' ')
                    return (
                    <tr
                      key={String(item.itemId)}
                      className={rowClass || undefined}
                      onClick={(e) => onRowClick(item, e)}
                      style={{
                        cursor: inactiveUnselected ? 'default' : 'pointer',
                      }}
                    >
                      <td data-label={t('cart.colSelect')}>
                        <input
                          type="checkbox"
                          checked={item.selected}
                          disabled={rowBusy || inactiveUnselected}
                          onChange={() => toggleRowSelected(item)}
                          aria-label={t('cart.colSelect')}
                        />
                      </td>
                      <td>
                        <div className="cart-table__product">
                          <Link
                            to={`/products/${encodeURIComponent(item.productId)}`}
                            className="cart-table__thumb-link"
                            aria-label={t('product.view')}
                          >
                            <div className="cart-table__thumb" role="img" aria-hidden={!item.thumbUrl}>
                              {item.thumbUrl ? (
                                <img className="cart-table__thumb-img" src={item.thumbUrl} alt="" loading="lazy" />
                              ) : null}
                            </div>
                          </Link>
                          <div>
                            <Link
                              to={`/products/${encodeURIComponent(item.productId)}`}
                              className="cart-table__name"
                            >
                              {item.title}
                            </Link>
                            <div className="cart-table__sku">ID: {item.productId}</div>
                            {!item.productActive && (
                              <div className="cart-table__inactive-badge">{t('cart.inactive')}</div>
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
                          disabled={rowBusy || !item.productActive}
                          onChange={(e) =>
                            handleQtyChange(item.itemId, parseInt(e.target.value, 10) || 1)
                          }
                          aria-label={t('cart.removeAria').replace('{{title}}', item.title)}
                        />
                        <div className="cart-table__moq-hint">
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
              {!loggedIn && (
                <div className="cart__summary-row cart__summary-row--muted">
                  <span>{t('cart.cartTotal')}</span>
                  <span>
                    {currency} {guestSubtotalAll.toFixed(2)}
                  </span>
                </div>
              )}
              <div className="cart__summary-row">
                <span>{t('cart.selectedSubtotal')}</span>
                <span>
                  {currency} {(loggedIn ? summaryAmount : selectedCheckoutableSubtotal).toFixed(2)}
                </span>
              </div>
              <div className="cart__summary-row cart__summary-row--muted">
                <span>{t('common.shipping')}</span>
                <span>{t('common.calculatedAtCheckout')}</span>
              </div>
              <div className="cart__summary-total">
                <span>{t('common.estimated')}</span>
                <span>
                  {currency} {(loggedIn ? summaryAmount : selectedCheckoutableSubtotal).toFixed(2)}
                </span>
              </div>
              {checkoutDisabled ? (
                <p className="cart__summary-hint">{t('cart.checkoutNeedSelection')}</p>
              ) : null}
              <Link
                to="/checkout"
                className={`btn btn--primary btn--block cart__checkout-btn${checkoutDisabled ? ' cart__checkout-btn--disabled' : ''}`}
                aria-disabled={checkoutDisabled}
                onClick={(e) => {
                  if (checkoutDisabled) e.preventDefault()
                  else handleCheckoutNavClick(e)
                }}
              >
                {loggedIn ? t('cart.checkout') : t('cart.checkoutLogin')}
              </Link>
              {!loggedIn && (
                <Link to="/login" className="btn btn--ghost btn--block cart__checkout-secondary">
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
