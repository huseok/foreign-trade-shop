import { QueryClient } from '@tanstack/react-query'

/**
 * React Query 全局客户端：
 * 统一查询默认参数，避免每个页面重复配置。
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
})
