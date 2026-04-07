import { apiClient, type ApiResponse } from '../lib/http/apiClient'
import type { CreateOrderRequest, OrderDto } from '../types/api'

/**
 * 订单相关 API。
 */
export const ordersApi = {
  async create(payload: CreateOrderRequest): Promise<{ orderNo: string }> {
    const { data } = await apiClient.post<ApiResponse<{ orderNo: string }>>(
      '/api/v1/orders',
      payload,
    )
    return data.data
  },

  async listMine(): Promise<OrderDto[]> {
    const { data } = await apiClient.get<ApiResponse<OrderDto[]>>('/api/v1/orders')
    return data.data
  },

  async detail(orderNo: string): Promise<OrderDto> {
    const { data } = await apiClient.get<ApiResponse<OrderDto>>(`/api/v1/orders/${orderNo}`)
    return data.data
  },

  async confirmCompleted(orderNo: string): Promise<void> {
    await apiClient.patch<ApiResponse<string>>(
      `/api/v1/orders/${orderNo}/confirm-completed`,
    )
  },
}
