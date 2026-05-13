/**
 * 前台商品目录页：`/catalog` 与 `/catalog/:categoryId`。
 *
 * - 左侧筛选：类目、标签、原产国（沿用既有 URL 参数）、关键词搜索、**主档售价区间**（Min/Max 表单提交后写入 URL）。
 * - 右侧列表：`useStorefrontProducts` 将 URL 状态映射到 `GET /api/v1/products`（含 `minPrice`/`maxPrice`/`promo`）。
 * - 样式：搜索区仅做宽度与布局微调，不改变全站主题变量（见 `Catalog.scss`）。
 */
import { Pagination } from 'antd'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ProductCard } from '../../components/ProductCard'
import { useCategories, useStorefrontProducts, useStorefrontTags } from '../../hooks/apiHooks'
import { useI18n } from '../../i18n/useI18n'
import { i18nTpl } from '../../lib/i18nTpl'
import { storefrontCatalogHref } from '../../lib/catalogUrls'
import './Catalog.scss'

/**
 * 将地址栏中的价格查询串解析为非负有限数；非法或缺失时返回 `undefined` 表示「不参与筛选」。
 */
function parsePriceParam(raw: string | null): number | undefined {
  if (raw == null || raw.trim() === '') return undefined
  const n = Number(raw)
  if (!Number.isFinite(n) || n < 0) return undefined
  return n
}

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
  /** 优先使用标签编码（与后台标签 `code` 一致）；无则回退到历史 `tagId` 数字参数。 */
  const tagCodeParam = (params.get('tagCode') ?? '').trim()
  const tagCode = tagCodeParam !== '' ? tagCodeParam : undefined
  const tagParam = params.get('tagId') ?? ''
  const tagNum =
    !tagCode && tagParam !== '' && /^\d+$/.test(tagParam) ? Number(tagParam) : undefined
  const minPrice = parsePriceParam(params.get('minPrice'))
  const maxPrice = parsePriceParam(params.get('maxPrice'))
  const promoOnly = params.get('promo') === 'true'

  const { data: categories = [] } = useCategories()
  const { data: storefrontTags = [] } = useStorefrontTags()
  const categoryName = categories.find((c) => c.id === categoryNum)?.name
  const tagName =
    tagCode != null
      ? storefrontTags.find((tg) => tg.code.toUpperCase() === tagCode.toUpperCase())?.name
      : storefrontTags.find((tg) => tg.id === tagNum)?.name

  const { data, isLoading } = useStorefrontProducts({
    page: page1 - 1,
    size,
    country: country || undefined,
    q: q || undefined,
    categoryId: categoryNum,
    tagId: tagNum,
    tagCode: tagCode || undefined,
    minPrice,
    maxPrice,
    promo: promoOnly ? true : undefined,
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

  const filterBase = {
    country: country || undefined,
    q,
    tagId: tagNum,
    tagCode: tagCode || undefined,
    minPrice,
    maxPrice,
    promo: promoOnly ? true : undefined,
  }

  let countLine = i18nTpl(t('catalog.showing'), { n: String(items.length), total: String(total) })
  if (country) countLine += i18nTpl(t('catalog.countrySuffix'), { c: country })
  if (q) countLine += i18nTpl(t('catalog.querySuffix'), { q })
  if (categoryName) countLine += i18nTpl(t('catalog.categorySuffix'), { name: categoryName })
  if (tagName) countLine += i18nTpl(t('catalog.tagSuffix'), { name: tagName })
  if (tagCode && !tagName) countLine += i18nTpl(t('catalog.tagCodeSuffix'), { code: tagCode })
  if (promoOnly) countLine += t('catalog.promoSuffix')
  if (minPrice != null || maxPrice != null) {
    countLine += i18nTpl(t('catalog.priceRangeSuffix'), {
      min: minPrice != null ? String(minPrice) : '—',
      max: maxPrice != null ? String(maxPrice) : '—',
    })
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
                  to={storefrontCatalogHref({ ...filterBase, categoryId: categoryNum, tagId: null, tagCode: null })}
                  className={tagNum == null && tagCode == null ? 'catalog__filter is-active' : 'catalog__filter'}
                >
                  {t('catalog.allTags')}
                </Link>
              </li>
              {storefrontTags.slice(0, 48).map((tg) => (
                <li key={tg.id}>
                  <Link
                    to={storefrontCatalogHref({
                      ...filterBase,
                      categoryId: categoryNum,
                      tagId: null,
                      tagCode: tg.code,
                    })}
                    className={
                      (tagCode != null && tg.code.toUpperCase() === tagCode.toUpperCase()) ||
                      (tagCode == null && tagNum === tg.id)
                        ? 'catalog__filter is-active'
                        : 'catalog__filter'
                    }
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
              key={`${country}-${page1}-${size}-${q}-${categoryNum ?? ''}-${tagNum ?? ''}-${tagCode ?? ''}-${minPrice ?? ''}-${maxPrice ?? ''}`}
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
                className="input catalog__search-input"
                name="q"
                defaultValue={q}
                placeholder={t('catalog.searchSkuPlaceholder')}
              />
              <button type="submit" className="btn btn--primary catalog__search-submit">
                {t('common.search')}
              </button>
            </form>
            <h2 className="catalog__filters-title">{t('catalog.filtersPrice')}</h2>
            <form
              className="catalog__price-form"
              onSubmit={(e) => {
                e.preventDefault()
                const fd = new FormData(e.currentTarget)
                const minV = String(fd.get('minPrice') ?? '').trim()
                const maxV = String(fd.get('maxPrice') ?? '').trim()
                const next = new URLSearchParams(params)
                const minN = minV === '' ? undefined : Number(minV)
                const maxN = maxV === '' ? undefined : Number(maxV)
                if (minN !== undefined && (!Number.isFinite(minN) || minN < 0)) {
                  return
                }
                if (maxN !== undefined && (!Number.isFinite(maxN) || maxN < 0)) {
                  return
                }
                if (minN !== undefined && maxN !== undefined && minN > maxN) {
                  return
                }
                if (minN !== undefined) next.set('minPrice', String(minN))
                else next.delete('minPrice')
                if (maxN !== undefined) next.set('maxPrice', String(maxN))
                else next.delete('maxPrice')
                next.delete('page')
                setParams(next, { replace: true })
              }}
            >
              <div className="catalog__price-row">
                <label className="catalog__price-label">
                  <span className="catalog__price-label-text">Min</span>
                  <input
                    className="input"
                    name="minPrice"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={minPrice != null ? String(minPrice) : ''}
                    placeholder={t('catalog.priceMinPlaceholder')}
                  />
                </label>
                <label className="catalog__price-label">
                  <span className="catalog__price-label-text">Max</span>
                  <input
                    className="input"
                    name="maxPrice"
                    type="number"
                    min={0}
                    step="0.01"
                    defaultValue={maxPrice != null ? String(maxPrice) : ''}
                    placeholder={t('catalog.priceMaxPlaceholder')}
                  />
                </label>
              </div>
              <div className="catalog__price-actions">
                <button type="submit" className="btn btn--primary">
                  {t('catalog.priceApply')}
                </button>
                {(minPrice != null || maxPrice != null) && (
                  <Link
                    to={storefrontCatalogHref({ ...filterBase, minPrice: null, maxPrice: null })}
                    className="catalog__price-clear"
                  >
                    {t('catalog.priceClear')}
                  </Link>
                )}
              </div>
              <p className="catalog__range-hint">{t('catalog.priceHint')}</p>
            </form>
          </aside>

          <div className="catalog__main">
            {isLoading && <p className="catalog__count">{t('common.loading')}</p>}
            {!isLoading && <p className="catalog__count">{countLine}</p>}
            <div className="product-grid product-grid--catalog">
              {items.map((p) => (
                <ProductCard key={p.id} product={p} compactAddButton />
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
