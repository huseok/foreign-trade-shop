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
          <p className="home-hero__eyebrow">B2B sourcing · Export-ready</p>
          <h1 className="home-hero__title">
            Global suppliers,
            <br />
            one streamlined storefront
          </h1>
          <p className="home-hero__lead">
            Browse vetted SKUs, review MOQs, and move from quote to checkout
            with documentation tailored for cross-border teams.
          </p>
          <div className="home-hero__actions">
            <Link to="/catalog" className="btn btn--primary">
              Browse catalog
            </Link>
            <a href="#trust" className="btn btn--ghost">
              Why Globuy
            </a>
          </div>
        </div>
      </section>

      <section className="home-cats section">
        <div className="container">
          <h2 className="section-title">Shop by category</h2>
          <div className="home-cats__grid">
            {['CN', 'US', 'Global'].map((c) => (
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
            <h2 className="section-title">Featured products</h2>
            <Link to="/catalog" className="section-head__link">
              View all
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
          <h2 className="section-title">Why teams choose us</h2>
          <div className="home-trust__grid">
            <article className="trust-card">
              <div className="trust-card__icon" aria-hidden={true}>
                G
              </div>
              <h3 className="trust-card__title">Global logistics</h3>
              <p className="trust-card__text">
                Consolidated shipping options and HS-friendly packing lists for
                your destination market.
              </p>
            </article>
            <article className="trust-card">
              <div className="trust-card__icon" aria-hidden={true}>
                S
              </div>
              <h3 className="trust-card__title">Secure payments</h3>
              <p className="trust-card__text">
                Enterprise-grade checkout flow with clear order states from
                placed to fulfilled.
              </p>
            </article>
            <article className="trust-card">
              <div className="trust-card__icon" aria-hidden={true}>
                ✓
              </div>
              <h3 className="trust-card__title">Verified suppliers</h3>
              <p className="trust-card__text">
                Repeatable quality with batch documentation available for
                regulated categories.
              </p>
            </article>
          </div>
        </div>
      </section>

      <section className="home-newsletter section">
        <div className="container home-newsletter__box">
          <div>
            <h2 className="home-newsletter__title">Stay ahead of stock drops</h2>
            <p className="home-newsletter__text">
              Product updates for procurement leads. No spam — unsubscribe
              anytime.
            </p>
          </div>
          <form
            className="home-newsletter__form"
            onSubmit={(e) => e.preventDefault()}
          >
            <label htmlFor="nl-email" className="visually-hidden">
              Email
            </label>
            <input
              id="nl-email"
              type="email"
              className="input"
              placeholder="you@company.com"
              autoComplete="email"
            />
            <button type="submit" className="btn btn--primary">
              Subscribe
            </button>
          </form>
        </div>
      </section>
    </div>
  )
}
