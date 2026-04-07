/* eslint-disable react-refresh/only-export-components -- context + hook pattern */
/**
 * 购物车（旧演示上下文）：
 * 主流程已迁移到后端接口，本文件仅保留以便需要时回退/对比。
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from 'react'

/** 购物车一行：只存商品 id 与数量，展示时再用 mock 数据解析名称/价格 */
export type CartLine = {
  productId: string
  qty: number
}

type CartState = {
  lines: CartLine[]
}

type CartAction =
  | { type: 'ADD'; productId: string; qty?: number }
  | { type: 'REMOVE'; productId: string }
  | { type: 'SET_QTY'; productId: string; qty: number }
  | { type: 'CLEAR' }

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD': {
      const addQty = action.qty ?? 1
      const idx = state.lines.findIndex((l) => l.productId === action.productId)
      if (idx === -1) {
        return {
          lines: [...state.lines, { productId: action.productId, qty: addQty }],
        }
      }
      const next = [...state.lines]
      next[idx] = {
        ...next[idx],
        qty: next[idx].qty + addQty,
      }
      return { lines: next }
    }
    case 'REMOVE':
      return {
        lines: state.lines.filter((l) => l.productId !== action.productId),
      }
    case 'SET_QTY': {
      const q = Math.max(1, Math.floor(action.qty))
      const idx = state.lines.findIndex((l) => l.productId === action.productId)
      if (idx === -1) return state
      const next = [...state.lines]
      next[idx] = { ...next[idx], qty: q }
      return { lines: next }
    }
    case 'CLEAR':
      return { lines: [] }
    default:
      return state
  }
}

type CartContextValue = {
  lines: CartLine[]
  itemCount: number
  addItem: (productId: string, qty?: number) => void
  removeItem: (productId: string) => void
  setQty: (productId: string, qty: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { lines: [] })

  const addItem = useCallback((productId: string, qty?: number) => {
    dispatch({ type: 'ADD', productId, qty })
  }, [])

  const removeItem = useCallback((productId: string) => {
    dispatch({ type: 'REMOVE', productId })
  }, [])

  const setQty = useCallback((productId: string, qty: number) => {
    dispatch({ type: 'SET_QTY', productId, qty })
  }, [])

  const clear = useCallback(() => {
    dispatch({ type: 'CLEAR' })
  }, [])

  const itemCount = useMemo(
    () => state.lines.reduce((sum, l) => sum + l.qty, 0),
    [state.lines],
  )

  const value = useMemo(
    () => ({
      lines: state.lines,
      itemCount,
      addItem,
      removeItem,
      setQty,
      clear,
    }),
    [state.lines, itemCount, addItem, removeItem, setQty, clear],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within CartProvider')
  return ctx
}
