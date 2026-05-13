/**
 * 本地购物车（未登录态）：
 * 未登录时加购写入 localStorage；登录成功后将本地购物车同步到后端，再清空本地。
 *
 * `productId` 与后端一致：商品 **publicId**（雪花十进制字符串）；兼容旧版 localStorage 中存数字 id 的条目。
 */

const LOCAL_CART_KEY = 'chzfobkey_local_cart_v1'
const LOCAL_CART_UPDATED_EVENT = 'chzfobkey:local-cart-updated'

export type LocalCartItem = {
  productId: string
  quantity: number
}

function normalizeStoredProductId(raw: unknown): string | null {
  if (raw == null) return null
  const s = String(raw).trim()
  if (s === '' || s === 'NaN') return null
  return s
}

export function getLocalCartItems(): LocalCartItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as Array<{ productId?: unknown; quantity?: unknown }>
    if (!Array.isArray(parsed)) return []
    return parsed
      .map((x) => {
        const productId = normalizeStoredProductId(x.productId)
        const quantity = typeof x.quantity === 'number' ? x.quantity : Number(x.quantity)
        if (productId == null || !Number.isFinite(quantity) || quantity <= 0) return null
        return { productId, quantity: Math.trunc(quantity) }
      })
      .filter((x): x is LocalCartItem => x != null)
  } catch {
    return []
  }
}

function saveLocalCartItems(items: LocalCartItem[]) {
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(LOCAL_CART_UPDATED_EVENT))
}

export function addLocalCartItem(productId: string, quantity: number) {
  const key = productId.trim()
  if (!key) return
  const nextQty = Math.max(1, Math.trunc(quantity))
  const rows = getLocalCartItems()
  const existed = rows.find((x) => x.productId === key)
  if (existed) {
    existed.quantity += nextQty
  } else {
    rows.push({ productId: key, quantity: nextQty })
  }
  saveLocalCartItems(rows)
}

export function updateLocalCartItem(productId: string, quantity: number) {
  const key = productId.trim()
  if (!key) return
  const rows = getLocalCartItems()
  const existed = rows.find((x) => x.productId === key)
  if (!existed) return
  existed.quantity = Math.max(1, Math.trunc(quantity))
  saveLocalCartItems(rows)
}

export function removeLocalCartItem(productId: string) {
  const key = productId.trim()
  if (!key) return
  const rows = getLocalCartItems().filter((x) => x.productId !== key)
  saveLocalCartItems(rows)
}

export function clearLocalCart() {
  localStorage.removeItem(LOCAL_CART_KEY)
  window.dispatchEvent(new Event(LOCAL_CART_UPDATED_EVENT))
}

export function getLocalCartCount(): number {
  return getLocalCartItems().reduce((sum, item) => sum + item.quantity, 0)
}

export function onLocalCartUpdated(listener: () => void): () => void {
  window.addEventListener(LOCAL_CART_UPDATED_EVENT, listener)
  return () => window.removeEventListener(LOCAL_CART_UPDATED_EVENT, listener)
}

export async function syncLocalCartToServer(
  addCartItem: (payload: { productId: string; quantity: number }) => Promise<unknown>,
) {
  const rows = getLocalCartItems()
  if (rows.length === 0) {
    return {
      successCount: 0,
      failedItems: [] as LocalCartItem[],
    }
  }
  const failedItems: LocalCartItem[] = []
  let successCount = 0
  for (const row of rows) {
    try {
      await addCartItem({ productId: row.productId, quantity: row.quantity })
      successCount += 1
    } catch {
      // 单条同步失败时保留在本地，避免整批丢失。
      failedItems.push(row)
    }
  }
  if (failedItems.length === 0) {
    clearLocalCart()
  } else {
    saveLocalCartItems(failedItems)
  }
  return {
    successCount,
    failedItems,
  }
}
