/* eslint-disable react-refresh/only-export-components -- context + hook pattern */
/**
 * 订单（旧演示上下文）：
 * 主流程已迁移到后端 API；当前仅给 /admin 演示页提供本地数据兼容。
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  useEffect,
  type ReactNode,
} from 'react'
import type { StoredOrder } from '../types/order'

/** localStorage 键；清除站点数据会丢失全部演示订单 */
const STORAGE_KEY = 'globuy_orders_v1'

type State = {
  orders: StoredOrder[]
}

type Action = { type: 'ADD'; order: StoredOrder }

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'ADD':
      return { orders: [action.order, ...state.orders] }
    default:
      return state
  }
}

function loadFromStorage(): StoredOrder[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    return parsed as StoredOrder[]
  } catch {
    return []
  }
}

function saveToStorage(orders: StoredOrder[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(orders))
  } catch {
    /* ignore quota */
  }
}

type OrdersContextValue = {
  orders: StoredOrder[]
  addOrder: (order: StoredOrder) => void
  getOrderById: (id: string | undefined) => StoredOrder | undefined
}

const OrdersContext = createContext<OrdersContextValue | null>(null)

function initFromStorage(): State {
  return { orders: loadFromStorage() }
}

export function OrdersProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { orders: [] }, initFromStorage)

  // 订单列表变化时同步回 localStorage
  useEffect(() => {
    saveToStorage(state.orders)
  }, [state.orders])

  const addOrder = useCallback((order: StoredOrder) => {
    dispatch({ type: 'ADD', order })
  }, [])

  const getOrderById = useCallback(
    (id: string | undefined) => {
      if (!id) return undefined
      return state.orders.find((o) => o.id === id)
    },
    [state.orders],
  )

  const value = useMemo(
    () => ({
      orders: state.orders,
      addOrder,
      getOrderById,
    }),
    [state.orders, addOrder, getOrderById],
  )

  return (
    <OrdersContext.Provider value={value}>{children}</OrdersContext.Provider>
  )
}

export function useOrders() {
  const ctx = useContext(OrdersContext)
  if (!ctx) throw new Error('useOrders must be used within OrdersProvider')
  return ctx
}
