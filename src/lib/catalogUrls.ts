/**
 * 前台商品目录 URL：路径段承载类目（`/catalog/:categoryId`），查询串承载分页、国家与关键词。
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
}): string {
  const path = storefrontCatalogPath(opts.categoryId ?? undefined)
  const sp = new URLSearchParams()
  if (opts.country) sp.set('country', opts.country)
  if (opts.tagId != null && opts.tagId > 0 && Number.isFinite(opts.tagId)) sp.set('tagId', String(opts.tagId))
  if (opts.page != null && opts.page > 1) sp.set('page', String(opts.page))
  if (opts.size != null && opts.size !== 12) sp.set('size', String(opts.size))
  if (opts.q) sp.set('q', opts.q)
  const qs = sp.toString()
  return qs ? `${path}?${qs}` : path
}
