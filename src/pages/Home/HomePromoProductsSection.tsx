import { Carousel } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useStorefrontProducts, useStorefrontSettings, useStorefrontTags } from '../../hooks/apiHooks'
import { useI18n } from '../../i18n/I18nProvider'
import { HOME_PROMO_ZONE_TAG_CODE } from '../../lib/homePromoZone'
import { productThumbUrl } from '../../lib/media/resolveMediaUrl'
import type { ProductDto } from '../../types/api'

function chunk<T>(arr: T[], size: number): T[][] {
  const s = Math.max(1, size)
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += s) out.push(arr.slice(i, i + s))
  return out
}

function usePromoProductsChunkSize(): number {
  const [n, setN] = useState(3)
  useEffect(() => {
    const calc = () => {
      const w = window.innerWidth
      if (w <= 576) setN(1)
      else if (w <= 992) setN(2)
      else setN(3)
    }
    calc()
    window.addEventListener('resize', calc)
    return () => window.removeEventListener('resize', calc)
  }, [])
  return n
}

function HomePromoProductCard({ product }: { product: ProductDto }) {
  const { t } = useI18n()
  const thumb = productThumbUrl(product)
  const cur = product.currency ?? 'USD'
  const sale =
    product.price != null ? Number(product.price).toFixed(2) : null
  const list =
    product.listPrice != null ? Number(product.listPrice).toFixed(2) : null
  const showStrike =
    list != null &&
    sale != null &&
    Number(product.listPrice) > Number(product.price)

  return (
    <Link to={`/products/${product.id}`} className="home-promo-products__card">
      <div className="home-promo-products__media">
        {thumb ? (
          <img src={thumb} alt="" loading="lazy" />
        ) : (
          <div className="home-promo-products__placeholder" role="presentation" />
        )}
      </div>
      <div className="home-promo-products__meta">
        <h3 className="home-promo-products__name">{product.title}</h3>
        <div className="home-promo-products__prices">
          {showStrike ? (
            <>
              <div className="home-promo-products__price-row">
                <span className="home-promo-products__lbl">{t('home.promoProductsWas')}</span>
                <span className="home-promo-products__orig">
                  {cur} {list}
                </span>
              </div>
              <div className="home-promo-products__price-row">
                <span className="home-promo-products__lbl">{t('home.promoProductsNow')}</span>
                <span className="home-promo-products__sale">
                  {cur} {sale}
                </span>
              </div>
            </>
          ) : (
            <span className="home-promo-products__sale">
              {sale == null ? '—' : `${cur} ${sale}`}
            </span>
          )}
        </div>
      </div>
    </Link>
  )
}

function HomePromoProductsCarousel({
  slides,
  chunkSize,
}: {
  slides: ProductDto[][]
  chunkSize: number
}) {
  const [activeIdx, setActiveIdx] = useState(0)
  const total = slides.length

  useEffect(() => {
    setActiveIdx(0)
  }, [chunkSize, total])

  return (
    <div className="home-carousel-block">
      <Carousel
        key={chunkSize}
        autoplay
        autoplaySpeed={4800}
        dots={{ className: 'home-carousel-block__dots' }}
        className="home-promo-products__carousel"
        afterChange={setActiveIdx}
      >
        {slides.map((group, idx) => (
          <div key={idx}>
            <div
              className="home-promo-products__row"
              style={{
                gridTemplateColumns: `repeat(${group.length}, minmax(0, 1fr))`,
              }}
            >
              {group.map((product) => (
                <HomePromoProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        ))}
      </Carousel>
      {total > 0 ? (
        <p className="home-carousel-block__index" aria-live="polite">
          {activeIdx + 1} / {total}
        </p>
      ) : null}
    </div>
  )
}

/** 热门活动上方：标签编码由 GET /api/v1/storefront/settings 配置；划线价可选用于原价/现价对比 */
export function HomePromoProductsSection() {
  const { t } = useI18n()
  const { data: settings, isLoading: settingsLoading } = useStorefrontSettings()
  const tagCode = useMemo(() => {
    const raw = settings?.homePromoZoneTagCode?.trim()
    if (raw) return raw.toUpperCase()
    return HOME_PROMO_ZONE_TAG_CODE
  }, [settings])

  const { data: tags = [] } = useStorefrontTags()
  const zoneTag = tags.find((tg) => tg.code === tagCode)
  const tagId = zoneTag?.id

  const { data, isLoading: productsLoading } = useStorefrontProducts(
    { page: 0, size: 24, tagId },
    tagId != null,
  )

  const items = data?.items ?? []
  const chunkSize = usePromoProductsChunkSize()
  const slides = useMemo(() => chunk(items, chunkSize), [items, chunkSize])

  const loading = settingsLoading || (tagId != null && productsLoading)

  if (!settingsLoading && tagId == null) return null
  if (!loading && items.length === 0) return null

  if (loading) {
    return (
      <div className="home-promo-products">
        <h2 className="section-title home-promo-products__heading">{t('home.promoProductsTitle')}</h2>
        <div className="home-promo-products__shell home-promo-products--loading" aria-busy="true" />
      </div>
    )
  }

  return (
    <div className="home-promo-products">
      <h2 className="section-title home-promo-products__heading">{t('home.promoProductsTitle')}</h2>
      <p className="home-promo-products__hint">{t('home.promoProductsZoneHint')}</p>
      <HomePromoProductsCarousel slides={slides} chunkSize={chunkSize} />
    </div>
  )
}
