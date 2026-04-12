import { Pagination } from 'antd'
import { Link, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../../components/ProductCard'
import { useStorefrontProducts } from '../../hooks/apiHooks'
import './Catalog.scss'

function buildCatalogSearch(next: {
  country?: string
  page?: number
  size?: number
  q?: string
}) {
  const sp = new URLSearchParams()
  if (next.country) sp.set('country', next.country)
  if (next.page != null && next.page > 1) sp.set('page', String(next.page))
  if (next.size != null && next.size !== 12) sp.set('size', String(next.size))
  if (next.q) sp.set('q', next.q)
  const qs = sp.toString()
  return qs ? `/catalog?${qs}` : '/catalog'
}

export function Catalog() {
  const [params, setParams] = useSearchParams()
  const country = params.get('country') ?? ''
  const page1 = Math.max(1, Number(params.get('page') ?? 1) || 1)
  const size = Math.min(100, Math.max(1, Number(params.get('size') ?? 12) || 12))
  const q = (params.get('q') ?? '').trim()

  const { data, isLoading } = useStorefrontProducts({
    page: page1 - 1,
    size,
    country: country || undefined,
    q: q || undefined,
  })

  const items = data?.items ?? []
  const total = data?.total ?? 0

  const applyPagination = (p: number, ps: number) => {
    const next = new URLSearchParams(params)
    if (p <= 1) next.delete('page')
    else next.set('page', String(p))
    if (ps === 12) next.delete('size')
    else next.set('size', String(ps))
    if (ps !== size) next.delete('page')
    setParams(next, { replace: true })
  }

  return (
    <div className="catalog page-pad">
      <div className="container">
        <header className="page-header">
          <h1 className="page-header__title">Catalog</h1>
          <p className="page-header__desc">Review MOQ and specs before adding to cart.</p>
        </header>

        <div className="catalog__layout">
          <aside className="catalog__filters" aria-label="Filters">
            <h2 className="catalog__filters-title">Origin country</h2>
            <ul className="catalog__filter-list">
              <li>
                <Link
                  to={buildCatalogSearch({ q })}
                  className={!country ? 'catalog__filter is-active' : 'catalog__filter'}
                >
                  All
                </Link>
              </li>
              <li>
                <Link
                  to={buildCatalogSearch({ country: 'CN', q })}
                  className={country === 'CN' ? 'catalog__filter is-active' : 'catalog__filter'}
                >
                  CN
                </Link>
              </li>
              <li>
                <Link
                  to={buildCatalogSearch({ country: 'US', q })}
                  className={country === 'US' ? 'catalog__filter is-active' : 'catalog__filter'}
                >
                  US
                </Link>
              </li>
            </ul>
            <h2 className="catalog__filters-title">Search</h2>
            <form
              key={`${country}-${page1}-${size}-${q}`}
              className="catalog__search"
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                const nextQ = String(fd.get('q') ?? '').trim()
                const next = new URLSearchParams(params)
                if (nextQ) next.set('q', nextQ)
                else next.delete('q')
                next.delete('page')
                setParams(next, { replace: true })
              }}
            >
              <input className="input" name="q" defaultValue={q} placeholder="Title, SKU, or ID" />
              <button type="submit" className="btn btn--primary" style={{ marginTop: 8 }}>
                Search
              </button>
            </form>
            <h2 className="catalog__filters-title">Price</h2>
            <div className="catalog__range">
              <input type="range" min="0" max="100" defaultValue="50" disabled />
              <span className="catalog__range-hint">Server-side catalog pagination</span>
            </div>
          </aside>

          <div className="catalog__main">
            {isLoading && <p className="catalog__count">Loading products...</p>}
            {!isLoading && (
              <p className="catalog__count">
                Showing <strong>{items.length}</strong> of <strong>{total}</strong> products
                {country ? ` · country ${country}` : ''}
                {q ? ` · “${q}”` : ''}
              </p>
            )}
            <div className="product-grid product-grid--catalog">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {!isLoading && total > 0 && (
              <Pagination
                style={{ marginTop: 24 }}
                current={page1}
                total={total}
                pageSize={size}
                showSizeChanger
                pageSizeOptions={[12, 24, 48]}
                onChange={(p, ps) => applyPagination(ps !== size ? 1 : p, ps)}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
