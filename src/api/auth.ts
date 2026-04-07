import { apiClient, type ApiResponse } from '../lib/http/apiClient'
import type {
  LoginRequest,
  LoginResponse,
  MeResponse,
  RegisterRequest,
} from '../types/api'

/**
 * 认证相关 API。
 */
export const authApi = {
  /**
   * 用户注册。
   */
  async register(payload: RegisterRequest): Promise<void> {
    await apiClient.post<ApiResponse<string>>('/api/v1/auth/register', payload)
  },

  /**
   * 用户登录，返回 JWT。
   */
  async login(payload: LoginRequest): Promise<LoginResponse> {
    const { data } = await apiClient.post<ApiResponse<LoginResponse>>(
      '/api/v1/auth/login',
      payload,
    )
    return data.data
  },

  /**
   * 获取当前登录用户信息。
   */
  async me(): Promise<MeResponse> {
    const { data } = await apiClient.get<ApiResponse<MeResponse>>('/api/v1/auth/me')
    return data.data
  },
}
