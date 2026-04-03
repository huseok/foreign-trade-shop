import { useMemo } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../components/ProductCard'
import { categories, products } from '../data/mockProducts'
import './Catalog.css'

export function Catalog() {
  const [params] = useSearchParams()
  const categoryId = params.get('category') ?? ''

  const filtered = useMemo(() => {
    if (!categoryId) return products
    return products.filter((p) => p.categoryId === categoryId)
  }, [categoryId])

  return (
    <div className="catalog page-pad">
      <div className="container">
        <header className="page-header">
          <h1 className="page-header__title">Catalog</h1>
          <p className="page-header__desc">
            Filter by category and review MOQs before adding to cart.
          </p>
        </header>

        <div className="catalog__layout">
          <aside className="catalog__filters" aria-label="Filters">
            <h2 className="catalog__filters-title">Category</h2>
            <ul className="catalog__filter-list">
              <li>
                <Link
                  to="/catalog"
                  className={
                    !categoryId
                      ? 'catalog__filter is-active'
                      : 'catalog__filter'
                  }
                >
                  All
                </Link>
              </li>
              {categories.map((c) => (
                <li key={c.id}>
                  <Link
                    to={`/catalog?category=${c.id}`}
                    className={
                      categoryId === c.id
                        ? 'catalog__filter is-active'
                        : 'catalog__filter'
                    }
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            <h2 className="catalog__filters-title">Price (demo)</h2>
            <div className="catalog__range">
              <input type="range" min="0" max="100" defaultValue="50" disabled />
              <span className="catalog__range-hint">UI only</span>
            </div>
          </aside>

          <div className="catalog__main">
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
