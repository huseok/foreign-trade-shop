import type { AdminProductUpsertRequest } from '../../types/api'

/** 与 `AdminProductUpsertFields` 字段一致，用于新建/编辑/快捷弹窗提交 */
export type AdminProductFormValues = {
  title: string
  price: number
  /** 划线原价；可选，须不低于售价 */
  listPrice?: number | null
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

export function adminProductFormValuesToPayload(values: AdminProductFormValues): AdminProductUpsertRequest {
  return {
    title: String(values.title ?? '').trim(),
    price: Number(values.price),
    listPrice:
      values.listPrice != null && values.listPrice > 0 ? Number(values.listPrice) : null,
    currency: String(values.currency ?? '').trim().toUpperCase(),
    moq: Number(values.moq),
    description: values.description ? String(values.description).trim() : undefined,
    skuCode: values.skuCode ? String(values.skuCode).trim() : undefined,
    hsCode: values.hsCode ? String(values.hsCode).trim() : undefined,
    unit: values.unit ? String(values.unit).trim() : undefined,
    incoterm: values.incoterm ? String(values.incoterm).trim().toUpperCase() : undefined,
    originCountry: values.originCountry ? String(values.originCountry).trim() : undefined,
    leadTimeDays: values.leadTimeDays == null ? undefined : Number(values.leadTimeDays),
    ...(values.weightKg != null ? { weightKg: Number(values.weightKg) } : {}),
    ...(values.categoryId != null ? { categoryId: Number(values.categoryId) } : {}),
    ...(values.shippingTemplateId != null ? { shippingTemplateId: Number(values.shippingTemplateId) } : {}),
    isActive: Boolean(values.isActive),
    ...(values.images !== undefined ? { images: values.images } : {}),
    ...(values.tagIds !== undefined ? { tagIds: values.tagIds } : {}),
  }
}
