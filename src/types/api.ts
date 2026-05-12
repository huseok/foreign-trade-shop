/**
 * 业务层类型别名。
 *
 * 所有别名均映射到 OpenAPI `components.schemas` 中的定义，
 * 实际类型体由 `src/generated/voyage-paths.ts` 生成，勿在本文件重复写字段。
 *
 * 页面与 hooks 可继续 `import type { ProductDto } from '../types/api'`，
 * 避免直接依赖生成文件中的长路径类型名。
 */
import type { components } from '../generated/voyage-paths'

type S = components['schemas']

export type LoginRequest = S['LoginRequest']
export type RegisterRequest = S['RegisterRequest']
export type LoginResponse = S['LoginResponse']
export type RefreshTokenRequest = S['RefreshTokenRequest']
export type MeResponse = S['MeResponse']

export type ProductDto = S['ProductView']
export type PagedProductsDto = S['PagedProducts']
export type AdminProductUpsertRequest = S['ProductAdminUpsertRequest']

export type CartItemDto = S['CartItemView']
export type CartDto = S['CartView']

export type CreateOrderRequest = S['CreateOrderRequest']
export type OrderDto = S['OrderView']

export type CreateAfterSaleRequest = S['CreateAfterSaleRequest']
export type AfterSaleDto = S['AfterSaleView']

export type UserAddressView = S['UserAddressView']
