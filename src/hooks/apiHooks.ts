import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/auth'
import { cartApi, type AddCartItemPayload, type UpdateCartItemPayload } from '../api/cart'
import { ordersApi } from '../api/orders'
import { productsApi } from '../api/products'
import type {
  AdminProductUpsertRequest,
  CreateOrderRequest,
  LoginRequest,
} from '../types/api'

export const queryKeys = {
  me: ['me'] as const,
  products: ['products'] as const,
  product: (id: number) => ['products', id] as const,
  cart: ['cart'] as const,
  orders: ['orders'] as const,
  order: (orderNo: string) => ['orders', orderNo] as const,
}

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginRequest) => authApi.login(payload),
  })
}

export function useMe(enabled = true) {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => authApi.me(),
    enabled,
  })
}

export function useProducts() {
  return useQuery({
    queryKey: queryKeys.products,
    queryFn: () => productsApi.list(),
  })
}

export function useProductDetail(id?: number) {
  return useQuery({
    queryKey: queryKeys.product(id ?? 0),
    queryFn: () => productsApi.detail(id!),
    enabled: typeof id === 'number' && Number.isFinite(id),
  })
}

export function useCreateAdminProduct() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: AdminProductUpsertRequest) => productsApi.createByAdmin(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.products })
    },
  })
}

export function useCart(enabled = true) {
  return useQuery({
    queryKey: queryKeys.cart,
    queryFn: () => cartApi.getCart(),
    enabled,
  })
}

export function useAddCartItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: AddCartItemPayload) => cartApi.addItem(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.cart })
    },
  })
}

export function useUpdateCartItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ itemId, payload }: { itemId: number; payload: UpdateCartItemPayload }) =>
      cartApi.updateItem(itemId, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.cart })
    },
  })
}

export function useRemoveCartItem() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (itemId: number) => cartApi.removeItem(itemId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.cart })
    },
  })
}

export function useCreateOrder() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: CreateOrderRequest) => ordersApi.create(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.cart })
      void qc.invalidateQueries({ queryKey: queryKeys.orders })
    },
  })
}

export function useOrders() {
  return useQuery({
    queryKey: queryKeys.orders,
    queryFn: () => ordersApi.listMine(),
  })
}

export function useOrderDetail(orderNo?: string) {
  return useQuery({
    queryKey: queryKeys.order(orderNo ?? ''),
    queryFn: () => ordersApi.detail(orderNo!),
    enabled: Boolean(orderNo),
  })
}
