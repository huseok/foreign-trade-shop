/**
 * 前台商品详情页（路由：`/products/:id` 与 `/product/:id`）。
 *
 * 职责概览：
 * - 展示主图（方形容器内完整显示，避免 800×800 等素材被裁切丢失信息）、缩略图切换、标题与标签。
 * - SKU 矩阵：从 `attrJson` 解析规格维度，用户选满维度后匹配唯一 SKU，展示价、库存、重量。
 * - 购买区：数量步进（受 MOQ 约束）、加入购物车、咨询客服、直接结算（未登录则先入本地车并引导登录）。
 * - 底部「热销推荐」：与首页热销区一致，调用活动商品列表作为占位数据源（无活动商品时列表可能为空）。
 *
 * 说明：`originCountry` 字段仍来自后端，界面文案使用「适合的市场」以符合业务表述；后续若后端拆分字段仅需改绑定数据源。
 */
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ProductCard } from '../../components/ProductCard'
import { useAddCartItem, useProductDetail, useStorefrontProducts } from '../../hooks/apiHooks'
import { useI18n } from '../../i18n/I18nProvider'
import { authStore } from '../../lib/auth/authStore'
import { addLocalCartItem } from '../../lib/cart/localCart'
import { resolveMediaUrl } from '../../lib/media/resolveMediaUrl'
import { toErrorMessage } from '../../lib/http/error'
import './ProductDetail.scss'

/** 详情接口中 SKU 列表项（与 OpenAPI 生成类型对齐的窄化结构，便于解析 attrJson）。 */
type SkuRow = {
  skuCode: string
  attrJson: string
  salePrice: number
  stockQty: number
  isActive: boolean
  weightKg?: number
}

export function ProductDetail() {
  const { t } = useI18n()
  const navigate = useNavigate()
  const { id: rawId } = useParams<{ id: string }>()
  const id = rawId ? Number(rawId) : undefined

  const { data: product, isLoading } = useProductDetail(id)
  const addItemMutation = useAddCartItem()

  /** 购买数量；不得低于 max(1, MOQ)。 */
  const [qty, setQty] = useState(1)
  /** 加入购物车 / 直接结算后的简短提示（成功或错误文案）。 */
  const [msg, setMsg] = useState<string | null>(null)
  /** 当前主图在 gallery 中的下标。 */
  const [mainImgIdx, setMainImgIdx] = useState(0)

  /** 从详情 payload 读取 SKU 矩阵（若未返回矩阵则为空数组）。 */
  const skus =
    ((product as unknown as { skus?: SkuRow[] })?.skus)?.filter(Boolean) ?? []

  /** 每个 SKU 附带解析后的属性键值，供维度下拉联动。 */
  const skuAttrMaps = useMemo(
    () =>
      skus.map((s) => {
        let attrs: Record<string, string> = {}
        try {
          attrs = JSON.parse(s.attrJson) as Record<string, string>
        } catch {
          attrs = {}
        }
        return { ...s, attrs }
      }),
    [skus],
  )

  /** 所有 SKU 上出现过的属性名（作为规格维度）。 */
  const attrNames = useMemo(
    () => Array.from(new Set(skuAttrMaps.flatMap((x) => Object.keys(x.attrs)))),
    [skuAttrMaps],
  )

  /** 用户为每个属性维度选中的取值；键为属性名，值为属性值。 */
  const [selectedAttrs, setSelectedAttrs] = useState<Record<string, string>>({})

  /**
   * 当且仅当用户为每个维度都选了值时，才能唯一匹配一条 SKU；
   * 否则 matchedSku 为 undefined，此时价格回退到商品主档价（与无矩阵商品一致）。
   */
  const matchedSku = skuAttrMaps.find((x) =>
    attrNames.every((n) => selectedAttrs[n] === x.attrs[n]),
  )

  /** 有矩阵时：匹配到的 SKU 须上架且有库存；无矩阵时默认可售（由详情页是否展示决定）。 */
  const isSkuAvailable = matchedSku ? matchedSku.isActive && matchedSku.stockQty > 0 : true

  const minQty = Math.max(1, product?.moq ?? 1)

  useEffect(() => {
    setQty((prev) => Math.max(prev, minQty))
  }, [minQty])

  useEffect(() => {
    setMainImgIdx(0)
  }, [product?.id])

  /** 底部热销区：优先拉「活动商品」分页；若为空则不再发第二个请求，由 UI 显示空状态即可。 */
  const { data: hotPaged } = useStorefrontProducts(
    { page: 0, size: 4, promo: true },
    Boolean(product?.id),
  )
  const hotBelow = useMemo(() => {
    const items = hotPaged?.items ?? []
    return items.filter((p) => p.id !== product?.id).slice(0, 4)
  }, [hotPaged?.items, product?.id])

  /**
   * 咨询入口：优先使用环境变量 `VITE_SUPPORT_EMAIL` 生成 mailto；
   * 未配置时退回站内 `/contact`，避免产生无效链接。
   */
  const supportHref = useMemo(() => {
    const mail = String(import.meta.env.VITE_SUPPORT_EMAIL ?? '').trim()
    if (mail.includes('@')) return `mailto:${mail}`
    return '/contact'
  }, [])

  if (isLoading) {
    return (
      <div className="page-pad">
        <div className="container narrow">
          <p>{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!product) {
    return (
      <div className="page-pad">
        <div className="container narrow">
          <h1 className="page-header__title">404</h1>
          <p className="page-header__desc">{t('product.notFoundTitle')}</p>
          <Link to="/catalog" className="btn btn--primary">
            {t('product.notFoundCta')}
          </Link>
        </div>
      </div>
    )
  }

  /**
   * 将当前商品以指定数量写入购物车（登录走服务端，游客写 localStorage）。
   * @returns 是否写入成功（失败时调用方不跳转结算）。
   */
  const persistCart = async (): Promise<boolean> => {
    try {
      if (authStore.isLoggedIn()) {
        await addItemMutation.mutateAsync({ productId: product.id, quantity: qty })
        setMsg(t('product.addCartOkLogged'))
      } else {
        addLocalCartItem(product.id, qty)
        setMsg(t('product.addCartOkGuest'))
      }
      return true
    } catch (err) {
      setMsg(toErrorMessage(err, t('product.buyNowFail')))
      return false
    }
  }

  const handleAdd = async () => {
    const ok = await persistCart()
    if (!ok) return
  }

  /**
   * 直接结算：必须先入车，再进入 `/checkout`（该路由受 RequireAuth 保护）。
   * 游客：入本地车后跳转登录页，并通过 `location.state.from` 在登录成功后回到结算页。
   */
  const handleBuyNow = async () => {
    const ok = await persistCart()
    if (!ok) return
    if (authStore.isLoggedIn()) {
      navigate('/checkout')
      return
    }
    setMsg(t('product.buyNowNeedLogin'))
    navigate('/login', { state: { from: '/checkout' }, replace: false })
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
            <span className="product-detail__cat">
              {t('product.targetMarket')}:{' '}
              {product.originCountry?.trim()
                ? product.originCountry
                : t('product.targetMarketFallback')}
            </span>
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
              SKU: {product.skuCode ?? '-'} · {t('product.moq')}: {product.moq}
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
                  const values = Array.from(
                    new Set(skuAttrMaps.map((x) => x.attrs[name]).filter(Boolean)),
                  )
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
              <h2 className="product-detail__specs-title">{t('product.specifications')}</h2>
              <ul className="product-detail__specs-list">
                <li>HS code: {product.hsCode ?? 'N/A'}</li>
                <li>Lead time: {product.leadTimeDays ?? '-'} days</li>
              </ul>
            </div>

            <p className="product-detail__shipping-note">{t('product.shippingNote')}</p>

            <div className="product-detail__buy">
              <span className="product-detail__qty-label" id="qty-label">
                {t('product.qty')}
              </span>
              <div className="product-detail__qty-row" role="group" aria-labelledby="qty-label">
                <button
                  type="button"
                  className="btn btn--ghost product-detail__qty-step"
                  aria-label={t('product.decQty')}
                  disabled={qty <= minQty}
                  onClick={() => setQty((q) => Math.max(minQty, q - 1))}
                >
                  −
                </button>
                <input
                  id="qty"
                  type="number"
                  min={minQty}
                  value={qty}
                  onChange={(e) =>
                    setQty(Math.max(minQty, parseInt(e.target.value, 10) || minQty))
                  }
                  className="input input--narrow product-detail__qty-input"
                  aria-valuemin={minQty}
                  aria-valuenow={qty}
                />
                <button
                  type="button"
                  className="btn btn--ghost product-detail__qty-step"
                  aria-label={t('product.incQty')}
                  onClick={() => setQty((q) => q + 1)}
                >
                  +
                </button>
                <span className="product-detail__moq-hint">
                  {t('product.moq')}: {minQty}
                </span>
              </div>

              <div className="product-detail__actions">
                <button
                  type="button"
                  className="btn btn--primary btn--lg"
                  onClick={() => void handleAdd()}
                  disabled={addItemMutation.isPending || !isSkuAvailable}
                >
                  {addItemMutation.isPending ? '…' : t('product.addCart')}
                </button>
                <a className="btn btn--ghost btn--lg" href={supportHref}>
                  {t('product.contactSupport')}
                </a>
                <button
                  type="button"
                  className="btn btn--primary btn--lg product-detail__buy-now"
                  onClick={() => void handleBuyNow()}
                  disabled={addItemMutation.isPending || !isSkuAvailable}
                >
                  {t('product.buyNow')}
                </button>
              </div>
              {msg && (
                <p className="product-detail__added" role="status">
                  {msg}{' '}
                  <Link to="/cart">{t('nav.cart')}</Link>.
                </p>
              )}
            </div>
          </div>
        </div>

        {hotBelow.length > 0 && (
          <section className="product-detail__below section" aria-label={t('product.hotBelowTitle')}>
            <div className="section-head">
              <h2 className="section-title">{t('product.hotBelowTitle')}</h2>
              <Link to="/catalog?promo=true" className="section-head__link">
                {t('home.featuredAll')}
              </Link>
            </div>
            <div className="product-grid product-grid--boutique">
              {hotBelow.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
