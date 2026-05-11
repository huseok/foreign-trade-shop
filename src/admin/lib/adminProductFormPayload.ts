import type { AdminProductUpsertRequest, ProductDto } from '../../types/api'

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

/** 管理端详情 DTO → 与 `AdminProductUpsertFields` 一致的表单初值 */
export function productDtoToAdminFormValues(p: ProductDto): AdminProductFormValues {
  return {
    title: p.title,
    price: p.price != null ? Number(p.price) : 0,
    listPrice: p.listPrice != null ? Number(p.listPrice) : undefined,
    costPrice: p.costPrice != null ? Number(p.costPrice) : undefined,
    currency: p.currency ?? 'USD',
    moq: p.moq,
    description: p.description ?? '',
    skuCode: p.skuCode ?? undefined,
    hsCode: p.hsCode ?? undefined,
    unit: p.unit ?? undefined,
    incoterm: p.incoterm ?? undefined,
    originCountry: p.originCountry ?? undefined,
    leadTimeDays: p.leadTimeDays ?? undefined,
    weightKg: p.weightKg ?? undefined,
    categoryId: p.categoryId ?? undefined,
    shippingTemplateId: p.shippingTemplateId ?? undefined,
    tagIds: p.tags?.map((tg) => tg.id) ?? [],
    isActive: p.isActive,
    images: p.images?.map((i) => ({ thumbUrl: i.thumbUrl, fullUrl: i.fullUrl })) ?? [],
  }
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

/** OpenAPI 生成类型多用 `T | undefined`，与内部 `null` 哨兵互转 */
function nullToUndef<T>(v: T | null): T | undefined {
  return v ?? undefined
}

/**
 * 组装 PUT/POST 负载。
 * 可选字段显式传 null，避免 JSON 省略键导致后端 Kotlin 默认值把字段清空（尤其是 description）。
 */
export function adminProductFormValuesToPayload(values: AdminProductFormValues): AdminProductUpsertRequest {
  const listPriceRaw = values.listPrice
  const listPrice =
    listPriceRaw != null && Number(listPriceRaw) > 0 ? Number(listPriceRaw) : null

  const costPriceRaw = values.costPrice
  const costPrice =
    costPriceRaw != null && Number.isFinite(Number(costPriceRaw)) && Number(costPriceRaw) >= 0
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
    skuCode: nullToUndef(optTrimStr(values.skuCode)),
    hsCode: nullToUndef(optTrimStr(values.hsCode)),
    unit: nullToUndef(optTrimStr(values.unit)),
    incoterm: (() => {
      const t = optTrimStr(values.incoterm)
      return t == null ? undefined : t.toUpperCase()
    })(),
    originCountry: nullToUndef(optTrimStr(values.originCountry)),
    leadTimeDays: nullToUndef(optInt(values.leadTimeDays)),
    weightKg: nullToUndef(optNumber(values.weightKg)),
    categoryId: nullToUndef(optInt(values.categoryId)),
    shippingTemplateId: nullToUndef(optInt(values.shippingTemplateId)),
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
