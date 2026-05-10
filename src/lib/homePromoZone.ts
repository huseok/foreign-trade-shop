/**
 * 首页「活动商品」轮播：服务端标签编码见 `GET /api/v1/storefront/settings`（`voyage.storefront.home-promo-zone-tag-code`）。
 * 此处仅为接口失败或未返回时的兜底默认值。
 *
 * 商品是否出现在该区域：由运营给商品勾选「对应编码」的标签决定。
 */
export const HOME_PROMO_ZONE_TAG_CODE = 'HOME_PROMO' as const
