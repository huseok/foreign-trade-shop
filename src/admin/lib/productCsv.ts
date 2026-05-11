/**
 * 商品 CSV 导入/导出：带引号字段解析、列与模板对齐、更新行合并规则。
 * 约定见 `docs/admin-product-import.md`。
 */
import type { AdminProductUpsertRequest, ProductDto } from '../../types/api'

export const PRODUCT_CSV_CLEAR_SENTINELS = ['-', '__CLEAR__', '(clear)'] as const

export const PRODUCT_CSV_HEADERS = [
  'id',
  'title',
  'price',
  'listPrice',
  'currency',
  'moq',
  'isActive',
  'description',
  'skuCode',
  'hsCode',
  'unit',
  'incoterm',
  'originCountry',
  'leadTimeDays',
  'weightKg',
  'categoryId',
  'shippingTemplateId',
] as const

export function escapeCsvField(value: string | number | boolean | null | undefined): string {
  if (value == null) return ''
  const s = String(value)
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`
  return s
}

/** 解析单行 CSV（支持双引号包裹、引号内逗号与 "" 转义） */
export function parseCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let i = 0
  let inQuotes = false
  while (i < line.length) {
    const c = line[i]
    if (inQuotes) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"'
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }
      cur += c
      i += 1
      continue
    }
    if (c === '"') {
      inQuotes = true
      i += 1
      continue
    }
    if (c === ',') {
      out.push(cur)
      cur = ''
      i += 1
      continue
    }
    cur += c
    i += 1
  }
  out.push(cur)
  return out
}

export function splitCsvLines(text: string): string[] {
  return text.split(/\r?\n/).filter((line) => line.trim() !== '')
}

export function parseCsvFile(text: string): { headers: string[]; rows: string[][] } | null {
  const lines = splitCsvLines(text.replace(/^\uFEFF/, ''))
  if (lines.length < 2) return null
  const headers = parseCsvLine(lines[0]).map((h) => h.trim())
  const rows = lines.slice(1).map(parseCsvLine)
  return { headers, rows }
}

export function rowCellsToRecord(headers: string[], cells: string[]): Record<string, string> {
  const r: Record<string, string> = {}
  headers.forEach((h, idx) => {
    r[h] = cells[idx] ?? ''
  })
  return r
}

function isClearToken(raw: string): boolean {
  const t = raw.trim()
  if (t === '') return false
  return PRODUCT_CSV_CLEAR_SENTINELS.some((s) => s.toLowerCase() === t.toLowerCase())
}

function trimOrUndef(raw: string | undefined): string | undefined {
  if (raw == null) return undefined
  const t = raw.trim()
  return t === '' ? undefined : t
}

function parseBool(raw: string | undefined): boolean | 'invalid' | 'empty' {
  const t = trimOrUndef(raw)
  if (t === undefined) return 'empty'
  const l = t.toLowerCase()
  if (['true', '1', 'yes', 'y'].includes(l)) return true
  if (['false', '0', 'no', 'n'].includes(l)) return false
  return 'invalid'
}

function parseFiniteNumber(raw: string | undefined): number | 'invalid' | 'empty' {
  const t = trimOrUndef(raw)
  if (t === undefined) return 'empty'
  const n = Number(t)
  return Number.isFinite(n) ? n : 'invalid'
}

function parsePositiveInt(raw: string | undefined): number | 'invalid' | 'empty' {
  const t = trimOrUndef(raw)
  if (t === undefined) return 'empty'
  const n = Number(t)
  if (!Number.isFinite(n) || !Number.isInteger(n) || n <= 0) return 'invalid'
  return n
}

/** 新建时的起始对象（字段会被 CSV 覆盖） */
export function defaultProductImportBase(): AdminProductUpsertRequest {
  return {
    title: '',
    price: 0.01,
    listPrice: null,
    currency: 'USD',
    moq: 1,
    description: '',
    isActive: true,
  }
}

/** 从现有商品构造导入合并底稿（不含 images/tagIds，避免误改） */
export function productDtoToImportBase(p: ProductDto): AdminProductUpsertRequest {
  const price = p.price != null ? Number(p.price) : NaN
  const listRaw = p.listPrice != null ? Number(p.listPrice) : null
  return {
    title: p.title,
    price: Number.isFinite(price) ? price : 0.01,
    listPrice: listRaw != null && Number.isFinite(listRaw) && listRaw > 0 ? listRaw : null,
    currency: (p.currency ?? 'USD').toUpperCase(),
    moq: p.moq,
    description: p.description ?? '',
    skuCode: p.skuCode ?? undefined,
    hsCode: p.hsCode ?? undefined,
    unit: p.unit ?? undefined,
    incoterm: p.incoterm ? String(p.incoterm).trim().toUpperCase() : undefined,
    originCountry: p.originCountry ?? undefined,
    leadTimeDays: p.leadTimeDays ?? undefined,
    weightKg: p.weightKg != null ? Number(p.weightKg) : undefined,
    categoryId: p.categoryId ?? undefined,
    shippingTemplateId: p.shippingTemplateId ?? undefined,
    isActive: p.isActive,
  }
}

export function productDtoToCsvLine(p: ProductDto): string {
  const cells: string[] = [
    escapeCsvField(p.id),
    escapeCsvField(p.title),
    escapeCsvField(p.price != null ? Number(p.price) : ''),
    escapeCsvField(p.listPrice != null ? Number(p.listPrice) : ''),
    escapeCsvField(p.currency ?? 'USD'),
    escapeCsvField(p.moq),
    escapeCsvField(p.isActive),
    escapeCsvField(p.description ?? ''),
    escapeCsvField(p.skuCode ?? ''),
    escapeCsvField(p.hsCode ?? ''),
    escapeCsvField(p.unit ?? ''),
    escapeCsvField(p.incoterm ?? ''),
    escapeCsvField(p.originCountry ?? ''),
    escapeCsvField(p.leadTimeDays ?? ''),
    escapeCsvField(p.weightKg != null ? Number(p.weightKg) : ''),
    escapeCsvField(p.categoryId ?? ''),
    escapeCsvField(p.shippingTemplateId ?? ''),
  ]
  return cells.join(',')
}

/** CSV 合并过程中的缓冲类型：可选字段允许 null，便于与 importPayloadForApi 转成后端 JSON */
type MutableUpsert = Omit<
  AdminProductUpsertRequest,
  | 'description'
  | 'skuCode'
  | 'hsCode'
  | 'unit'
  | 'incoterm'
  | 'originCountry'
  | 'leadTimeDays'
  | 'weightKg'
  | 'categoryId'
  | 'shippingTemplateId'
> & {
  description?: string | null
  skuCode?: string | null
  hsCode?: string | null
  unit?: string | null
  incoterm?: string | null
  originCountry?: string | null
  leadTimeDays?: number | null
  weightKg?: number | null
  categoryId?: number | null
  shippingTemplateId?: number | null
}

/**
 * 将一行 CSV 合并进 payload。
 * - 更新模式：空单元格表示不修改该字段。
 * - 清空可选字段：`-`、`__CLEAR__`、`(clear)`（大小写不敏感）。
 */
export function applyProductCsvRow(
  base: AdminProductUpsertRequest,
  row: Record<string, string>,
  opts: { isUpdate: boolean },
): { ok: true; payload: AdminProductUpsertRequest } | { ok: false; reason: string } {
  const b = { ...(base as MutableUpsert) }

  const applyOptStr = (
    key: 'skuCode' | 'hsCode' | 'unit' | 'incoterm' | 'originCountry',
    csvKey: string,
    upper?: boolean,
  ) => {
    const raw = row[csvKey]
    if (raw === undefined) return
    if (isClearToken(raw)) {
      b[key] = undefined
      return
    }
    const t = trimOrUndef(raw)
    if (t === undefined) {
      if (!opts.isUpdate) return
      return
    }
    b[key] = upper ? t.toUpperCase() : t
  }

  // title
  {
    const raw = row.title
    if (raw !== undefined) {
      if (isClearToken(raw)) return { ok: false, reason: 'title 不允许使用清空占位符' }
      const t = trimOrUndef(raw)
      if (t !== undefined) b.title = t
      else if (!opts.isUpdate) return { ok: false, reason: '新建时 title 不能为空' }
    } else if (!opts.isUpdate && !String(b.title).trim()) {
      return { ok: false, reason: '新建时 title 不能为空' }
    }
  }

  // price
  {
    const raw = row.price
    if (raw !== undefined && trimOrUndef(raw) !== undefined) {
      if (isClearToken(raw)) return { ok: false, reason: 'price 不允许清空' }
      const n = parseFiniteNumber(raw)
      if (n === 'invalid') return { ok: false, reason: 'price 格式无效' }
      if (n === 'empty') {
        if (!opts.isUpdate) return { ok: false, reason: '新建时 price 不能为空' }
      } else if (n <= 0) {
        return { ok: false, reason: 'price 必须 > 0' }
      } else {
        b.price = n
      }
    } else if (!opts.isUpdate && !(b.price > 0)) {
      return { ok: false, reason: '新建时 price 不能为空' }
    }
  }

  // listPrice
  {
    const raw = row.listPrice
    if (raw !== undefined) {
      if (isClearToken(raw)) {
        b.listPrice = null
      } else if (trimOrUndef(raw) !== undefined) {
        const n = parseFiniteNumber(raw)
        if (n === 'invalid') return { ok: false, reason: 'listPrice 格式无效' }
        if (n === 'empty') return { ok: false, reason: 'listPrice 不能为空' }
        if (n <= 0) return { ok: false, reason: 'listPrice 须 > 0 或留空/占位符清空' }
        b.listPrice = n
      }
    }
  }

  // currency
  {
    const raw = row.currency
    if (raw !== undefined && trimOrUndef(raw) !== undefined) {
      if (isClearToken(raw)) return { ok: false, reason: 'currency 不允许清空' }
      b.currency = trimOrUndef(raw)!.toUpperCase()
    }
  }

  // moq
  {
    const raw = row.moq
    if (raw !== undefined && trimOrUndef(raw) !== undefined) {
      if (isClearToken(raw)) return { ok: false, reason: 'moq 不允许清空' }
      const n = parseFiniteNumber(raw)
      if (n === 'invalid') return { ok: false, reason: 'moq 格式无效' }
      if (n === 'empty') return { ok: false, reason: 'moq 不能为空' }
      if (!Number.isInteger(n)) return { ok: false, reason: 'moq 须为整数' }
      if (n < 1) return { ok: false, reason: 'moq 必须 >= 1' }
      b.moq = n
    } else if (!opts.isUpdate && b.moq < 1) {
      return { ok: false, reason: '新建时 moq 无效' }
    }
  }

  // isActive
  {
    const raw = row.isActive
    if (raw !== undefined && trimOrUndef(raw) !== undefined) {
      const p = parseBool(raw)
      if (p === 'invalid') return { ok: false, reason: 'isActive 须为 true/false/1/0' }
      if (p !== 'empty') b.isActive = p
    }
  }

  // description
  {
    const raw = row.description
    if (raw !== undefined) {
      if (isClearToken(raw)) {
        b.description = undefined
      } else if (trimOrUndef(raw) !== undefined) {
        b.description = trimOrUndef(raw)!
      } else if (!opts.isUpdate) {
        b.description = ''
      }
    }
  }

  applyOptStr('skuCode', 'skuCode')
  applyOptStr('hsCode', 'hsCode')
  applyOptStr('unit', 'unit')
  applyOptStr('incoterm', 'incoterm', true)
  applyOptStr('originCountry', 'originCountry')

  // leadTimeDays
  {
    const raw = row.leadTimeDays
    if (raw !== undefined && trimOrUndef(raw) !== undefined) {
      if (isClearToken(raw)) {
        b.leadTimeDays = undefined
      } else {
        const n = parseFiniteNumber(raw)
        if (n === 'invalid') return { ok: false, reason: 'leadTimeDays 格式无效' }
        if (n === 'empty') return { ok: false, reason: 'leadTimeDays 不能为空' }
        if (!Number.isInteger(n) || n < 0) {
          return { ok: false, reason: 'leadTimeDays 须为非负整数' }
        }
        b.leadTimeDays = n
      }
    }
  }

  // weightKg
  {
    const raw = row.weightKg
    if (raw !== undefined && trimOrUndef(raw) !== undefined) {
      if (isClearToken(raw)) {
        b.weightKg = undefined
      } else {
        const n = parseFiniteNumber(raw)
        if (n === 'invalid') return { ok: false, reason: 'weightKg 格式无效' }
        if (n === 'empty') return { ok: false, reason: 'weightKg 不能为空' }
        if (n < 0) return { ok: false, reason: 'weightKg 须为 >=0 的数字' }
        b.weightKg = n
      }
    }
  }

  // categoryId
  {
    const raw = row.categoryId
    if (raw !== undefined && trimOrUndef(raw) !== undefined) {
      if (isClearToken(raw)) {
        b.categoryId = undefined
      } else {
        const n = parsePositiveInt(raw)
        if (n === 'invalid') return { ok: false, reason: 'categoryId 无效' }
        if (n !== 'empty') b.categoryId = n
      }
    }
  }

  // shippingTemplateId
  {
    const raw = row.shippingTemplateId
    if (raw !== undefined && trimOrUndef(raw) !== undefined) {
      if (isClearToken(raw)) {
        b.shippingTemplateId = undefined
      } else {
        const n = parsePositiveInt(raw)
        if (n === 'invalid') return { ok: false, reason: 'shippingTemplateId 无效' }
        if (n !== 'empty') b.shippingTemplateId = n
      }
    }
  }

  if (!String(b.title).trim()) return { ok: false, reason: 'title 不能为空' }
  if (!(b.price > 0)) return { ok: false, reason: 'price 必须 > 0' }
  if (b.moq < 1) return { ok: false, reason: 'moq 必须 >= 1' }
  const lp = b.listPrice
  if (lp != null && lp < b.price) return { ok: false, reason: 'listPrice 必须 >= price' }

  return { ok: true, payload: importPayloadForApi(b) }
}

/**
 * 转成后端接受的 JSON（不写 images/tagIds；description / 可选字段显式 null 表示清空）。
 */
export function importPayloadForApi(b: MutableUpsert): AdminProductUpsertRequest {
  const desc = b.description
  const description =
    desc === null || desc === undefined ? null : String(desc).trim() === '' ? '' : String(desc).trim()

  const payload = {
    title: String(b.title).trim(),
    price: Number(b.price),
    listPrice: b.listPrice != null && b.listPrice > 0 ? Number(b.listPrice) : null,
    currency: String(b.currency ?? 'USD').trim().toUpperCase(),
    moq: Number(b.moq),
    description,
    skuCode: b.skuCode ?? null,
    hsCode: b.hsCode ?? null,
    unit: b.unit ?? null,
    incoterm: b.incoterm ? String(b.incoterm).trim().toUpperCase() : null,
    originCountry: b.originCountry ?? null,
    leadTimeDays: b.leadTimeDays ?? null,
    weightKg: b.weightKg ?? null,
    categoryId: b.categoryId ?? null,
    shippingTemplateId: b.shippingTemplateId ?? null,
    isActive: Boolean(b.isActive),
  }
  return payload as AdminProductUpsertRequest
}
