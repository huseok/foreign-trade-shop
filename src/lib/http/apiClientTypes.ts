/** 后端统一响应结构，与 voyage 的 `ApiResponse<T>` 对齐。 */
export type ApiResponse<T> = {
  code: number
  message: string
  data: T
}
