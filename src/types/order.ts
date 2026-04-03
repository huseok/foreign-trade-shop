/**
 * 本地持久化订单结构（演示），与后端对齐时可扩展支付、物流等字段。
 */
export type OrderStatus = 'pending' | 'paid' | 'fulfilled' | 'cancelled'

export type OrderLine = {
  productId: string
  name: string
  sku: string
  qty: number
  unitPrice: number
  lineTotal: number
  currency: string
}

export type StoredOrder = {
  id: string
  createdAt: string
  status: OrderStatus
  customer: {
    name: string
    email: string
    phone: string
    company: string
  }
  shipping: {
    address1: string
    address2: string
    city: string
    region: string
    zip: string
    country: string
  }
  notes: string
  lines: OrderLine[]
  subtotal: number
  currency: string
}
