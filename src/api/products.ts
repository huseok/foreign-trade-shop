import { apiClient, type ApiResponse } from '../lib/http/apiClient'
import type { AdminProductUpsertRequest, ProductDto } from '../types/api'

/**
 * 商品相关 API。
 */
export const productsApi = {
  /**
   * 获取商品列表（公开接口，登录后价格字段会返回）。
   */
  async list(): Promise<ProductDto[]> {
    const { data } = await apiClient.get<ApiResponse<ProductDto[]>>('/api/v1/products')
    return data.data
  },

  /**
   * 获取商品详情。
   *
   * @param id 商品 ID
   */
  async detail(id: number): Promise<ProductDto> {
    const { data } = await apiClient.get<ApiResponse<ProductDto>>(`/api/v1/products/${id}`)
    return data.data
  },

  /**
   * 后台新增商品（需 ADMIN 权限）。
   *
   * @param payload 商品创建参数
   */
  async createByAdmin(payload: AdminProductUpsertRequest): Promise<{ id: number }> {
    const { data } = await apiClient.post<ApiResponse<{ id: number }>>(
      '/api/v1/admin/products',
      payload,
    )
    return data.data
  },
}
