/** Product card for catalog / home grids: link to detail, add to cart (server or local). */
import { App } from 'antd'
import { type MouseEvent, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import type { ProductDto } from '../../types/api'
import { useAddCartItem, useCart } from '../../hooks/apiHooks'
import { useI18n } from '../../i18n/useI18n'
import { i18nTpl } from '../../lib/i18nTpl'
import { authStore } from '../../lib/auth/authStore'
import { addLocalCartItem, getLocalCartItems, onLocalCartUpdated } from '../../lib/cart/localCart'
import { toErrorMessage } from '../../lib/http/error'
import { productThumbUrl } from '../../lib/media/resolveMediaUrl'
import './ProductCard.scss'

type Props = {
  product: ProductDto
  /**
   * 目录列表用：加购为主按钮紧凑「+」圆钮，隐藏「查看」以省横向空间；仍可通过主图与标题进入详情。
   */
  compactAddButton?: boolean
}

export function ProductCard({ product, compactAddButton = false }: Props) {
  const { t } = useI18n()
  const { message } = App.useApp()
  const loggedIn = authStore.isLoggedIn()
  const { data: cart } = useCart(loggedIn)
  const addMutation = useAddCartItem()
  const [localBump, setLocalBump] = useState(0)

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
      .filter((i) => i.productId === product.id)
      .reduce((sum, i) => sum + i.quantity, 0)
  }, [cart, product.id])

  const inCartQty = loggedIn ? serverQty : localQty

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

  const thumb = productThumbUrl(product)
  const addDisabled = !product.isActive || addMutation.isPending

  return (
    <article className={compactAddButton ? 'product-card product-card--compact-add' : 'product-card'}>
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
            {!compactAddButton ? (
              <Link to={`/products/${product.id}`} className="product-card__cta">
                {t('product.view')}
              </Link>
            ) : null}
            <button
              type="button"
              className="product-card__add"
              disabled={addDisabled}
              onClick={(e) => void handleAdd(e)}
              aria-label={t('product.addCart')}
            >
              {addMutation.isPending ? '…' : compactAddButton ? '+' : t('product.addCart')}
            </button>
          </div>
        </div>
      </div>
    </article>
  )
}
