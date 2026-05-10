import axios from 'axios'
import type { AppError } from './error'
import { authStore } from '../auth/authStore'
import { getAccessTtlSecondsRemaining } from '../auth/tokenStorage'
import type { ApiResponse } from './apiClientTypes'
import type { LoginResponse } from '../../types/api'

export type { ApiResponse } from './apiClientTypes'

/**
 * 后端 API 根地址。
 * - 开发默认：`http://localhost:8080`
 * - 生产可设为完整 URL；若前端与 API 同域（Nginx 反代 `/api`），在 `.env.production` 设 `VITE_API_BASE_URL=` 空字符串即可走相对路径。
 */
function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL as string | undefined
  if (raw === '') return ''
  if (raw != null && raw.trim() !== '') return raw.replace(/\/$/, '')
  return 'http://localhost:8080'
}

export const API_BASE_URL = resolveApiBaseUrl()

/**
 * 全局 Axios 实例。
 *
 * - `baseURL`：见 `API_BASE_URL`
 * - 请求拦截：自动附加 `Authorization: Bearer <accessToken>`
 * - 响应拦截：401 时用 refresh 轮换 access，失败则清空并跳转登录
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

function loginPathForCurrentApp(): string {
  return window.location.pathname.startsWith('/admin') ? '/admin/login' : '/login'
}

/** 并发 401 时共用一个 refresh 请求 */
let refreshPromise: Promise<LoginResponse | null> | null = null

async function refreshWithBackend(): Promise<LoginResponse | null> {
  const rt = authStore.getRefreshToken()
  if (!rt) return null
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const { data } = await axios.post<ApiResponse<LoginResponse>>(
          `${API_BASE_URL}/api/v1/auth/refresh`,
          { refreshToken: rt },
          { headers: { 'Content-Type': 'application/json' }, timeout: 15_000 }
        )
        if (data.code !== 0 || !data.data) return null
        const d = data.data
        authStore.setSession(d.accessToken, d.refreshToken, d.expiresIn)
        return d
      } catch {
        return null
      } finally {
        refreshPromise = null
      }
    })()
  }
  return refreshPromise
}

let accessRefreshTimer: ReturnType<typeof setTimeout> | null = null

/**
 * 在 access 将过期前主动 refresh（与后端 `expiresIn` 对齐，默认提前约 90s）。
 */
/** 应用启动时调用：根据本地记录的过期时间恢复主动 refresh */
export function bootstrapAuthRefreshSchedule() {
  const left = getAccessTtlSecondsRemaining()
  if (left == null || !authStore.getRefreshToken()) return
  if (left < 120) {
    void refreshWithBackend().then((d) => {
      if (d) scheduleAccessTokenRefresh(d.expiresIn)
      else {
        authStore.clearToken()
        const p = loginPathForCurrentApp()
        if (!window.location.pathname.startsWith(p)) window.location.assign(p)
      }
    })
    return
  }
  scheduleAccessTokenRefresh(left)
}

export function scheduleAccessTokenRefresh(expiresInSeconds: number) {
  if (accessRefreshTimer) {
    clearTimeout(accessRefreshTimer)
    accessRefreshTimer = null
  }
  if (!Number.isFinite(expiresInSeconds) || expiresInSeconds < 120) return
  const delayMs = Math.max((expiresInSeconds - 90) * 1000, 25_000)
  accessRefreshTimer = setTimeout(async () => {
    accessRefreshTimer = null
    const d = await refreshWithBackend()
    if (!d) {
      authStore.clearToken()
      const p = loginPathForCurrentApp()
      if (!window.location.pathname.startsWith(p)) window.location.assign(p)
      return
    }
    scheduleAccessTokenRefresh(d.expiresIn)
  }, delayMs)
}

apiClient.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const status = error?.response?.status ?? 0
    const message =
      error?.response?.data?.message ?? error?.message ?? 'Network error'
    const originalRequest = error.config as typeof error.config & { _retry?: boolean }

    if (status === 401 && originalRequest) {
      const url = String(originalRequest.url ?? '')
      if (
        url.includes('/api/v1/auth/login') ||
        url.includes('/api/v1/auth/register') ||
        url.includes('/api/v1/auth/refresh')
      ) {
        authStore.clearToken()
        const loginPath = loginPathForCurrentApp()
        if (!window.location.pathname.startsWith(loginPath)) {
          window.location.assign(loginPath)
        }
        const appError: AppError = { status, message }
        return Promise.reject(appError)
      }

      if (!originalRequest._retry) {
        originalRequest._retry = true
        const refreshed = await refreshWithBackend()
        if (refreshed) {
          originalRequest.headers.Authorization = `Bearer ${refreshed.accessToken}`
          scheduleAccessTokenRefresh(refreshed.expiresIn)
          return apiClient.request(originalRequest)
        }
      }

      authStore.clearToken()
      const loginPath = loginPathForCurrentApp()
      if (!window.location.pathname.startsWith(loginPath)) {
        window.location.assign(loginPath)
      }
    }

    const appError: AppError = { status, message }
    return Promise.reject(appError)
  },
)
