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
    getCaptcha(): Promise<S['CaptchaResponse']> {
      return getData<S['CaptchaResponse']>('/api/v1/auth/captcha')
    },
    register(body: S['RegisterRequest']): Promise<string> {
      return postData<string>('/api/v1/auth/register', body)
    },
    login(body: S['LoginRequest']): Promise<S['LoginResponse']> {
      return postData<S['LoginResponse']>('/api/v1/auth/login', body)
    },
    refresh(body: S['RefreshTokenRequest']): Promise<S['LoginResponse']> {
      return postData<S['LoginResponse']>('/api/v1/auth/refresh', body)
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
    /**
     * 前台分页商品列表（匿名可访问）。
     * Query 与后端 `ProductController.list` 对齐；新增筛选条件时需同步 Kotlin 与本文本序列化。
     */
    listPaged(params: {
      page?: number
      size?: number
      country?: string
      q?: string
      categoryId?: number
      tagId?: number
      tagCode?: string
      promo?: boolean
      minPrice?: number
      maxPrice?: number
    }): Promise<S['PagedProducts']> {
      const sp = new URLSearchParams()
      if (params.page != null) sp.set('page', String(params.page))
      if (params.size != null) sp.set('size', String(params.size))
      if (params.country != null && params.country !== '') sp.set('country', params.country)
      if (params.q != null && params.q !== '') sp.set('q', params.q)
      if (params.categoryId != null) sp.set('categoryId', String(params.categoryId))
      if (params.tagId != null) sp.set('tagId', String(params.tagId))
      if (params.tagCode != null && params.tagCode !== '') sp.set('tagCode', params.tagCode)
      if (params.promo === true) sp.set('promo', 'true')
      /** 价格区间：0 为合法下限，故用 `>= 0` 与 `Number.isFinite` 双重校验。 */
      if (params.minPrice != null && Number.isFinite(params.minPrice) && params.minPrice >= 0) {
        sp.set('minPrice', String(params.minPrice))
      }
      if (params.maxPrice != null && Number.isFinite(params.maxPrice) && params.maxPrice >= 0) {
        sp.set('maxPrice', String(params.maxPrice))
      }
      const qs = sp.toString()
      return getData<S['PagedProducts']>(`/api/v1/products${qs ? `?${qs}` : ''}`)
    },
    getById(id: string): Promise<S['ProductView']> {
      return getData<S['ProductView']>(`/api/v1/products/${encodeURIComponent(id)}`)
    },
    adminListPaged(params: {
      page?: number
      size?: number
      q?: string
      active?: boolean
      categoryId?: number
      tagId?: number
      tagCode?: string
      currency?: string
    }): Promise<S['PagedProducts']> {
      const sp = new URLSearchParams()
      if (params.page != null) sp.set('page', String(params.page))
      if (params.size != null) sp.set('size', String(params.size))
      if (params.q != null && params.q !== '') sp.set('q', params.q)
      if (params.active === true) sp.set('active', 'true')
      if (params.active === false) sp.set('active', 'false')
      if (params.categoryId != null) sp.set('categoryId', String(params.categoryId))
      if (params.tagId != null) sp.set('tagId', String(params.tagId))
      if (params.tagCode != null && params.tagCode !== '') sp.set('tagCode', params.tagCode)
      if (params.currency != null && params.currency !== '') sp.set('currency', params.currency)
      const qs = sp.toString()
      return getData<S['PagedProducts']>(`/api/v1/admin/products${qs ? `?${qs}` : ''}`)
    },
    adminGetById(id: string): Promise<S['ProductView']> {
      return getData<S['ProductView']>(`/api/v1/admin/products/${encodeURIComponent(id)}`)
    },
    adminCreate(body: S['ProductAdminUpsertRequest']): Promise<S['IdPayload']> {
      return postData<S['IdPayload']>('/api/v1/admin/products', body)
    },
    adminUpdate(id: string, body: S['ProductAdminUpsertRequest']): Promise<string> {
      return putData<string>(`/api/v1/admin/products/${encodeURIComponent(id)}`, body)
    },
    adminGetSkuMatrix(id: string): Promise<S['ProductSkuMatrixView']> {
      return getData<S['ProductSkuMatrixView']>(`/api/v1/admin/products/${encodeURIComponent(id)}/sku-matrix`)
    },
    adminUpsertSkuMatrix(id: string, body: S['ProductSkuMatrixUpsertRequest']): Promise<string> {
      return putData<string>(`/api/v1/admin/products/${encodeURIComponent(id)}/sku-matrix`, body)
    },
    adminBulkStatus(body: S['ProductBulkStatusRequest']): Promise<{ updated: number }> {
      return patchData<{ updated: number }>('/api/v1/admin/products/bulk-status', body)
    },
  },

  /** 管理端媒体上传（multipart）；返回相对路径，配合 `resolveMediaUrl` 展示 */
  media: {
    upload(file: File): Promise<S['MediaUploadView']> {
      const fd = new FormData()
      fd.append('file', file)
      return postFormData<S['MediaUploadView']>('/api/v1/admin/media/upload', fd)
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
    updateSelection(body: S['UpdateCartSelectionRequest']): Promise<string> {
      return patchData<string>('/api/v1/cart/selection', body)
    },
    bulkDelete(body: S['BulkDeleteCartRequest']): Promise<string> {
      return postData<string>('/api/v1/cart/bulk-delete', body)
    },
    clear(): Promise<string> {
      return deleteData<string>('/api/v1/cart/clear')
    },
    reorderFromOrder(body: S['ReorderToCartRequest']): Promise<string> {
      return postData<string>('/api/v1/cart/reorder-from-order', body)
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
    adminListPaged(params: {
      page?: number
      size?: number
      q?: string
      status?: string
      phase?: string
      userId?: number
    }): Promise<S['PagedOrders']> {
      const sp = new URLSearchParams()
      if (params.page != null) sp.set('page', String(params.page))
      if (params.size != null) sp.set('size', String(params.size))
      if (params.q != null && params.q !== '') sp.set('q', params.q)
      if (params.status != null && params.status !== '') sp.set('status', params.status)
      if (params.phase != null && params.phase !== '') sp.set('phase', params.phase)
      if (params.userId != null && params.userId > 0) sp.set('userId', String(params.userId))
      const qs = sp.toString()
      return getData<S['PagedOrders']>(`/api/v1/admin/orders${qs ? `?${qs}` : ''}`)
    },
    adminUpdateTracking(orderNo: string, body: S['UpdateTrackingRequest']): Promise<string> {
      return patchData<string>(
        `/api/v1/admin/orders/${encodeURIComponent(orderNo)}/tracking-no`,
        body,
      )
    },
    adminAppendLogistics(orderNo: string, body: S['OrderLogisticsCreateRequest']): Promise<string> {
      return postData<string>(`/api/v1/admin/orders/${encodeURIComponent(orderNo)}/logistics`, body)
    },
    adminUpdateStatus(orderNo: string, body: S['UpdateOrderStatusRequest']): Promise<string> {
      return patchData<string>(`/api/v1/admin/orders/${encodeURIComponent(orderNo)}/status`, body)
    },
    adminDelete(orderNo: string): Promise<string> {
      return deleteData<string>(`/api/v1/admin/orders/${encodeURIComponent(orderNo)}`)
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
    adminCreateAsAdmin(body: S['CreateAfterSaleRequest']): Promise<string> {
      return postData<string>('/api/v1/admin/after-sales', body)
    },
    adminUpdateStatus(id: number, body: S['UpdateAfterSaleStatusRequest']): Promise<string> {
      return patchData<string>(`/api/v1/admin/after-sales/${id}/status`, body)
    },
  },
  categories: {
    list(): Promise<
      Array<{ id: number; parentId: number | null; name: string; code: string; sortNo: number; isActive: boolean }>
    > {
      return getData('/api/v1/categories')
    },
    adminCreate(body: {
      parentId?: number
      name: string
      code: string
      sortNo?: number
      isActive?: boolean
    }): Promise<{ id: number }> {
      return postData('/api/v1/admin/categories', body)
    },
    adminUpdate(
      id: number,
      body: { parentId?: number; name: string; code: string; sortNo?: number; isActive?: boolean }
    ): Promise<string> {
      return putData(`/api/v1/admin/categories/${id}`, body)
    },
    adminDelete(id: number): Promise<string> {
      return deleteData(`/api/v1/admin/categories/${id}`)
    },
  },

  /** 商品标签：前台启用列表 + 后台维护 + 商品绑定 tagIds */
  tags: {
    listActive(): Promise<S['TagView'][]> {
      return getData<S['TagView'][]>('/api/v1/tags')
    },
    adminList(): Promise<S['TagView'][]> {
      return getData<S['TagView'][]>('/api/v1/admin/tags')
    },
    adminCreate(body: S['TagUpsertRequest']): Promise<S['IdPayload']> {
      return postData<S['IdPayload']>('/api/v1/admin/tags', body)
    },
    adminUpdate(id: number, body: S['TagUpsertRequest']): Promise<string> {
      return putData<string>(`/api/v1/admin/tags/${id}`, body)
    },
    adminDelete(id: number): Promise<string> {
      return deleteData<string>(`/api/v1/admin/tags/${id}`)
    },
  },

  /** 优惠券与满减活动（后台维护；结账试算见订单服务） */
  marketing: {
    adminListCoupons(): Promise<S['CouponAdminView'][]> {
      return getData<S['CouponAdminView'][]>('/api/v1/admin/coupons')
    },
    adminCreateCoupon(body: S['CouponAdminUpsertRequest']): Promise<S['IdPayload']> {
      return postData<S['IdPayload']>('/api/v1/admin/coupons', body)
    },
    adminUpdateCoupon(id: number, body: S['CouponAdminUpsertRequest']): Promise<string> {
      return putData<string>(`/api/v1/admin/coupons/${id}`, body)
    },
    adminPatchCouponActive(id: number, body: S['CouponActivePatchRequest']): Promise<string> {
      return patchData<string>(`/api/v1/admin/coupons/${id}/active`, body)
    },
    adminListPromotions(): Promise<S['PromotionAdminView'][]> {
      return getData<S['PromotionAdminView'][]>('/api/v1/admin/promotions')
    },
    adminCreatePromotion(body: S['PromotionAdminUpsertRequest']): Promise<S['IdPayload']> {
      return postData<S['IdPayload']>('/api/v1/admin/promotions', body)
    },
    adminUpdatePromotion(id: number, body: S['PromotionAdminUpsertRequest']): Promise<string> {
      return putData<string>(`/api/v1/admin/promotions/${id}`, body)
    },
    adminPatchPromotionActive(id: number, body: S['PromotionActivePatchRequest']): Promise<string> {
      return patchData<string>(`/api/v1/admin/promotions/${id}/active`, body)
    },
  },

  /** 注册用户（客户）分页；含会员档位与累计消费 */
  customers: {
    adminListPaged(params: { page?: number; size?: number; q?: string }): Promise<S['PagedCustomers']> {
      const sp = new URLSearchParams()
      if (params.page != null) sp.set('page', String(params.page))
      if (params.size != null) sp.set('size', String(params.size))
      if (params.q != null && params.q !== '') sp.set('q', params.q)
      const qs = sp.toString()
      return getData<S['PagedCustomers']>(`/api/v1/admin/customers${qs ? `?${qs}` : ''}`)
    },
    adminPatchCustomer(id: number, body: S['CustomerAdminUpdateRequest']): Promise<string> {
      return patchData<string>(`/api/v1/admin/customers/${id}`, body)
    },
    adminResetPassword(
      id: number,
      body?: S['AdminResetPasswordRequest'] | null,
    ): Promise<S['AdminResetPasswordResponse']> {
      return postData<S['AdminResetPasswordResponse']>(
        `/api/v1/admin/customers/${id}/reset-password`,
        body ?? {},
      )
    },
  },

  /** 会员档位规则（门槛金额 + 折扣%），驱动结账会员立减与累计升级 */
  membership: {
    adminListTierRules(): Promise<S['MembershipTierRuleAdminView'][]> {
      return getData<S['MembershipTierRuleAdminView'][]>('/api/v1/admin/membership/tier-rules')
    },
    adminCreateTierRule(body: S['MembershipTierRuleUpsertRequest']): Promise<S['IdPayload']> {
      return postData<S['IdPayload']>('/api/v1/admin/membership/tier-rules', body)
    },
    adminUpdateTierRule(id: number, body: S['MembershipTierRuleUpsertRequest']): Promise<string> {
      return putData<string>(`/api/v1/admin/membership/tier-rules/${id}`, body)
    },
    adminPatchTierRuleActive(id: number, body: S['MembershipTierRuleActivePatchRequest']): Promise<string> {
      return patchData<string>(`/api/v1/admin/membership/tier-rules/${id}/active`, body)
    },
  },

  stats: {
    adminSummary(): Promise<S['AdminStatsSummaryView']> {
      return getData<S['AdminStatsSummaryView']>('/api/v1/admin/stats/summary')
    },
  },

  /** 前台展示配置（独立接口，不经站点 CMS） */
  storefront: {
    settings(): Promise<S['StorefrontSettings']> {
      return getData<S['StorefrontSettings']>('/api/v1/storefront/settings')
    },
  },

  shipping: {
    listTemplates(): Promise<Array<{ id: number; templateName: string; billingMode: string; isActive: boolean }>> {
      return getData('/api/v1/shipping/templates')
    },
    listRules(templateId: number): Promise<
      Array<{
        id: number
        templateId: number
        regionCode: string
        firstWeightKg: number
        firstFee: number
        additionalWeightKg: number
        additionalFee: number
        sortNo: number
      }>
    > {
      return getData(`/api/v1/shipping/templates/${templateId}/rules`)
    },
    adminCreateTemplate(body: { templateName: string; billingMode: string }): Promise<{ id: number }> {
      return postData('/api/v1/admin/shipping/templates', body)
    },
    adminCreateRule(
      templateId: number,
      body: {
        firstWeightKg: number
        firstFee: number
        additionalWeightKg: number
        additionalFee: number
        regionCode?: string
        sortNo?: number
      }
    ): Promise<{ id: number }> {
      return postData(`/api/v1/admin/shipping/templates/${templateId}/rules`, body)
    },
    adminDeleteRule(ruleId: number): Promise<string> {
      return deleteData(`/api/v1/admin/shipping/rules/${ruleId}`)
    },
  },
  dicts: {
    listTypes(): Promise<Array<{ dictCode: string; dictName: string }>> {
      return getData('/api/v1/dicts/types')
    },
    listItems(dictCode: string): Promise<Array<{ itemCode: string; itemLabel: string; sortNo: number }>> {
      return getData(`/api/v1/dicts/${dictCode}/items`)
    },
    adminCreateType(body: { dictCode: string; dictName: string }): Promise<{ id: number }> {
      return postData('/api/v1/admin/dicts/types', body)
    },
    adminCreateItem(dictCode: string, body: { itemCode: string; itemLabel: string; sortNo?: number }): Promise<{ id: number }> {
      return postData(`/api/v1/admin/dicts/${dictCode}/items`, body)
    },
  },
  site: {
    /** 前台匿名可读：首页活动轮播（content_type = PROMO） */
    listPromos(): Promise<
      Array<{
        id: number
        contentKey: string
        contentType: string
        title?: string
        subtitle?: string
        body?: string
        imageUrl?: string
        actionUrl?: string
        sortNo: number
        isActive: boolean
      }>
    > {
      return getData('/api/v1/site/promos')
    },
    listAdminContents(): Promise<
      Array<{
        id: number
        contentKey: string
        contentType: string
        title?: string
        subtitle?: string
        body?: string
        imageUrl?: string
        actionUrl?: string
        sortNo: number
        isActive: boolean
      }>
    > {
      return getData('/api/v1/admin/site/contents')
    },
    adminUpsertContent(body: {
      contentKey: string
      contentType: string
      title?: string
      subtitle?: string
      body?: string
      imageUrl?: string
      actionUrl?: string
      sortNo?: number
      isActive?: boolean
    }): Promise<{ id: number }> {
      return postData('/api/v1/admin/site/contents', body)
    },
  },
  audit: {
    listLogsPaged(params: { page?: number; size?: number }): Promise<{
      items: Array<{
        id: number
        actorUserId?: number
        actorRole?: string
        actionCode: string
        entityType: string
        entityId: string
        detailJson?: string
        createdAt: string
      }>
      total: number
      page: number
      size: number
    }> {
      const sp = new URLSearchParams()
      if (params.page != null) sp.set('page', String(params.page))
      if (params.size != null) sp.set('size', String(params.size))
      const qs = sp.toString()
      return getData(`/api/v1/admin/audit/logs${qs ? `?${qs}` : ''}`)
    },
    listOrderHistories(orderId: number): Promise<
      Array<{ id: number; orderId: number; fromStatus?: string; toStatus: string; changedBy?: number; changedAt: string; remark?: string }>
    > {
      return getData(`/api/v1/admin/audit/orders/${orderId}/histories`)
    },
    listOrderHistoriesByOrderNo(orderNo: string): Promise<
      Array<{ id: number; orderId: number; fromStatus?: string; toStatus: string; changedBy?: number; changedAt: string; remark?: string }>
    > {
      return getData(`/api/v1/admin/audit/orders/by-order-no/${encodeURIComponent(orderNo)}/histories`)
    },
  },
  userCenter: {
    listAddresses(): Promise<S['UserAddressView'][]> {
      return getData('/api/v1/user/addresses')
    },
    createAddress(body: S['UserAddressCreateRequest']): Promise<{ id: number }> {
      return postData('/api/v1/user/addresses', body)
    },
    updateAddress(id: number, body: S['UserAddressUpdateRequest']): Promise<string> {
      return putData<string>(`/api/v1/user/addresses/${id}`, body)
    },
    deleteAddress(id: number): Promise<string> {
      return deleteData<string>(`/api/v1/user/addresses/${id}`)
    },
    setDefaultAddress(id: number): Promise<string> {
      return patchData<string>(`/api/v1/user/addresses/${id}/default`)
    },
    listBrowseHistories(): Promise<Array<{ id: number; productId: string; viewedAt: string }>> {
      return getData('/api/v1/user/browse-histories')
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

/** POST multipart（不传 Content-Type，由浏览器自动带 boundary） */
function postFormData<T>(url: string, formData: FormData) {
  return unwrap(apiClient.post<ApiResponse<T>>(url, formData))
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
