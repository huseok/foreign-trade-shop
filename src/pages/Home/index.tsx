import { Link } from 'react-router-dom'
import { ProductCard } from '../../components/ProductCard'
import { useStorefrontProducts } from '../../hooks/apiHooks'
import './Home.scss'

export function Home() {
  const { data } = useStorefrontProducts({ page: 0, size: 4 })
  const featured = data?.items ?? []

  return (
    <div className="home">
      <section className="home-hero">
        <div className="home-hero__bg" aria-hidden />
        <div className="container home-hero__content">
          <p className="home-hero__eyebrow">CHZfobkey · Global commerce platform</p>
          <h1 className="home-hero__title">专业选品、采购、履约一体化站点</h1>
          <p className="home-hero__lead">
            覆盖登录注册、分类选品、商品详情、购物车、订单履约、用户中心与后台管理，
            用简洁一致的体验支撑跨境电商业务。
          </p>
          <div className="home-hero__actions">
            <Link to="/catalog" className="btn btn--primary">
              去选品
            </Link>
            <a href="#trust" className="btn btn--ghost">
              站点优势
            </a>
          </div>
        </div>
      </section>

      {/* 站点说明（顶部） */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">站点说明</h2>
          <p className="page-header__desc">
            CHZfobkey 提供标准化商品资料、价格体系与履约流程，支持企业客户快速完成采购决策。
          </p>
        </div>
      </section>

      {/* 活动 banner */}
      <section className="section">
        <div className="container">
          <div className="home-newsletter__box">
            <div>
              <h2 className="home-newsletter__title">活动 Banner</h2>
              <p className="home-newsletter__text">不定期上新热卖活动，点击可快速进入商品详情页。</p>
            </div>
            <Link to="/products/1" className="btn btn--primary">
              查看活动商品
            </Link>
          </div>
        </div>
      </section>

      {/* 按类别购物 */}
      <section className="home-cats section">
        <div className="container">
          <h2 className="section-title">按类别购物</h2>
          <div className="home-cats__grid">
            {['Beauty', 'Fashion', 'Skincare'].map((c) => (
              <Link key={c} to="/catalog" className="home-cats__card">
                <span className="home-cats__name">{c}</span>
                <span className="home-cats__arrow" aria-hidden>
                  →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="section-head">
            <h2 className="section-title">特色产品</h2>
            <Link to="/catalog" className="section-head__link">
              查看全部
            </Link>
          </div>
          <div className="product-grid">
            {featured.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      </section>

      <section id="trust" className="home-trust section">
        <div className="container">
          <h2 className="section-title">网站优势</h2>
          <div className="home-trust__grid">
            <article className="trust-card">
              <div className="trust-card__icon" aria-hidden={true}>
                G
              </div>
              <h3 className="trust-card__title">全球物流能力</h3>
              <p className="trust-card__text">
                多渠道物流与标准化清关资料，提升跨境履约效率。
              </p>
            </article>
            <article className="trust-card">
              <div className="trust-card__icon" aria-hidden={true}>
                S
              </div>
              <h3 className="trust-card__title">稳定交易闭环</h3>
              <p className="trust-card__text">
                从下单、支付、发货到签收，状态全程可追踪。
              </p>
            </article>
            <article className="trust-card">
              <div className="trust-card__icon" aria-hidden={true}>
                ✓
              </div>
              <h3 className="trust-card__title">优质供应保障</h3>
              <p className="trust-card__text">
                商品信息结构化、资质可追溯，减少采购不确定性。
              </p>
            </article>
          </div>
        </div>
      </section>

      {/* 联系人 */}
      <section className="section">
        <div className="container">
          <h2 className="section-title">联系人</h2>
          <p className="page-header__desc">姓名：CHZfobkey Team ｜ WA：+86 188-0000-0000 ｜ 微信：CHZfobkey_Biz</p>
        </div>
      </section>
    </div>
  )
}
