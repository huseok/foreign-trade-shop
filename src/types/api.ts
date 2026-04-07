/**
 * 与 voyage 后端对齐的核心 API 类型定义。
 */
export type LoginRequest = {
  email: string
  password: string
}

export type RegisterRequest = {
  email: string
  password: string
  name: string
  phone?: string
  country?: string
}

export type LoginResponse = {
  token: string
}

export type MeResponse = {
  id: number
  email: string
  name: string
  role: string
}

export type ProductDto = {
  id: number
  title: string
  moq: number
  description: string | null
  skuCode: string | null
  hsCode: string | null
  unit: string | null
  incoterm: string | null
  originCountry: string | null
  leadTimeDays: number | null
  isActive: boolean
  price: number | null
  currency: string | null
}

export type AdminProductUpsertRequest = {
  title: string
  price: number
  currency: string
  moq: number
  description?: string
  skuCode?: string
  hsCode?: string
  unit?: string
  incoterm?: string
  originCountry?: string
  leadTimeDays?: number
  isActive: boolean
}

export type CartItemDto = {
  itemId: number
  productId: number
  title: string
  quantity: number
  unitPrice: string
  currency: string
  lineAmount: string
}

export type CartDto = {
  items: CartItemDto[]
  totalAmount: string
  currency: string
}

export type CreateOrderRequest = {
  receiverName: string
  receiverPhone: string
  country: string
  addressLine: string
  postalCode?: string
  receiverCompany?: string
  taxNo?: string
  incoterm?: string
  shippingMethod?: string
}

export type OrderItemDto = {
  productId: number
  titleSnapshot: string
  priceSnapshot: string
  quantity: number
}

export type OrderDto = {
  orderNo: string
  status: string
  totalAmount: string
  currency: string
  receiverName: string
  receiverPhone: string
  receiverCompany: string | null
  taxNo: string | null
  country: string
  addressLine: string
  postalCode: string | null
  incoterm: string | null
  shippingMethod: string | null
  logisticsCompany: string | null
  trackingNo: string | null
  items: OrderItemDto[]
}

export type CreateAfterSaleRequest = {
  orderNo: string
  content: string
}

export type AfterSaleDto = {
  id: number
  orderNo: string
  status: string
  content: string
}
