import { apiClient, type ApiResponse } from '../lib/http/apiClient'
import type { AfterSaleDto, CreateAfterSaleRequest } from '../types/api'

/**
 * 售后相关 API。
 */
export const afterSalesApi = {
  async create(payload: CreateAfterSaleRequest): Promise<void> {
    await apiClient.post<ApiResponse<string>>('/api/v1/after-sales', payload)
  },

  async listMine(): Promise<AfterSaleDto[]> {
    const { data } = await apiClient.get<ApiResponse<AfterSaleDto[]>>('/api/v1/after-sales')
    return data.data
  },
}
