import { apiClient, type ApiResponse } from '../lib/http/apiClient'
import type { CartDto } from '../types/api'

export type AddCartItemPayload = {
  productId: number
  quantity: number
}

export type UpdateCartItemPayload = {
  quantity: number
}

/**
 * 购物车相关 API。
 */
export const cartApi = {
  async getCart(): Promise<CartDto> {
    const { data } = await apiClient.get<ApiResponse<CartDto>>('/api/v1/cart')
    return data.data
  },

  async addItem(payload: AddCartItemPayload): Promise<void> {
    await apiClient.post<ApiResponse<string>>('/api/v1/cart/items', payload)
  },

  async updateItem(itemId: number, payload: UpdateCartItemPayload): Promise<void> {
    await apiClient.patch<ApiResponse<string>>(`/api/v1/cart/items/${itemId}`, payload)
  },

  async removeItem(itemId: number): Promise<void> {
    await apiClient.delete<ApiResponse<string>>(`/api/v1/cart/items/${itemId}`)
  },
}
