import {
  clearAllTokens,
  getAccessToken,
  getRefreshToken,
  setAccessExpiresAtFromTtl,
  setAccessToken,
  setRefreshToken,
} from './tokenStorage'

/**
 * 轻量登录态存储：
 * 这里不使用复杂状态库，仅暴露统一方法给请求层与路由层复用。
 */
export const authStore = {
  getToken: getAccessToken,
  getRefreshToken,

  /** 登录或 refresh 成功后写入一对 token；`expiresIn` 为 access 剩余 TTL（秒） */
  setSession(accessToken: string, refreshToken: string, expiresInSeconds?: number) {
    setAccessToken(accessToken)
    setRefreshToken(refreshToken)
    if (typeof expiresInSeconds === 'number') {
      setAccessExpiresAtFromTtl(expiresInSeconds)
    }
  },

  clearToken() {
    clearAllTokens()
  },

  isLoggedIn(): boolean {
    return Boolean(getAccessToken())
  },
}
