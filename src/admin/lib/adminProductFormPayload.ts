import type { AdminProductUpsertRequest } from '../../types/api'

/** 与 `AdminProductUpsertFields` 字段一致，用于新建/编辑/快捷弹窗提交 */
export type AdminProductFormValues = {
  title: string
  price: number
  /** 划线原价；可选，须不低于售价 */
  listPrice?: number | null
  /** 成本价；可选，≥0 */
  costPrice?: number | null
  currency: string
  moq: number
  description?: string
  skuCode?: string
  hsCode?: string
  unit?: string
  incoterm?: string
  originCountry?: string
  leadTimeDays?: number
  weightKg?: number
  categoryId?: number
  shippingTemplateId?: number
  tagIds?: number[]
  isActive: boolean
  images?: Array<{ thumbUrl: string; fullUrl: string }>
}

function trimStr(v: unknown): string {
  return v == null ? '' : String(v).trim()
}

function optTrimStr(v: unknown): string | null {
  const t = trimStr(v)
  return t === '' ? null : t
}

function optInt(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? Math.trunc(n) : null
}

function optNumber(v: unknown): number | null {
  if (v == null || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/**
 * 组装 PUT/POST 负载。
 * 可选字段显式传 null，避免 JSON 省略键导致后端 Kotlin 默认值把字段清空（尤其是 description）。
 */
export function adminProductFormValuesToPayload(values: AdminProductFormValues): AdminProductUpsertRequest {
  const listPriceRaw = values.listPrice
  const listPrice =
    listPriceRaw != null && listPriceRaw !== '' && Number(listPriceRaw) > 0 ? Number(listPriceRaw) : null

  const costPriceRaw = values.costPrice
  const costPrice =
    costPriceRaw != null &&
    costPriceRaw !== '' &&
    Number.isFinite(Number(costPriceRaw)) &&
    Number(costPriceRaw) >= 0
      ? Number(costPriceRaw)
      : null

  const payload: AdminProductUpsertRequest & Record<string, unknown> = {
    title: trimStr(values.title),
    price: Number(values.price),
    listPrice,
    costPrice,
    currency: trimStr(values.currency).toUpperCase() || 'USD',
    moq: Number(values.moq),
    description: trimStr(values.description),
    skuCode: optTrimStr(values.skuCode),
    hsCode: optTrimStr(values.hsCode),
    unit: optTrimStr(values.unit),
    incoterm: (() => {
      const t = optTrimStr(values.incoterm)
      return t == null ? null : t.toUpperCase()
    })(),
    originCountry: optTrimStr(values.originCountry),
    leadTimeDays: optInt(values.leadTimeDays),
    weightKg: optNumber(values.weightKg),
    categoryId: optInt(values.categoryId),
    shippingTemplateId: optInt(values.shippingTemplateId),
    isActive: Boolean(values.isActive),
  }

  if (values.images !== undefined) {
    payload.images = values.images
  }
  if (values.tagIds !== undefined) {
    payload.tagIds = values.tagIds
  }

  return payload as AdminProductUpsertRequest
}
