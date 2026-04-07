import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../../components/ProductCard'
import { useProducts } from '../../hooks/apiHooks'
import './Catalog.scss'

export function Catalog() {
  const { data: products = [], isLoading } = useProducts()
  const [params] = useSearchParams()
  const country = params.get('country') ?? ''

  const filtered = useMemo(() => {
    if (!country) return products
    return products.filter((p) => (p.originCountry ?? '').toLowerCase() === country.toLowerCase())
  }, [country, products])

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
                <Link to="/catalog" className={!country ? 'catalog__filter is-active' : 'catalog__filter'}>All</Link>
              </li>
              <li>
                <Link to="/catalog?country=CN" className={country === 'CN' ? 'catalog__filter is-active' : 'catalog__filter'}>CN</Link>
              </li>
              <li>
                <Link to="/catalog?country=US" className={country === 'US' ? 'catalog__filter is-active' : 'catalog__filter'}>US</Link>
              </li>
            </ul>
            <h2 className="catalog__filters-title">Price</h2>
            <div className="catalog__range">
              <input type="range" min="0" max="100" defaultValue="50" disabled />
              <span className="catalog__range-hint">Controlled by backend visibility</span>
            </div>
          </aside>

          <div className="catalog__main">
            {isLoading && <p className="catalog__count">Loading products...</p>}
            <p className="catalog__count">
              Showing <strong>{filtered.length}</strong> products
            </p>
            <div className="product-grid product-grid--catalog">
              {filtered.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
