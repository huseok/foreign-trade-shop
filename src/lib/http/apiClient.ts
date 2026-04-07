import axios from 'axios'
import type { AppError } from './error'
import { authStore } from '../auth/authStore'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

/**
 * 后端统一响应结构，与 voyage 后端 ApiResponse 对齐。
 */
export type ApiResponse<T> = {
  code: number
  message: string
  data: T
}

/**
 * 全局 axios 实例：
 * - 统一 baseURL 与超时
 * - 自动注入 Bearer token
 * - 统一处理 401（清 token）
 */
export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10_000,
})

apiClient.interceptors.request.use((config) => {
  const token = authStore.getToken()
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

apiClient.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const status = error?.response?.status ?? 0
    const message =
      error?.response?.data?.message ??
      error?.message ??
      'Network error'

    if (status === 401) {
      authStore.clearToken()
      // 统一 401 处理：清理登录态并跳到登录页
      if (!window.location.pathname.startsWith('/login')) {
        window.location.assign('/login')
      }
    }

    const appError: AppError = { status, message }
    return Promise.reject(appError)
  },
)
