/**
 * 统一错误类型：
 * 把后端错误结构和网络错误收敛为前端可直接展示的 message。
 */
export type AppError = {
  status: number
  message: string
}

export function toErrorMessage(err: unknown, fallback = 'Request failed'): string {
  if (typeof err === 'string') return err
  if (err && typeof err === 'object' && 'message' in err) {
    const message = (err as { message?: unknown }).message
    if (typeof message === 'string' && message.trim()) return message
  }
  return fallback
}
