import {
  useMutation,
  type MutationFunctionContext,
  type UseMutationOptions,
  type UseMutationResult,
} from '@tanstack/react-query'
import { useRef } from 'react'

/**
 * 与 `useMutation` 相同，但对「相同 variables 的并发调用」合并为同一 Promise：
 * 避免连点触发两次 `mutateAsync` / 重复 `mutationFn`。
 *
 * 不同参数（如购物车不同行）互不影响；与 React Query 的 `isPending` 可同时使用。
 */
export function useGuardedMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const { mutationFn: rawMutationFn, ...rest } = options
  const flights = useRef(new Map<string, Promise<TData>>())

  const wrappedMutationFn =
    rawMutationFn == null
      ? undefined
      : async (vars: TVariables, ctx: MutationFunctionContext) => {
          const key = stableKey(vars)
          const existing = flights.current.get(key)
          if (existing) return existing
          const p = (async () => {
            try {
              return await rawMutationFn(vars, ctx)
            } finally {
              flights.current.delete(key)
            }
          })()
          flights.current.set(key, p)
          return p
        }

  return useMutation({
    ...rest,
    mutationFn: wrappedMutationFn,
  })
}

function stableKey(vars: unknown): string {
  if (vars === undefined || vars === null) return '_'
  if (typeof vars === 'number' || typeof vars === 'string' || typeof vars === 'boolean') {
    return JSON.stringify(vars)
  }
  try {
    return JSON.stringify(vars)
  } catch {
    return String(vars)
  }
}
