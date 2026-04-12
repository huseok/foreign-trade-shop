/**
 * React Query 封装：与 `voyageSdk` 一一对应的查询与变更 hooks。
 *
 * - 查询键集中在 `queryKeys`，作废缓存时请使用同一前缀，避免 UI 与后端不一致。
 * - 变更成功后对 `cart` / `orders` / `products` / `admin*` 等键做 `invalidateQueries`，
 *   具体策略见各 `useGuardedMutation` 的 `onSuccess`。
 */
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useGuardedMutation } from '../lib/mutation/useGuardedMutation'
import type { components } from '../generated/voyage-paths'
import { voyage } from '../openapi/voyageSdk'
import type {
  AdminProductUpsertRequest,
  CreateOrderRequest,
  LoginRequest,
  RegisterRequest,
} from '../types/api'

export type AddCartItemPayload = components['schemas']['AddCartItemRequest']
export type UpdateCartItemPayload = components['schemas']['UpdateCartItemRequest']

/** React Query 缓存键；修改结构时需全局搜索引用处 */
export const queryKeys = {
  me: ['me'] as const,
  /** 作废所有商品相关查询（列表分页键均以 `products` 为前缀） */
  productsRoot: ['products'] as const,
  product: (id: number) => ['products', 'detail', id] as const,
  cart: ['cart'] as const,
  orders: ['orders'] as const,
  order: (orderNo: string) => ['orders', orderNo] as const,
  adminOrders: ['admin', 'orders'] as const,
  adminAfterSales: ['admin', 'after-sales'] as const,
}

export function useLogin() {
  return useGuardedMutation({
    mutationFn: (payload: LoginRequest) => voyage.auth.login(payload),
  })
}

export function useRegister() {
  return useGuardedMutation({
    mutationFn: (payload: RegisterRequest) => voyage.auth.register(payload),
  })
}

export function useMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => voyage.auth.me(),
    enabled,
  })
}

export type StorefrontProductsParams = {
  page: number
  size: number
  country?: string
  q?: string
}

/** 前台商品分页列表（仅上架） */
export function useStorefrontProducts(params: StorefrontProductsParams, enabled = true) {
  return useQuery({
    queryKey: [
      'products',
      'store',
      params.page,
      params.size,
      params.country ?? '',
      params.q ?? '',
    ] as const,
    queryFn: () => voyage.products.listPaged(params),
    enabled,
  })
}

export type AdminProductsListParams = {
  page: number
  size: number
  q?: string
  /** 不传=全部；true=仅上架；false=仅下架 */
  active?: boolean
}

/** 管理端商品分页列表（含下架） */
export function useAdminProductsPage(params: AdminProductsListParams) {
  return useQuery({
    queryKey: [
      'products',
      'admin',
      params.page,
      params.size,
      params.q ?? '',
      params.active === true ? '1' : params.active === false ? '0' : '',
    ] as const,
    queryFn: () => voyage.products.adminListPaged(params),
  })
}

export function useProductDetail(id?: number) {
  return useQuery({
    queryKey: queryKeys.product(id ?? 0),
    queryFn: () => voyage.products.getById(id!),
    enabled: typeof id === 'number' && Number.isFinite(id),
  })
}

/** 管理端商品详情（含下架），用于编辑页 */
export function useAdminProductDetail(id?: number) {
  return useQuery({
    queryKey: ['products', 'admin-detail', id ?? 0] as const,
    queryFn: () => voyage.products.adminGetById(id!),
    enabled: typeof id === 'number' && Number.isFinite(id),
  })
}

/** 管理端新建商品；成功后刷新商品列表缓存 */
export function useCreateAdminProduct() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (payload: AdminProductUpsertRequest) => voyage.products.adminCreate(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.productsRoot })
    },
  })
}

/** 管理端更新商品；成功后刷新列表与对应详情缓存 */
export function useUpdateAdminProduct() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: ({ id, payload }: { id: number; payload: AdminProductUpsertRequest }) =>
      voyage.products.adminUpdate(id, payload),
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({ queryKey: queryKeys.productsRoot })
      void qc.invalidateQueries({ queryKey: queryKeys.product(vars.id) })
      void qc.invalidateQueries({ queryKey: ['products', 'admin-detail', vars.id] })
    },
  })
}

export function useCart(enabled = true) {
  return useQuery({
    queryKey: queryKeys.cart,
    queryFn: () => voyage.cart.get(),
    enabled,
  })
}

export function useAddCartItem() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (payload: AddCartItemPayload) => voyage.cart.addItem(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.cart })
    },
  })
}

export function useUpdateCartItem() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: UpdateCartItemPayload }) =>
      voyage.cart.updateItem(itemId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.cart })
    },
  })
}

export function useRemoveCartItem() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (itemId: number) => voyage.cart.removeItem(itemId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.cart })
    },
  })
}

/** 下单成功后刷新购物车与「我的订单」列表 */
export function useCreateOrder() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (payload: CreateOrderRequest) => voyage.orders.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.cart })
      void qc.invalidateQueries({ queryKey: queryKeys.orders })
    },
  })
}

/** 当前登录用户的订单列表 */
export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: () => voyage.orders.listMine(),
  })
}

/** 订单详情；参数为后端订单号 `orderNo` */
export function useOrderDetail(orderNo?: string) {
  return useQuery({
    queryKey: queryKeys.order(orderNo ?? ''),
    queryFn: () => voyage.orders.getByOrderNo(orderNo!),
    enabled: Boolean(orderNo),
  })
}

/** 管理端：全量订单列表（需 ADMIN + voyage 接口） */
export function useAdminOrders() {
  return useQuery({
    queryKey: queryKeys.adminOrders,
    queryFn: () => voyage.orders.adminList(),
  })
}

/** 管理端：全部售后工单 */
export function useAdminAfterSales() {
  return useQuery({
    queryKey: queryKeys.adminAfterSales,
    queryFn: () => voyage.afterSales.adminList(),
  })
}

/** 管理端：更新物流；成功后刷新管理订单与我的订单（若同一用户） */
export function useAdminUpdateOrderTracking() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: ({
      orderNo,
      body,
    }: {
      orderNo: string
      body: components['schemas']['UpdateTrackingRequest']
    }) => voyage.orders.adminUpdateTracking(orderNo, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.adminOrders })
      void qc.invalidateQueries({ queryKey: queryKeys.orders })
    },
  })
}

/** 管理端：推进订单状态 */
export function useAdminUpdateOrderStatus() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: ({
      orderNo,
      body,
    }: {
      orderNo: string
      body: components['schemas']['UpdateOrderStatusRequest']
    }) => voyage.orders.adminUpdateStatus(orderNo, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.adminOrders })
      void qc.invalidateQueries({ queryKey: queryKeys.orders })
    },
  })
}

/** 管理端：更新售后工单状态 */
export function useAdminUpdateAfterSaleStatus() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: ({
      id,
      body,
    }: {
      id: number
      body: components['schemas']['UpdateAfterSaleStatusRequest']
    }) => voyage.afterSales.adminUpdateStatus(id, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.adminAfterSales })
    },
  })
}
