import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAddCartItem, useProductDetail } from '../../hooks/apiHooks'
import { useI18n } from '../../i18n/I18nProvider'
import { authStore } from '../../lib/auth/authStore'
import { addLocalCartItem } from '../../lib/cart/localCart'
import { resolveMediaUrl } from '../../lib/media/resolveMediaUrl'
import { toErrorMessage } from '../../lib/http/error'
import './ProductDetail.scss'

export function ProductDetail() {
  const { t } = useI18n()
  const { id: rawId } = useParams<{ id: string }>()
  const id = rawId ? Number(rawId) : undefined
  const { data: product, isLoading } = useProductDetail(id)
  const addItemMutation = useAddCartItem()
  const [qty, setQty] = useState(1)
  const [msg, setMsg] = useState<string | null>(null)
  const [mainImgIdx, setMainImgIdx] = useState(0)
  const skus = ((product as unknown as { skus?: Array<{ skuCode: string; attrJson: string; salePrice: number; stockQty: number; isActive: boolean; weightKg?: number }> })?.skus) ?? []
  const skuAttrMaps = skus.map((s) => ({ ...s, attrs: JSON.parse(s.attrJson) as Record<string, string> }))
  const attrNames = Array.from(new Set(skuAttrMaps.flatMap((x) => Object.keys(x.attrs))))
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({})
  const matchedSku = skuAttrMaps.find((x) => attrNames.every((n) => selectedAttrs[n] === x.attrs[n]))
  const isSkuAvailable = matchedSku ? matchedSku.isActive && matchedSku.stockQty > 0 : true
  const minQty = Math.max(1, product?.moq ?? 1)
  useEffect(() => {
    setQty((prev) => Math.max(prev, minQty))
  }, [minQty])

  useEffect(() => {
    setMainImgIdx(0)
  }, [product?.id])

  if (isLoading) {
    return (
      <div className="page-pad">
        <div className="container narrow">
          <p>Loading…</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="page-pad">
        <div className="container narrow">
          <h1 className="page-header__title">404</h1>
          <p className="page-header__desc">商品不存在或已下架。</p>
          <Link to="/catalog" className="btn btn--primary">
            {t('nav.catalog')}
          </Link>
        </div>
      </div>
    )
  }
  const handleAdd = async () => {
    try {
      if (authStore.isLoggedIn()) {
        await addItemMutation.mutateAsync({ productId: product.id, quantity: qty })
        setMsg('Added — view cart.')
      } else {
        addLocalCartItem(product.id, qty)
        setMsg('已加入本地购物车，登录后会自动同步。')
      }
    } catch (err) {
      setMsg(toErrorMessage(err, 'Add to cart failed'))
    }
  }

  return (
    <div className="product-detail page-pad">
      <div className="container">
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">{t('nav.home')}</Link>
          <span aria-hidden> / </span>
          <Link to="/catalog">{t('nav.catalog')}</Link>
          <span aria-hidden> / </span>
          <span className="breadcrumb__current">{product.title}</span>
        </nav>

        <div className="product-detail__grid">
          <div className="product-detail__visual">
            {(() => {
              const imgs = product.images ?? []
              const cur = imgs[mainImgIdx] ?? imgs[0]
              const hero = cur ? resolveMediaUrl(cur.fullUrl || cur.thumbUrl) : ''
              return (
                <>
                  {hero ? (
                    <img className="product-detail__hero-img" src={hero} alt="" />
                  ) : (
                    <div
                      className="product-detail__media product-detail__media--fallback"
                      style={{
                        background: 'linear-gradient(135deg, #1e3a5f 0%, var(--primary, #2563eb) 100%)',
                      }}
                      role="img"
                      aria-label={product.title}
                    />
                  )}
                  {imgs.length > 1 && (
                    <div className="product-detail__thumbs" role="tablist" aria-label="Gallery">
                      {imgs.map((im, idx) => (
                        <button
                          key={`${im.thumbUrl}-${idx}`}
                          type="button"
                          className={`product-detail__thumb ${idx === mainImgIdx ? 'is-active' : ''}`}
                          onClick={() => setMainImgIdx(idx)}
                        >
                          <img src={resolveMediaUrl(im.thumbUrl)} alt="" loading="lazy" />
                        </button>
                      ))}
                    </div>
                  )}
                </>
              )
            })()}
          </div>

          <div className="product-detail__info">
            <span className="product-detail__cat">{product.originCountry ?? 'Global'}</span>
            <h1 className="product-detail__title">{product.title}</h1>
            {product.tags && product.tags.length > 0 && (
              <div className="product-detail__tags" aria-label={t('product.tags')}>
                {product.tags.map((tg) => (
                  <span key={tg.id} className="product-detail__tag">
                    {tg.name}
                  </span>
                ))}
              </div>
            )}
            <p className="product-detail__sku">
              SKU: {product.skuCode ?? '-'} · MOQ: {product.moq} units
            </p>
            <p className="product-detail__price">
              <span className="product-detail__amount">
                {matchedSku
                  ? `${product.currency ?? 'USD'} ${Number(matchedSku.salePrice).toFixed(2)}`
                  : product.price == null
                    ? '—'
                    : `${product.currency ?? 'USD'} ${Number(product.price).toFixed(2)}`}
              </span>
              <span className="product-detail__unit"> / unit</span>
            </p>
            {attrNames.length > 0 && (
              <div className="product-detail__specs">
                <h2 className="product-detail__specs-title">{t('product.specs')}</h2>
                {attrNames.map((name) => {
                  const values = Array.from(new Set(skuAttrMaps.map((x) => x.attrs[name]).filter(Boolean)))
                  return (
                    <div key={name} style={{ marginBottom: 8 }}>
                      <strong>{name}：</strong>
                      <select
                        className="input"
                        style={{ maxWidth: 220, marginLeft: 8 }}
                        value={selectedAttrs[name] ?? ''}
                        onChange={(e) =>
                          setSelectedAttrs((prev) => ({ ...prev, [name]: e.target.value }))
                        }
                      >
                        <option value="">请选择</option>
                        {values.map((v) => (
                          <option key={v} value={v}>
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>
                  )
                })}
                {matchedSku && (
                  <p style={{ marginTop: 8, color: isSkuAvailable ? 'var(--text)' : '#dc2626' }}>
                    {isSkuAvailable
                      ? `可售库存：${matchedSku.stockQty}，重量：${matchedSku.weightKg ?? '-'}kg`
                      : '该规格当前不可售'}
                  </p>
                )}
              </div>
            )}
            <p className="product-detail__desc">{product.description ?? t('product.noDesc')}</p>

            <div className="product-detail__specs">
              <h2 className="product-detail__specs-title">Specifications</h2>
              <ul className="product-detail__specs-list">
                <li>HS code: {product.hsCode ?? 'N/A'}</li>
                <li>Batch certificates available for qualified orders</li>
                <li>Lead time: {product.leadTimeDays ?? '-'} days</li>
              </ul>
            </div>

            <div className="product-detail__buy">
              <label htmlFor="qty" className="product-detail__qty-label">
                Quantity
              </label>
              <div className="product-detail__qty-row">
                <input
                  id="qty"
                  type="number"
                  min={minQty}
                  value={qty}
                  onChange={(e) =>
                    setQty(Math.max(minQty, parseInt(e.target.value, 10) || minQty))
                  }
                  className="input input--narrow"
                />
                <span style={{ fontSize: 12, color: 'var(--muted)' }}>最低起购：{minQty}</span>
                <button
                  type="button"
                  className="btn btn--primary btn--lg"
                  onClick={() => void handleAdd()}
                  disabled={addItemMutation.isPending || !isSkuAvailable}
                >
                  {addItemMutation.isPending ? '…' : t('product.addCart')}
                </button>
                {msg && (
                  <p className="product-detail__added" role="status">
                    {msg} <Link to="/cart">cart</Link>.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
