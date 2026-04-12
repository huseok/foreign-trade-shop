import axios from 'axios'
import type { AppError } from './error'
import { authStore } from '../auth/authStore'

/** 后端 API 根地址；可通过 `VITE_API_BASE_URL` 覆盖 */
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080'

/**
 * 后端统一响应结构，与 voyage 的 `ApiResponse<T>` 对齐。
 * Axios 的 `response.data` 即为本类型实例。
 */
export type ApiResponse<T> = {
  code: number
  message: string
  data: T
}

/**
 * 全局 Axios 实例。
 *
 * - `baseURL`：见 `API_BASE_URL`
 * - 请求拦截：自动附加 `Authorization: Bearer <token>`
 * - 响应拦截：401 时清空 token，并按当前应用（商城 / 后台）跳转到对应登录页
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

/**
 * 根据当前 URL 判断属于商城还是管理后台，用于 401 后跳转登录页。
 *
 * - 路径以 `/admin` 开头 → `/admin/login`
 * - 否则 → `/login`（商城）
 */
function loginPathForCurrentApp(): string {
  return window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login'
}

apiClient.interceptors.response.use(
  (resp) => resp,
  (error) => {
    const status = error?.response?.status ?? 0
    const message =
      error?.response?.data?.message ?? error?.message ?? 'Network error'

    if (status === 401) {
      authStore.clearToken()
      const loginPath = loginPathForCurrentApp()
      // 已在登录页则不再强制跳转，避免死循环
      if (!window.location.pathname.startsWith(loginPath)) {
        window.location.assign(loginPath)
      }
    }

    const appError: AppError = { status, message }
    return Promise.reject(appError)
  },
)
