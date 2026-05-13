/**
 * 商城首页：区块顺序与业务需求对齐。
 *
 * 自上而下（首屏 Hero 可由开关隐藏，见文件内 `SHOW_HOME_HERO`）：
 * 首屏 Hero（可选）→  活动/促销区块 → 精选商品 → 热销 → 按类目购物 → 联系摘要 → **站点说明（置底）**。
 * 精选 / 热销数据源由 `GET /api/v1/storefront/settings` 的 `homeFeaturedTagCode`、`homeHotTagCode` 驱动（缺省时精选为全站前 4 条，热销仍为 `promo=true` 活动商品）。
 * 不再展示原「网站优势」三卡，避免与「热销」信息重复；整体仍使用 `home--boutique` 既有样式类。
 */
import { Link } from 'react-router-dom'
import { ProductCard } from '../../components/ProductCard'
import { useCategories, useStorefrontProducts, useStorefrontSettings } from '../../hooks/apiHooks'
import { useI18n } from '../../i18n/useI18n'
import { storefrontCatalogHref } from '../../lib/catalogUrls'
import { HomePromoProductsSection } from './HomePromoProductsSection'
import { HomePromoSection } from './HomePromoSection'
import './Home.scss'

/**
 * 是否渲染首屏 `home-hero`（大标题 + CTA + 右侧装饰块）。
 * 按产品要求**暂时隐藏**；需要重新上线首屏时改为 `true` 即可，无需删 JSX。
 */
const SHOW_HOME_HERO = false

export function Home() {
  const { t } = useI18n()

  // 站点首页配置（精选/热销所用标签编码等）
  const { data: settings } = useStorefrontSettings()
  const featuredCode = settings?.homeFeaturedTagCode?.trim()
  // 「精选」商品列表：有配置标签则按标签筛，否则取全站前 4 条
  const { data } = useStorefrontProducts(
    featuredCode ? { page: 0, size: 4, tagCode: featuredCode } : { page: 0, size: 4 },
  )
  const hotCode = settings?.homeHotTagCode?.trim()
  // 「热销」商品列表：有配置标签则按标签筛，否则用活动商品 promo
  const { data: hotData } = useStorefrontProducts(
    hotCode ? { page: 0, size: 4, tagCode: hotCode } : { page: 0, size: 4, promo: true },
  )
  // 首页「按类目购物」入口：取前 6 个一级类目
  const { data: categories = [] } = useCategories()
  const featured = data?.items ?? []
  const hotItems = (hotData?.items?.length ? hotData.items : featured).slice(0, 4)
  // 传给下方运营轮播区，作示例「进商品详情」链接的默认商品 id
  const sampleProductId = featured[0]?.id ?? hotItems[0]?.id ?? '1'
  const homeCats = categories.slice(0, 6)

  return (
    <div className="home home--boutique">
      {/* 首屏 Hero：`SHOW_HOME_HERO` 为 false 时不挂载 DOM，避免无样式空占位与读屏噪音 */}
      {SHOW_HOME_HERO ? (
        <section className="home-hero home-hero--boutique" aria-label={t('home.heroTitle')}>
          <div className="home-hero__bg" aria-hidden />
          <div className="container home-hero__shell">
            <div className="home-hero__content">
              <p className="home-hero__eyebrow">{t('home.eyebrow')}</p>
              <h1 className="home-hero__title">{t('home.heroTitle')}</h1>
              <p className="home-hero__lead">{t('home.heroLead')}</p>
              <div className="home-hero__actions">
                <Link to="/catalog" className="btn btn--primary">
                  {t('home.ctaCatalog')}
                </Link>
                <a href="#home-hot" className="btn btn--ghost">
                  {t('home.ctaHot')}
                </a>
              </div>
            </div>
            <aside className="home-hero__panel" aria-hidden>
              <div className="home-hero__panel-stack">
                <span className="home-hero__panel-card home-hero__panel-card--a" />
                <span className="home-hero__panel-card home-hero__panel-card--b" />
                <span className="home-hero__panel-card home-hero__panel-card--c" />
              </div>
            </aside>
          </div>
        </section>
      ) : null}

      {/* 活动/促销：上方为「促销标签区」商品轮播；下方为站点运营轮播图 + CTA（见各自组件内注释） */}
      <section className="section">
        <div className="container">
          <HomePromoProductsSection />
          <HomePromoSection sampleProductId={sampleProductId} />
        </div>
      </section>

      {/* 精选：网格展示 `featured`，标题旁链到对应目录或全站目录 */}
      <section className="section home-featured">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">{t('home.featuredTitle')}</h2>
            <Link
              to={featuredCode ? storefrontCatalogHref({ tagCode: featuredCode }) : '/catalog'}
              className="section-head__link"
            >
              {t('home.featuredAll')}
            </Link>
          </div>
          <div className="product-grid product-grid--boutique">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* 热销：同上，`ProductCard` 为单商品卡片（图、价、加购等） */}
      <section id="home-hot" className="section home-featured">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">{t('home.hotTitle')}</h2>
            <Link
              to={
                hotCode ? storefrontCatalogHref({ tagCode: hotCode }) : storefrontCatalogHref({ promo: true })
              }
              className="section-head__link"
            >
              {t('home.featuredAll')}
            </Link>
          </div>
          <div className="product-grid product-grid--boutique">
            {hotItems.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      {/* 按类目购物：有类目数据则链到带 categoryId 的目录，否则展示占位英文名 */}
      <section className="home-cats section">
        <div className="container">
          <h2 className="section-title">{t('home.catsTitle')}</h2>
          <div className="home-cats__grid">
            {homeCats.length === 0
              ? ['Beauty', 'Fashion', 'Skincare'].map((c) => (
                  <Link key={c} to="/catalog" className="home-cats__card">
                    <span className="home-cats__name">{c}</span>
                    <span className="home-cats__arrow" aria-hidden>
                      →
                    </span>
                  </Link>
                ))
              : homeCats.map((c) => (
                  <Link
                    key={c.id}
                    to={storefrontCatalogHref({ categoryId: c.id })}
                    className="home-cats__card"
                  >
                    <span className="home-cats__name">{c.name}</span>
                    <span className="home-cats__arrow" aria-hidden>
                      →
                    </span>
                  </Link>
                ))}
          </div>
        </div>
      </section>
      
      <section className="section home-contact">
        <div className="container">
          <h2 className="section-title">{t('home.contactTitle')}</h2>
          <p className="page-header__desc">{t('home.contactLine')}</p>
        </div>
      </section>

      {/* 站点说明：置底简介文案 */}
      <section className="section home-intro">
        <div className="container">
          <h2 className="section-title">{t('home.siteIntroTitle')}</h2>
          <p className="page-header__desc">{t('home.siteIntroDesc')}</p>
        </div>
      </section>
    </div>
  )
}
