/**
 * JWT 本地存储工具：
 * 统一管理 token 的读写与清理，避免在页面里散落 localStorage 代码。
 */
const ACCESS_TOKEN_KEY = 'globuy_access_token_v1'

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

export function setAccessToken(token: string) {
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY)
}
