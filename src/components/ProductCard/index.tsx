/**
 * 商品卡片：用于首页网格、目录列表等。
 *
 * - **默认模式**：主图/标题链到详情页；「查看」「加入购物车」分开展示。
 * - **目录紧凑模式**（`compactAddButton`）：整卡进详情；数量区展示**购物车中该商品件数**（未加购为 0），`InputNumber` 直接改购物车数量（低于起订量提交时抬到 MOQ，为 0 则移除行）；购物车图标按钮为「再按 MOQ 加一批」；「下单」写结账会话后进 `/checkout`。
 */
import { ShoppingCartOutlined } from '@ant-design/icons'
import { App, InputNumber } from 'antd'
import { type MouseEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { ProductDto } from '../../types/api'
import { useAddCartItem, useCart, useRemoveCartItem, useUpdateCartItem } from '../../hooks/apiHooks'
import { useI18n } from '../../i18n/useI18n'
import { i18nTpl } from '../../lib/i18nTpl'
import { authStore } from '../../lib/auth/authStore'
import { addLocalCartItem, getLocalCartItems, onLocalCartUpdated, setLocalCartQuantity } from '../../lib/cart/localCart'
import { writeCheckoutBuyNowSession } from '../../lib/cart/checkoutBuyNowSession'
import { toErrorMessage } from '../../lib/http/error'
import { productThumbUrl } from '../../lib/media/resolveMediaUrl'
import './ProductCard.scss'

type Props = {
  product: ProductDto
  /**
   * 目录列表用：紧凑操作区（整卡进详情、购物车图标按 MOQ 加购、数量与购物车同步、「下单」）。
   */
  compactAddButton?: boolean
}

/** 判断点击目标是否来自「不应触发整卡进详情」的交互子树（按钮、数字输入、加减手柄等）。 */
function isInteractiveTarget(el: EventTarget | null): boolean {
  if (el == null || !(el instanceof Element)) return false
  return Boolean(el.closest('button, a, input, .ant-input-number, .ant-input-number-handler'))
}

export function ProductCard({ product, compactAddButton = false }: Props) {
  const { t } = useI18n()
  const { message } = App.useApp()
  const navigate = useNavigate()
  const loggedIn = authStore.isLoggedIn()
  const { data: cart } = useCart(loggedIn)
  const addMutation = useAddCartItem()
  const updateMutation = useUpdateCartItem()
  const removeMutation = useRemoveCartItem()
  const [localBump, setLocalBump] = useState(0)
  /** 数量输入防抖定时器（毫秒），避免拖动 InputNumber 时频繁打购物车接口 */
  const qtyDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => onLocalCartUpdated(() => setLocalBump((x) => x + 1)), [])

  const moq = Math.max(1, product.moq ?? 1)

  const localQty = useMemo(() => {
    void localBump
    return getLocalCartItems().find((x) => x.productId === product.id)?.quantity ?? 0
  }, [localBump, product.id])

  const serverQty = useMemo(() => {
    const items = cart?.items
    if (!items?.length) return 0
    return items
      .filter((i) => String(i.productId) === String(product.id))
      .reduce((sum, i) => sum + i.quantity, 0)
  }, [cart, product.id])

  const inCartQty = loggedIn ? serverQty : localQty

  /** 当前商品在服务端购物车中的行 id（用于改数量）；无则 undefined */
  const serverLineItemId = useMemo(() => {
    if (!loggedIn || !cart?.items?.length) return undefined
    const hit = cart.items.find((i) => String(i.productId) === String(product.id))
    return hit?.itemId
  }, [loggedIn, cart?.items, product.id])

  const [optimisticQty, setOptimisticQty] = useState<number | null>(null)
  /** 目录紧凑模式：展示购物车中该商品件数；未在购物车为 0（不再用 MOQ 冒充展示值）。 */
  const baseQty = inCartQty
  const displayQty = optimisticQty ?? baseQty

  useEffect(() => {
    setOptimisticQty(null)
  }, [inCartQty, product.id])

  const flushQtyToCart = useCallback(
    (nextQty: number) => {
      const raw = Math.trunc(nextQty)
      if (raw <= 0) {
        if (loggedIn && serverLineItemId != null) {
          void removeMutation.mutateAsync(serverLineItemId).catch((err) => {
            message.error(toErrorMessage(err, t('catalog.addCartFail')))
          })
        } else {
          setLocalCartQuantity(product.id, 0)
        }
        return
      }
      const q = Math.max(moq, raw)
      if (!loggedIn) {
        setLocalCartQuantity(product.id, q)
        return
      }
      if (serverLineItemId != null) {
        void updateMutation.mutate({ itemId: serverLineItemId, payload: { quantity: q } })
        return
      }
      void addMutation.mutateAsync({ productId: product.id, quantity: q }).catch((err) => {
        message.error(toErrorMessage(err, t('catalog.addCartFail')))
      })
    },
    [
      addMutation,
      loggedIn,
      message,
      moq,
      product.id,
      removeMutation,
      serverLineItemId,
      t,
      updateMutation,
    ],
  )

  const scheduleQtyFlush = useCallback(
    (nextQty: number) => {
      if (qtyDebounceRef.current) clearTimeout(qtyDebounceRef.current)
      if (Math.trunc(nextQty) <= 0) {
        flushQtyToCart(0)
        return
      }
      qtyDebounceRef.current = setTimeout(() => {
        qtyDebounceRef.current = null
        flushQtyToCart(nextQty)
      }, 320)
    },
    [flushQtyToCart],
  )

  useEffect(
    () => () => {
      if (qtyDebounceRef.current) clearTimeout(qtyDebounceRef.current)
    },
    [],
  )

  const handleAdd = async (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!product.isActive) return
    try {
      if (loggedIn) {
        await addMutation.mutateAsync({ productId: product.id, quantity: moq })
        message.success(t('catalog.addCartOk'))
      } else {
        addLocalCartItem(product.id, moq)
        message.success(t('catalog.addCartOk'))
      }
    } catch (err) {
      message.error(toErrorMessage(err, t('catalog.addCartFail')))
    }
  }

  /**
   * 「下单」：把当前商品与输入数量写入结账桥接 session，进入结账页。
   * 结账页会只勾选这一行；未登录用户先走登录，登录成功后再进 `/checkout`。
   */
  const handleBuyNow = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    e.stopPropagation()
    if (!product.isActive) {
      message.warning(t('catalog.buyNowInactive'))
      return
    }
    const qty = Math.max(moq, displayQty)
    writeCheckoutBuyNowSession({ productId: product.id, quantity: qty })
    if (!loggedIn) {
      navigate('/login', { state: { from: '/checkout' } })
      return
    }
    navigate('/checkout')
  }

  const goDetail = () => {
    navigate(`/products/${encodeURIComponent(product.id)}`)
  }

  const onCardClick = (e: MouseEvent<HTMLElement>) => {
    if (isInteractiveTarget(e.target)) return
    goDetail()
  }

  const thumb = productThumbUrl(product)
  const addDisabled = !product.isActive || addMutation.isPending || removeMutation.isPending
  /** 目录数量：允许减到 0 表示从购物车移除；大于 0 时服务端/本地仍以 MOQ 为下限提交。 */
  const qtyInputMin = 0

  if (!compactAddButton) {
    return (
      <article className="product-card">
        <Link to={`/products/${product.id}`} className="product-card__media">
          {thumb ? (
            <img className="product-card__img product-card__img--photo" src={thumb} alt="" loading="lazy" />
          ) : (
            <div
              className="product-card__img"
              style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, var(--primary, #2563eb) 100%)' }}
              role="img"
              aria-label={product.title}
            />
          )}
        </Link>
        <div className="product-card__body">
          <span className="product-card__cat">{product.originCountry ?? 'Global'}</span>
          <h3 className="product-card__title">
            <Link to={`/products/${product.id}`}>{product.title}</Link>
          </h3>
          {product.tags && product.tags.length > 0 && (
            <div className="product-card__tags">
              {product.tags.map((tg) => (
                <span key={tg.id} className="product-card__tag">
                  {tg.name}
                </span>
              ))}
            </div>
          )}
          <p className="product-card__desc">{product.description ?? t('product.noDesc')}</p>
          <div className="product-card__footer">
            <span className="product-card__price">
              {product.price == null ? '-' : `${product.currency ?? 'USD'} ${Number(product.price).toFixed(2)}`}
            </span>
            <div className="product-card__actions">
              {inCartQty > 0 && (
                <span className="product-card__in-cart" aria-live="polite">
                  {i18nTpl(t('catalog.inCart'), { n: String(inCartQty) })}
                </span>
              )}
              <Link to={`/products/${product.id}`} className="product-card__cta">
                {t('product.view')}
              </Link>
              <button
                type="button"
                className="product-card__add"
                disabled={addDisabled}
                onClick={(e) => void handleAdd(e)}
                aria-label={t('product.addCart')}
              >
                {addMutation.isPending ? '…' : t('product.addCart')}
              </button>
            </div>
          </div>
        </div>
      </article>
    )
  }

  return (
    <article
      className="product-card product-card--compact-add"
      onClick={onCardClick}
      title={product.title}
    >
      {/* 紧凑模式：整块可点进详情，故此处不用 Link，避免嵌套交互与事件冒泡难控 */}
      <div className="product-card__media product-card__media--clickable">
        {thumb ? (
          <img className="product-card__img product-card__img--photo" src={thumb} alt="" loading="lazy" />
        ) : (
          <div
            className="product-card__img"
            style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, var(--primary, #2563eb) 100%)' }}
            role="img"
            aria-label={product.title}
          />
        )}
      </div>
      <div className="product-card__body">
        <span className="product-card__cat">{product.originCountry ?? 'Global'}</span>
        <h3 className="product-card__title">
          <span className="product-card__title-text">{product.title}</span>
        </h3>
        {product.tags && product.tags.length > 0 && (
          <div className="product-card__tags">
            {product.tags.map((tg) => (
              <span key={tg.id} className="product-card__tag">
                {tg.name}
              </span>
            ))}
          </div>
        )}
        <p className="product-card__desc">{product.description ?? t('product.noDesc')}</p>
        <div className="product-card__footer">
          <span className="product-card__price">
            {product.price == null ? '-' : `${product.currency ?? 'USD'} ${Number(product.price).toFixed(2)}`}
          </span>
          <div className="product-card__catalog-actions" onClick={(e) => e.stopPropagation()}>
            <div className="product-card__qty-row">
              <span className="product-card__qty-label">{t('catalog.cartQtyLabel')}</span>
              <InputNumber
                min={qtyInputMin}
                max={999999}
                size="small"
                value={displayQty}
                disabled={!product.isActive || updateMutation.isPending || removeMutation.isPending}
                onChange={(v) => {
                  if (v === null || v === undefined) {
                    setOptimisticQty(null)
                    return
                  }
                  const n = typeof v === 'number' && Number.isFinite(v) ? Math.trunc(v) : 0
                  const clamped = Math.max(0, n)
                  setOptimisticQty(clamped)
                  scheduleQtyFlush(clamped)
                }}
                aria-label={t('catalog.cartQtyLabel')}
              />
            </div>
            <p className="product-card__moq-hint" aria-live="polite">
              {i18nTpl(t('catalog.cartMoqHint'), { n: String(moq) })}
            </p>
            <div className="product-card__btn-row">
              <button
                type="button"
                className="product-card__add product-card__add--cart-icon"
                disabled={addDisabled}
                onClick={(e) => void handleAdd(e)}
                aria-label={t('catalog.addMoqToCartAria')}
              >
                {addMutation.isPending ? (
                  '…'
                ) : (
                  <ShoppingCartOutlined className="product-card__cart-ico" aria-hidden />
                )}
              </button>
              <button
                type="button"
                className="product-card__buy-now"
                disabled={!product.isActive}
                onClick={handleBuyNow}
              >
                {t('catalog.buyNow')}
              </button>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}
