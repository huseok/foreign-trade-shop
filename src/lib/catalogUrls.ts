/**
 * 前台商品目录 URL 构建工具。
 *
 * - 路径：`/catalog` 或 `/catalog/:categoryId`，便于 SEO 与分享时带上类目上下文。
 * - 查询串：分页、每页条数、国家、关键词、标签、**主档售价区间**、**仅活动商品**等；
 *   与 `GET /api/v1/products` 的 Query 参数一一对应（见 `voyage.products.listPaged`）。
 */
export function storefrontCatalogPath(categoryId?: number | null): string {
  if (categoryId != null && categoryId > 0 && Number.isFinite(categoryId)) {
    return `/catalog/${categoryId}`
  }
  return '/catalog'
}

export function storefrontCatalogHref(opts: {
  categoryId?: number | null
  tagId?: number | null
  country?: string
  page?: number
  size?: number
  q?: string
  /** 售价下限（含）；与 `minPrice` Query 对齐，传 `null` 表示生成链接时显式清除该参数。 */
  minPrice?: number | null
  /** 售价上限（含）；传 `null` 表示清除。 */
  maxPrice?: number | null
  /** 为 true 时追加 `promo=true`，仅展示划线价高于主价的「活动」商品。 */
  promo?: boolean
}): string {
  const path = storefrontCatalogPath(opts.categoryId ?? undefined)
  const sp = new URLSearchParams()
  if (opts.country) sp.set('country', opts.country)
  if (opts.tagId != null && opts.tagId > 0 && Number.isFinite(opts.tagId)) sp.set('tagId', String(opts.tagId))
  if (opts.page != null && opts.page > 1) sp.set('page', String(opts.page))
  if (opts.size != null && opts.size !== 12) sp.set('size', String(opts.size))
  if (opts.q) sp.set('q', opts.q)
  if (opts.minPrice != null && Number.isFinite(opts.minPrice) && opts.minPrice >= 0) sp.set('minPrice', String(opts.minPrice))
  if (opts.maxPrice != null && Number.isFinite(opts.maxPrice) && opts.maxPrice >= 0) sp.set('maxPrice', String(opts.maxPrice))
  if (opts.promo === true) sp.set('promo', 'true')
  const qs = sp.toString()
  return qs ? `${path}?${qs}` : path
}
