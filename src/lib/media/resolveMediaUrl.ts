import { API_BASE_URL } from '../http/apiClient'

/**
 * 将后端返回的 `/media/...` 相对路径解析为浏览器可请求的绝对 URL。
 *
 * - 生产环境若 CDN 与 API 域名分离，可配置 `VITE_MEDIA_BASE_URL` 指向静态域名。
 * - 已在 vite-env.d.ts 声明可选 env（若缺失则在 IDE 中扩展类型）。
 */
export function resolveMediaUrl(path: string | null | undefined): string {
  if (path == null || path === '') return ''
  const trimmed = path.trim()
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  const base = (import.meta.env.VITE_MEDIA_BASE_URL as string | undefined)?.replace(/\/$/, '') ?? API_BASE_URL.replace(/\/$/, '')
  const p = trimmed.startsWith('/') ? trimmed : `/${trimmed}`
  return `${base}${p}`
}

/** 商品列表/卡片：默认首张缩略图 */
export function productThumbUrl(product: { images?: Array<{ thumbUrl?: string }> | null }): string {
  const thumb = product.images?.[0]?.thumbUrl
  return thumb ? resolveMediaUrl(thumb) : ''
}
