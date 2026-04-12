/**
 * Voyage HTTP 客户端（与 OpenAPI 契约对齐）。
 *
 * - 契约文件：`openapi/openapi.json`
 * - 类型来源：`src/generated/voyage-paths.ts`（由 `npm run codegen:openapi` 生成）
 * - 后端实际响应为 `{ code, message, data }`；本模块所有方法返回的均为 **解包后的 `data`**。
 *
 * 使用 `getData` / `postData` 等辅助函数而非在 `apiClient` 上直接写嵌套泛型，
 * 是为了避免 TypeScript 将连续的 `>>` 解析为位移运算符。
 */
import type { components } from '../generated/voyage-paths'
import { apiClient, type ApiResponse } from '../lib/http/apiClient'

/** 缩短书写：等价于 `components['schemas']` */
type S = components['schemas']

/** 按业务域分组的 API，供 hooks 与少量页面直接调用 */
export const voyage = {
  /** 注册、登录、改密、当前用户 */
  auth: {
    register(body: S['RegisterRequest']): Promise<string> {
      return postData<string>('/api/v1/auth/register', body)
    },
    login(body: S['LoginRequest']): Promise<S['LoginResponse']> {
      return postData<S['LoginResponse']>('/api/v1/auth/login', body)
    },
    changePassword(body: S['ChangePasswordRequest']): Promise<string> {
      return postData<string>('/api/v1/auth/change-password', body)
    },
    me(): Promise<S['MeResponse']> {
      return getData<S['MeResponse']>('/api/v1/auth/me')
    },
  },

  /** 商品列表/详情；admin* 需 ADMIN */
  products: {
    list(): Promise<S['ProductView'][]> {
      return getData<S['ProductView'][]>('/api/v1/products')
    },
    getById(id: number): Promise<S['ProductView']> {
      return getData<S['ProductView']>(`/api/v1/products/${id}`)
    },
    adminCreate(body: S['ProductAdminUpsertRequest']): Promise<S['IdPayload']> {
      return postData<S['IdPayload']>('/api/v1/admin/products', body)
    },
    adminUpdate(id: number, body: S['ProductAdminUpsertRequest']): Promise<string> {
      return putData<string>(`/api/v1/admin/products/${id}`, body)
    },
  },

  /** 购物车；全部接口需登录 */
  cart: {
    get(): Promise<S['CartView']> {
      return getData<S['CartView']>('/api/v1/cart')
    },
    addItem(body: S['AddCartItemRequest']): Promise<string> {
      return postData<string>('/api/v1/cart/items', body)
    },
    updateItem(itemId: number, body: S['UpdateCartItemRequest']): Promise<string> {
      return patchData<string>(`/api/v1/cart/items/${itemId}`, body)
    },
    removeItem(itemId: number): Promise<string> {
      return deleteData<string>(`/api/v1/cart/items/${itemId}`)
    },
  },

  /** 用户订单 + 管理端订单操作 */
  orders: {
    listMine(): Promise<S['OrderView'][]> {
      return getData<S['OrderView'][]>('/api/v1/orders')
    },
    create(body: S['CreateOrderRequest']): Promise<S['OrderNoPayload']> {
      return postData<S['OrderNoPayload']>('/api/v1/orders', body)
    },
    getByOrderNo(orderNo: string): Promise<S['OrderView']> {
      return getData<S['OrderView']>(`/api/v1/orders/${orderNo}`)
    },
    confirmCompleted(orderNo: string): Promise<string> {
      return patchData<string>(`/api/v1/orders/${orderNo}/confirm-completed`)
    },
    adminList(): Promise<S['OrderView'][]> {
      return getData<S['OrderView'][]>('/api/v1/admin/orders')
    },
    adminUpdateTracking(orderNo: string, body: S['UpdateTrackingRequest']): Promise<string> {
      return patchData<string>(`/api/v1/admin/orders/${orderNo}/tracking-no`, body)
    },
    adminUpdateStatus(orderNo: string, body: S['UpdateOrderStatusRequest']): Promise<string> {
      return patchData<string>(`/api/v1/admin/orders/${orderNo}/status`, body)
    },
  },

  /** 售后：用户侧 + 管理端列表/更新状态 */
  afterSales: {
    create(body: S['CreateAfterSaleRequest']): Promise<string> {
      return postData<string>('/api/v1/after-sales', body)
    },
    listMine(): Promise<S['AfterSaleView'][]> {
      return getData<S['AfterSaleView'][]>('/api/v1/after-sales')
    },
    adminList(): Promise<S['AfterSaleView'][]> {
      return getData<S['AfterSaleView'][]>('/api/v1/admin/after-sales')
    },
    adminUpdateStatus(id: number, body: S['UpdateAfterSaleStatusRequest']): Promise<string> {
      return patchData<string>(`/api/v1/admin/after-sales/${id}/status`, body)
    },
  },
}

/** 从 Axios 响应中取出 `data.data`（业务载荷） */
async function unwrap<T>(p: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  const { data } = await p
  return data.data as T
}

/** GET + 解包 */
function getData<T>(url: string) {
  return unwrap(apiClient.get<ApiResponse<T>>(url))
}

/** POST + 解包 */
function postData<T>(url: string, body?: unknown) {
  return unwrap(apiClient.post<ApiResponse<T>>(url, body))
}

/** PUT + 解包 */
function putData<T>(url: string, body?: unknown) {
  return unwrap(apiClient.put<ApiResponse<T>>(url, body))
}

/** PATCH + 解包 */
function patchData<T>(url: string, body?: unknown) {
  return unwrap(apiClient.patch<ApiResponse<T>>(url, body))
}

/** DELETE + 解包 */
function deleteData<T>(url: string) {
  return unwrap(apiClient.delete<ApiResponse<T>>(url))
}

export type { components } from '../generated/voyage-paths'
