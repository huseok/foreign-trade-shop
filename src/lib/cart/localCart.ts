/**
 * 本地购物车（未登录态）：
 * - 未登录时加购写入 localStorage
 * - 登录成功后将本地购物车同步到后端，再清空本地
 */

const LOCAL_CART_KEY = 'chzfobkey_local_cart_v1'
const LOCAL_CART_UPDATED_EVENT = 'chzfobkey:local-cart-updated'

export type LocalCartItem = {
  productId: number
  quantity: number
}

export function getLocalCartItems(): LocalCartItem[] {
  try {
    const raw = localStorage.getItem(LOCAL_CART_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as LocalCartItem[]
    return Array.isArray(parsed) ? parsed.filter((x) => Number.isFinite(x.productId) && x.quantity > 0) : []
  } catch {
    return []
  }
}

function saveLocalCartItems(items: LocalCartItem[]) {
  localStorage.setItem(LOCAL_CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event(LOCAL_CART_UPDATED_EVENT))
}

export function addLocalCartItem(productId: number, quantity: number) {
  const nextQty = Math.max(1, Math.trunc(quantity))
  const rows = getLocalCartItems()
  const existed = rows.find((x) => x.productId === productId)
  if (existed) {
    existed.quantity += nextQty
  } else {
    rows.push({ productId, quantity: nextQty })
  }
  saveLocalCartItems(rows)
}

export function updateLocalCartItem(productId: number, quantity: number) {
  const rows = getLocalCartItems()
  const existed = rows.find((x) => x.productId === productId)
  if (!existed) return
  existed.quantity = Math.max(1, Math.trunc(quantity))
  saveLocalCartItems(rows)
}

export function removeLocalCartItem(productId: number) {
  const rows = getLocalCartItems().filter((x) => x.productId !== productId)
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
  addCartItem: (payload: { productId: number; quantity: number }) => Promise<unknown>
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
