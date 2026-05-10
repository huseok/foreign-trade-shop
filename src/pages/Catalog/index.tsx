import { Pagination } from 'antd'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../../components/ProductCard'
import { useCategories, useStorefrontProducts, useStorefrontTags } from '../../hooks/apiHooks'
import { useI18n } from '../../i18n/I18nProvider'
import { i18nTpl } from '../../lib/i18nTpl'
import { storefrontCatalogHref } from '../../lib/catalogUrls'
import './Catalog.scss'

export function Catalog() {
  const { t } = useI18n()
  const { categoryId: routeCat } = useParams<{ categoryId?: string }>()
  const categoryNum =
    routeCat != null && /^\d+$/.test(routeCat) ? Number(routeCat) : undefined
  const [params, setParams] = useSearchParams()
  const country = params.get('country') ?? ''
  const page1 = Math.max(1, Number(params.get('page') ?? 1) || 1)
  const size = Math.min(100, Math.max(1, Number(params.get('size') ?? 12) || 12))
  const q = (params.get('q') ?? '').trim()
  const tagParam = params.get('tagId') ?? ''
  const tagNum =
    tagParam !== '' && /^\d+$/.test(tagParam) ? Number(tagParam) : undefined

  const { data: categories = [] } = useCategories()
  const { data: storefrontTags = [] } = useStorefrontTags()
  const categoryName = categories.find((c) => c.id === categoryNum)?.name
  const tagName = storefrontTags.find((tg) => tg.id === tagNum)?.name

  const { data, isLoading } = useStorefrontProducts({
    page: page1 - 1,
    size,
    country: country || undefined,
    q: q || undefined,
    categoryId: categoryNum,
    tagId: tagNum,
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

  let countLine = i18nTpl(t('catalog.showing'), { n: String(items.length), total: String(total) })
  if (country) countLine += i18nTpl(t('catalog.countrySuffix'), { c: country })
  if (q) countLine += i18nTpl(t('catalog.querySuffix'), { q })
  if (categoryName) countLine += i18nTpl(t('catalog.categorySuffix'), { name: categoryName })
  if (tagName) countLine += i18nTpl(t('catalog.tagSuffix'), { name: tagName })

  const filterBase = {
    country: country || undefined,
    q,
    tagId: tagNum,
  }

  return (
    <div className="catalog page-pad">
      <div className="container">
        <header className="page-header">
          <h1 className="page-header__title">{t('catalog.title')}</h1>
          <p className="page-header__desc">{t('catalog.desc')}</p>
        </header>

        <div className="catalog__layout">
          <aside className="catalog__filters" aria-label={t('catalog.title')}>
            <h2 className="catalog__filters-title">{t('catalog.filtersCategory')}</h2>
            <ul className="catalog__filter-list">
              <li>
                <Link
                  to={storefrontCatalogHref({ ...filterBase, categoryId: null })}
                  className={categoryNum == null ? 'catalog__filter is-active' : 'catalog__filter'}
                >
                  {t('catalog.allCategories')}
                </Link>
              </li>
              {categories.slice(0, 32).map((c) => (
                <li key={c.id}>
                  <Link
                    to={storefrontCatalogHref({ ...filterBase, categoryId: c.id })}
                    className={categoryNum === c.id ? 'catalog__filter is-active' : 'catalog__filter'}
                  >
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="catalog__filters-title">{t('catalog.filtersTag')}</h2>
            <ul className="catalog__filter-list">
              <li>
                <Link
                  to={storefrontCatalogHref({ categoryId: categoryNum, country: country || undefined, q })}
                  className={tagNum == null ? 'catalog__filter is-active' : 'catalog__filter'}
                >
                  {t('catalog.allTags')}
                </Link>
              </li>
              {storefrontTags.slice(0, 48).map((tg) => (
                <li key={tg.id}>
                  <Link
                    to={storefrontCatalogHref({ ...filterBase, categoryId: categoryNum, tagId: tg.id })}
                    className={tagNum === tg.id ? 'catalog__filter is-active' : 'catalog__filter'}
                  >
                    {tg.name}
                  </Link>
                </li>
              ))}
            </ul>

            <h2 className="catalog__filters-title">{t('catalog.filtersOrigin')}</h2>
            <ul className="catalog__filter-list">
              <li>
                <Link
                  to={storefrontCatalogHref({ ...filterBase, categoryId: categoryNum })}
                  className={!country ? 'catalog__filter is-active' : 'catalog__filter'}
                >
                  {t('catalog.all')}
                </Link>
              </li>
              <li>
                <Link
                  to={storefrontCatalogHref({ ...filterBase, categoryId: categoryNum, country: 'CN' })}
                  className={country === 'CN' ? 'catalog__filter is-active' : 'catalog__filter'}
                >
                  CN
                </Link>
              </li>
              <li>
                <Link
                  to={storefrontCatalogHref({ ...filterBase, categoryId: categoryNum, country: 'US' })}
                  className={country === 'US' ? 'catalog__filter is-active' : 'catalog__filter'}
                >
                  US
                </Link>
              </li>
            </ul>
            <h2 className="catalog__filters-title">{t('catalog.filtersSearch')}</h2>
            <form
              key={`${country}-${page1}-${size}-${q}-${categoryNum ?? ''}-${tagNum ?? ''}`}
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
              <input
                className="input"
                name="q"
                defaultValue={q}
                placeholder={t('catalog.searchSkuPlaceholder')}
              />
              <button type="submit" className="btn btn--primary" style={{ marginTop: 8 }}>
                {t('common.search')}
              </button>
            </form>
            <h2 className="catalog__filters-title">{t('catalog.filtersPrice')}</h2>
            <div className="catalog__range">
              <input type="range" min="0" max="100" defaultValue="50" disabled />
              <span className="catalog__range-hint">{t('catalog.priceHint')}</span>
            </div>
          </aside>

          <div className="catalog__main">
            {isLoading && <p className="catalog__count">{t('common.loading')}</p>}
            {!isLoading && <p className="catalog__count">{countLine}</p>}
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
