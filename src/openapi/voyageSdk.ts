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
    listPaged(params: {
      page?: number
      size?: number
      country?: string
      q?: string
      categoryId?: number
      tagId?: number
      promo?: boolean
    }): Promise<S['PagedProducts']> {
      const sp = new URLSearchParams()
      if (params.page != null) sp.set('page', String(params.page))
      if (params.size != null) sp.set('size', String(params.size))
      if (params.country != null && params.country !== '') sp.set('country', params.country)
      if (params.q != null && params.q !== '') sp.set('q', params.q)
      if (params.categoryId != null) sp.set('categoryId', String(params.categoryId))
      if (params.tagId != null) sp.set('tagId', String(params.tagId))
      if (params.promo === true) sp.set('promo', 'true')
      const qs = sp.toString()
      return getData<S['PagedProducts']>(`/api/v1/products${qs ? `?${qs}` : ''}`)
    },
    getById(id: number): Promise<S['ProductView']> {
      return getData<S['ProductView']>(`/api/v1/products/${id}`)
    },
    adminListPaged(params: {
      page?: number
      size?: number
      q?: string
      active?: boolean
      categoryId?: number
      tagId?: number
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
      if (params.currency != null && params.currency !== '') sp.set('currency', params.currency)
      const qs = sp.toString()
      return getData<S['PagedProducts']>(`/api/v1/admin/products${qs ? `?${qs}` : ''}`)
    },
    adminGetById(id: number): Promise<S['ProductView']> {
      return getData<S['ProductView']>(`/api/v1/admin/products/${id}`)
    },
    adminCreate(body: S['ProductAdminUpsertRequest']): Promise<S['IdPayload']> {
      return postData<S['IdPayload']>('/api/v1/admin/products', body)
    },
    adminUpdate(id: number, body: S['ProductAdminUpsertRequest']): Promise<string> {
      return putData<string>(`/api/v1/admin/products/${id}`, body)
    },
    adminGetSkuMatrix(id: number): Promise<{
      productId: number
      options: Array<{ optionName: string; optionValue: string; sortNo: number }>
      skus: Array<{
        id: number
        skuCode: string
        attrJson: string
        salePrice: number
        stockQty: number
        weightKg?: number
        isActive: boolean
      }>
    }> {
      return getData(`/api/v1/admin/products/${id}/sku-matrix`)
    },
    adminUpsertSkuMatrix(
      id: number,
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
    ): Promise<string> {
      return putData(`/api/v1/admin/products/${id}/sku-matrix`, body)
    },
    adminBulkStatus(body: { ids: number[]; isActive: boolean }): Promise<{ updated: number }> {
      return patchData('/api/v1/admin/products/bulk-status', body)
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
    }): Promise<{ items: S['OrderView'][]; total: number; page: number; size: number }> {
      const sp = new URLSearchParams()
      if (params.page != null) sp.set('page', String(params.page))
      if (params.size != null) sp.set('size', String(params.size))
      if (params.q != null && params.q !== '') sp.set('q', params.q)
      if (params.status != null && params.status !== '') sp.set('status', params.status)
      if (params.phase != null && params.phase !== '') sp.set('phase', params.phase)
      const qs = sp.toString()
      return getData(`/api/v1/admin/orders${qs ? `?${qs}` : ''}`)
    },
    adminUpdateTracking(orderNo: string, body: S['UpdateTrackingRequest']): Promise<string> {
      return patchData<string>(`/api/v1/admin/orders/${orderNo}/tracking-no`, body)
    },
    adminUpdateStatus(orderNo: string, body: { status: string; remark?: string }): Promise<string> {
      return patchData<string>(`/api/v1/admin/orders/${orderNo}/status`, body)
    },
    adminFlowNextStatus(orderNo: string, body?: { remark?: string }): Promise<string> {
      return patchData<string>(`/api/v1/admin/orders/${orderNo}/status/flow-next`, body)
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
    listAddresses(): Promise<
      Array<{
        id: number
        receiverName: string
        receiverPhone: string
        country: string
        addressLine: string
        postalCode?: string
        isDefault: boolean
      }>
    > {
      return getData('/api/v1/user/addresses')
    },
    createAddress(body: {
      receiverName: string
      receiverPhone: string
      country: string
      addressLine: string
      postalCode?: string
      isDefault?: boolean
    }): Promise<{ id: number }> {
      return postData('/api/v1/user/addresses', body)
    },
    listBrowseHistories(): Promise<Array<{ id: number; productId: number; viewedAt: string }>> {
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
