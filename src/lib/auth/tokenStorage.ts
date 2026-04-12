/**
 * JWT 本地存储工具：
 * Access 用于 API；Refresh 仅用于调用 `/auth/refresh`，勿发到其它路径。
 */
const ACCESS_TOKEN_KEY = 'globuy_access_token_v1'
const REFRESH_TOKEN_KEY = 'globuy_refresh_token_v1'
/** 预计 access 过期时间戳（ms），用于刷新页后恢复主动 refresh */
const ACCESS_EXPIRES_AT_KEY = 'globuy_access_expires_at_v1'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

export function setRefreshToken(token: string) {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

export function clearRefreshToken() {
  localStorage.removeItem(REFRESH_TOKEN_KEY)
}

export function clearAllTokens() {
  clearAccessToken()
  clearRefreshToken()
  localStorage.removeItem(ACCESS_EXPIRES_AT_KEY)
}

export function setAccessExpiresAtFromTtl(expiresInSeconds: number) {
  if (!Number.isFinite(expiresInSeconds)) return
  localStorage.setItem(ACCESS_EXPIRES_AT_KEY, String(Date.now() + expiresInSeconds * 1000))
}

/** 距离 access 过期的剩余秒数（粗略，用于调度）；无记录时返回 null */
export function getAccessTtlSecondsRemaining(): number | null {
  const raw = localStorage.getItem(ACCESS_EXPIRES_AT_KEY)
  if (!raw) return null
  const exp = Number(raw)
  if (!Number.isFinite(exp)) return null
  return Math.max(0, (exp - Date.now()) / 1000)
}
