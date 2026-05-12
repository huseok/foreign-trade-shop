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
export type UpdateCartSelectionPayload = components['schemas']['UpdateCartSelectionRequest']
export type BulkDeleteCartPayload = components['schemas']['BulkDeleteCartRequest']
export type UserAddressCreatePayload = components['schemas']['UserAddressCreateRequest']
export type UserAddressUpdatePayload = components['schemas']['UserAddressUpdateRequest']

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
  categories: ['categories'] as const,
  adminTags: ['admin', 'tags'] as const,
  adminCoupons: ['admin', 'coupons'] as const,
  adminPromotions: ['admin', 'promotions'] as const,
  adminCustomers: ['admin', 'customers'] as const,
  adminMembershipTierRules: ['admin', 'membership', 'tier-rules'] as const,
  adminStatsSummary: ['admin', 'stats', 'summary'] as const,
  shippingTemplates: ['shipping', 'templates'] as const,
  dictTypes: ['dicts', 'types'] as const,
  dictItems: (dictCode: string) => ['dicts', 'items', dictCode] as const,
  siteContents: ['site', 'contents'] as const,
  sitePromos: ['site', 'promos'] as const,
  auditLogs: ['audit', 'logs'] as const,
  userAddresses: ['user', 'addresses'] as const,
  userBrowseHistories: ['user', 'browse-histories'] as const,
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
  categoryId?: number
  tagId?: number
  /** 为 true 时请求 `promo=true`，仅返回划线价高于主档价的商品。 */
  promo?: boolean
  /** 主档售价下限（含），映射到 Query `minPrice`；后端按 [ProductEntity.price] 过滤。 */
  minPrice?: number
  /** 主档售价上限（含），映射到 Query `maxPrice`。 */
  maxPrice?: number
}

/** 前台启用标签（目录筛选，匿名可访问） */
export function useStorefrontTags() {
  return useQuery({
    queryKey: ['tags', 'storefront'] as const,
    queryFn: () => voyage.tags.listActive(),
  })
}

/** 前台只读配置（首页活动区等；与站点 CMS 无关） */
export function useStorefrontSettings() {
  return useQuery({
    queryKey: ['storefront', 'settings'] as const,
    queryFn: () => voyage.storefront.settings(),
    staleTime: 60_000,
  })
}

/** 前台商品分页列表（仅上架）；`queryKey` 须覆盖所有筛选维度以免缓存串单。 */
export function useStorefrontProducts(params: StorefrontProductsParams, enabled = true) {
  return useQuery({
    queryKey: [
      'products',
      'store',
      params.page,
      params.size,
      params.country ?? '',
      params.q ?? '',
      params.categoryId ?? '',
      params.tagId ?? '',
      params.promo === true ? '1' : '',
      params.minPrice ?? '',
      params.maxPrice ?? '',
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
  categoryId?: number
  tagId?: number
  currency?: string
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
      params.categoryId ?? '',
      params.tagId ?? '',
      params.currency ?? '',
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

export function useAdminProductSkuMatrix(id?: number) {
  return useQuery({
    queryKey: ['products', 'sku-matrix', id ?? 0] as const,
    queryFn: () => voyage.products.adminGetSkuMatrix(id!),
    enabled: typeof id === 'number',
  })
}

export function useAdminUpsertProductSkuMatrix() {
  return useGuardedMutation({
    mutationFn: (payload: {
      id: number
      body: {
        options: Array<{ optionName: string; optionValue: string; sortNo: number }>
        skus: Array<{
          skuCode: string
          attrJson: string
          salePrice: number
          stockQty: number
          weightKg?: number
          isActive: boolean
        }>
      }
    }) => voyage.products.adminUpsertSkuMatrix(payload.id, payload.body),
  })
}

export function useAdminBulkProductStatus() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (payload: { ids: number[]; isActive: boolean }) => voyage.products.adminBulkStatus(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.productsRoot }),
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

export function useUpdateCartSelection() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (payload: UpdateCartSelectionPayload) => voyage.cart.updateSelection(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.cart })
    },
  })
}

export function useBulkDeleteCartItems() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (payload: BulkDeleteCartPayload) => voyage.cart.bulkDelete(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.cart })
    },
  })
}

export function useClearCart() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: () => voyage.cart.clear(),
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

export type AdminOrdersListParams = {
  page: number
  size: number
  q?: string
  /** 精确订单状态（与 phase 同时存在时优先 status） */
  status?: string
  /**
   * 阶段：ALL 或不传为全部；FULFILLING=待发货+配送中；DONE=已送达或已完成；
   * 亦可传 PENDING_PAYMENT / PAID / SHIPPED / DELIVERED / COMPLETED / CANCELLED。
   */
  phase?: string
}

/** 管理端：分页订单列表 */
export function useAdminOrdersPage(params: AdminOrdersListParams) {
  return useQuery({
    queryKey: [
      ...queryKeys.adminOrders,
      params.page,
      params.size,
      params.q ?? '',
      params.status ?? '',
      params.phase ?? '',
    ] as const,
    queryFn: () => voyage.orders.adminListPaged(params),
  })
}

/**
 * 管理端：订单数组（单次请求较大 size，供 `AdminOrdersPage` 等在客户端按 Tab/关键词筛选）。
 * 若订单量极大，应改为强制使用 {@link useAdminOrdersPage} 做服务端分页。
 */
export function useAdminOrders() {
  return useQuery({
    queryKey: [...queryKeys.adminOrders, 'list-flat'] as const,
    queryFn: async () => {
      const res = await voyage.orders.adminListPaged({ page: 0, size: 500 })
      return res.items
    },
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
      body: { status: string; remark?: string }
    }) => voyage.orders.adminUpdateStatus(orderNo, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.adminOrders })
      void qc.invalidateQueries({ queryKey: queryKeys.orders })
    },
  })
}

/** 管理端：按字典流转到下一状态 */
export function useAdminFlowNextOrderStatus() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: ({ orderNo, remark }: { orderNo: string; remark?: string }) =>
      voyage.orders.adminFlowNextStatus(orderNo, { remark }),
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

/** 管理端：代客创建售后（工单归属买家） */
export function useAdminCreateAfterSale() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (body: components['schemas']['CreateAfterSaleRequest']) => voyage.afterSales.adminCreateAsAdmin(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.adminAfterSales })
    },
  })
}

export function useCategories() {
  return useQuery({
    queryKey: queryKeys.categories,
    queryFn: () => voyage.categories.list(),
  })
}

export function useAdminCreateCategory() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (payload: { parentId?: number; name: string; code: string; sortNo?: number; isActive?: boolean }) =>
      voyage.categories.adminCreate(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.categories }),
  })
}

export function useAdminUpdateCategory() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (payload: { id: number; parentId?: number; name: string; code: string; sortNo?: number; isActive?: boolean }) =>
      voyage.categories.adminUpdate(payload.id, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.categories }),
  })
}

export function useAdminDeleteCategory() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (id: number) => voyage.categories.adminDelete(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.categories }),
  })
}

export function useAdminTags(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.adminTags,
    queryFn: () => voyage.tags.adminList(),
    enabled: options?.enabled ?? true,
  })
}

export function useAdminCreateTag() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (body: components['schemas']['TagUpsertRequest']) => voyage.tags.adminCreate(body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.adminTags })
      void qc.invalidateQueries({ queryKey: ['tags', 'storefront'] })
      void qc.invalidateQueries({ queryKey: queryKeys.productsRoot })
    },
  })
}

export function useAdminUpdateTag() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (payload: { id: number; body: components['schemas']['TagUpsertRequest'] }) =>
      voyage.tags.adminUpdate(payload.id, payload.body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.adminTags })
      void qc.invalidateQueries({ queryKey: ['tags', 'storefront'] })
      void qc.invalidateQueries({ queryKey: queryKeys.productsRoot })
    },
  })
}

export function useAdminDeleteTag() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (id: number) => voyage.tags.adminDelete(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.adminTags })
      void qc.invalidateQueries({ queryKey: ['tags', 'storefront'] })
      void qc.invalidateQueries({ queryKey: queryKeys.productsRoot })
    },
  })
}

export function useAdminCoupons(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.adminCoupons,
    queryFn: () => voyage.marketing.adminListCoupons(),
    enabled: options?.enabled ?? true,
  })
}

export function useAdminPromotions(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.adminPromotions,
    queryFn: () => voyage.marketing.adminListPromotions(),
    enabled: options?.enabled ?? true,
  })
}

export function useAdminCreateCoupon() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (body: components['schemas']['CouponAdminUpsertRequest']) => voyage.marketing.adminCreateCoupon(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.adminCoupons }),
  })
}

export function useAdminUpdateCoupon() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (payload: { id: number; body: components['schemas']['CouponAdminUpsertRequest'] }) =>
      voyage.marketing.adminUpdateCoupon(payload.id, payload.body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.adminCoupons }),
  })
}

export function useAdminPatchCouponActive() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (payload: { id: number; isActive: boolean }) =>
      voyage.marketing.adminPatchCouponActive(payload.id, { isActive: payload.isActive }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.adminCoupons }),
  })
}

export function useAdminCreatePromotion() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (body: components['schemas']['PromotionAdminUpsertRequest']) =>
      voyage.marketing.adminCreatePromotion(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.adminPromotions }),
  })
}

export function useAdminUpdatePromotion() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (payload: { id: number; body: components['schemas']['PromotionAdminUpsertRequest'] }) =>
      voyage.marketing.adminUpdatePromotion(payload.id, payload.body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.adminPromotions }),
  })
}

export function useAdminPatchPromotionActive() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (payload: { id: number; isActive: boolean }) =>
      voyage.marketing.adminPatchPromotionActive(payload.id, { isActive: payload.isActive }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.adminPromotions }),
  })
}

export type AdminCustomersListParams = {
  page: number
  size: number
  q?: string
}

export function useAdminCustomersPage(params: AdminCustomersListParams) {
  return useQuery({
    queryKey: [...queryKeys.adminCustomers, params.page, params.size, params.q ?? ''] as const,
    queryFn: () => voyage.customers.adminListPaged(params),
  })
}

export function useAdminMembershipTierRules(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.adminMembershipTierRules,
    queryFn: () => voyage.membership.adminListTierRules(),
    enabled: options?.enabled ?? true,
  })
}

export function useAdminCreateMembershipTierRule() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (body: components['schemas']['MembershipTierRuleUpsertRequest']) => voyage.membership.adminCreateTierRule(body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.adminMembershipTierRules }),
  })
}

export function useAdminUpdateMembershipTierRule() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (payload: { id: number; body: components['schemas']['MembershipTierRuleUpsertRequest'] }) =>
      voyage.membership.adminUpdateTierRule(payload.id, payload.body),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.adminMembershipTierRules }),
  })
}

export function useAdminPatchMembershipTierRuleActive() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (payload: { id: number; isActive: boolean }) =>
      voyage.membership.adminPatchTierRuleActive(payload.id, { isActive: payload.isActive }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.adminMembershipTierRules }),
  })
}

export function useAdminStatsSummary(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: queryKeys.adminStatsSummary,
    queryFn: () => voyage.stats.adminSummary(),
    enabled: options?.enabled ?? true,
  })
}

export function useShippingTemplates() {
  return useQuery({
    queryKey: queryKeys.shippingTemplates,
    queryFn: () => voyage.shipping.listTemplates(),
  })
}

export function useShippingTemplateRules(templateId?: number) {
  return useQuery({
    queryKey: ['shipping', 'rules', templateId ?? 0] as const,
    queryFn: () => voyage.shipping.listRules(templateId!),
    enabled: typeof templateId === 'number',
  })
}

export function useAdminCreateShippingTemplate() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (payload: { templateName: string; billingMode: string }) => voyage.shipping.adminCreateTemplate(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.shippingTemplates }),
  })
}

/**
 * 新增运费规则：成功后按模板 ID 精确失效 `useShippingTemplateRules` 的缓存，
 * 解决「提交成功但下方规则表仍为空」的竞态（选中模板状态与查询键不一致）。
 */
export function useAdminCreateShippingRule() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (payload: {
      templateId: number
      firstWeightKg: number
      firstFee: number
      additionalWeightKg: number
      additionalFee: number
      regionCode?: string
      sortNo?: number
    }) =>
      voyage.shipping.adminCreateRule(payload.templateId, {
        firstWeightKg: payload.firstWeightKg,
        firstFee: payload.firstFee,
        additionalWeightKg: payload.additionalWeightKg,
        additionalFee: payload.additionalFee,
        regionCode: payload.regionCode,
        sortNo: payload.sortNo,
      }),
    onSuccess: (_d, variables) => {
      void qc.invalidateQueries({ queryKey: ['shipping', 'rules', variables.templateId] })
    },
  })
}

/**
 * 删除规则：按前缀 `['shipping','rules']` 失效所有模板规则查询，因删除接口不返回 templateId。
 */
export function useAdminDeleteShippingRule() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (ruleId: number) => voyage.shipping.adminDeleteRule(ruleId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['shipping', 'rules'] })
    },
  })
}

export function useDictTypes() {
  return useQuery({
    queryKey: queryKeys.dictTypes,
    queryFn: () => voyage.dicts.listTypes(),
  })
}

export function useDictItems(dictCode: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.dictItems(dictCode),
    queryFn: () => voyage.dicts.listItems(dictCode),
    enabled,
  })
}

export function useAdminCreateDictType() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (payload: { dictCode: string; dictName: string }) => voyage.dicts.adminCreateType(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.dictTypes }),
  })
}

export function useAdminCreateDictItem() {
  return useGuardedMutation({
    mutationFn: (payload: { dictCode: string; itemCode: string; itemLabel: string; sortNo?: number }) =>
      voyage.dicts.adminCreateItem(payload.dictCode, {
        itemCode: payload.itemCode,
        itemLabel: payload.itemLabel,
        sortNo: payload.sortNo,
      }),
  })
}

export function useAdminSiteContents() {
  return useQuery({
    queryKey: queryKeys.siteContents,
    queryFn: () => voyage.site.listAdminContents(),
  })
}

/** 首页活动轮播（PROMO），匿名可访问 */
export function useSitePromos() {
  return useQuery({
    queryKey: queryKeys.sitePromos,
    queryFn: () => voyage.site.listPromos(),
  })
}

export function useAdminUpsertSiteContent() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (payload: {
      contentKey: string
      contentType: string
      title?: string
      subtitle?: string
      body?: string
      imageUrl?: string
      actionUrl?: string
      sortNo?: number
      isActive?: boolean
    }) => voyage.site.adminUpsertContent(payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.siteContents })
      void qc.invalidateQueries({ queryKey: queryKeys.sitePromos })
    },
  })
}

export function useAdminAuditLogs(params: { page: number; size: number }) {
  return useQuery({
    queryKey: [...queryKeys.auditLogs, params.page, params.size] as const,
    queryFn: () => voyage.audit.listLogsPaged(params),
  })
}

export function useUserAddresses(enabled = true) {
  return useQuery({
    queryKey: queryKeys.userAddresses,
    queryFn: () => voyage.userCenter.listAddresses(),
    enabled,
  })
}

export function useCreateUserAddress() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (payload: UserAddressCreatePayload) => voyage.userCenter.createAddress(payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.userAddresses }),
  })
}

export function useUpdateUserAddress() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: ({ id, payload }: { id: number; payload: UserAddressUpdatePayload }) =>
      voyage.userCenter.updateAddress(id, payload),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.userAddresses }),
  })
}

export function useDeleteUserAddress() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (id: number) => voyage.userCenter.deleteAddress(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.userAddresses }),
  })
}

export function useSetDefaultUserAddress() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (id: number) => voyage.userCenter.setDefaultAddress(id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.userAddresses }),
  })
}

export function useReorderToCart() {
  const qc = useQueryClient()
  return useGuardedMutation({
    mutationFn: (orderNo: string) => voyage.cart.reorderFromOrder({ orderNo }),
    onSuccess: () => void qc.invalidateQueries({ queryKey: queryKeys.cart }),
  })
}

export function useUserBrowseHistories(enabled = true) {
  return useQuery({
    queryKey: queryKeys.userBrowseHistories,
    queryFn: () => voyage.userCenter.listBrowseHistories(),
    enabled,
  })
}
