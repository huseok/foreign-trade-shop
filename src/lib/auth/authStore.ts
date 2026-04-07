import { clearAccessToken, getAccessToken, setAccessToken } from './tokenStorage'

/**
 * 轻量登录态存储：
 * 这里不使用复杂状态库，仅暴露统一方法给请求层与路由层复用。
 */
export const authStore = {
  getToken: getAccessToken,
  setToken(token: string) {
    setAccessToken(token)
  },
  clearToken() {
    clearAccessToken()
  },
  isLoggedIn(): boolean {
    return Boolean(getAccessToken())
  },
}
