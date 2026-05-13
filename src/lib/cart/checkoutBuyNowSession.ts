/**
 * 目录商品卡「立即下单」与结账页的桥接数据。
 *
 * 流程：`ProductCard`（目录紧凑模式）在用户点「下单」时写入 sessionStorage → 跳转 `/checkout`（未登录则先 `/login`，`state.from` 指向 `/checkout`）。
 * `Checkout` 首次挂载时读出并**立刻删除**，避免刷新重复执行；再调购物车接口：把该商品数量设为目标值，并**仅勾选这一行**（其余行 `selected: false`），保证结账只结算当前商品。
 *
 * 使用 `sessionStorage` 而非 URL query，避免分享链接误触发、且不在地址栏暴露商品意图。
 */
export const CHECKOUT_BUY_NOW_SESSION_KEY = 'globuy:checkout-buy-now-once'

export type CheckoutBuyNowPayload = {
  /** 商品 publicId（雪花十进制字符串） */
  productId: string
  /** 目标数量（已按 MOQ 约束在写入前处理） */
  quantity: number
}

export function writeCheckoutBuyNowSession(payload: CheckoutBuyNowPayload): void {
  try {
    sessionStorage.setItem(CHECKOUT_BUY_NOW_SESSION_KEY, JSON.stringify(payload))
  } catch {
    // 隐私模式或禁用 storage 时静默失败，结账页将按普通购物车展示
  }
}

export function readCheckoutBuyNowSession(): CheckoutBuyNowPayload | null {
  try {
    const raw = sessionStorage.getItem(CHECKOUT_BUY_NOW_SESSION_KEY)
    if (!raw?.trim()) return null
    const o = JSON.parse(raw) as unknown
    if (o == null || typeof o !== 'object') return null
    const productId = String((o as { productId?: unknown }).productId ?? '').trim()
    const quantity = Number((o as { quantity?: unknown }).quantity)
    if (!productId || !Number.isFinite(quantity) || quantity < 1) return null
    return { productId, quantity: Math.trunc(quantity) }
  } catch {
    return null
  }
}

export function clearCheckoutBuyNowSession(): void {
  try {
    sessionStorage.removeItem(CHECKOUT_BUY_NOW_SESSION_KEY)
  } catch {
    /* noop */
  }
}
