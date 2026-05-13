/**
 * 国际化 Provider：默认中文；文案来自 JSON，发布前直接改 `locales/*.json` 即可。
 * 同目录下 `useI18n.ts` 提供 `useI18n` / `useDictLabel`，与 Fast Refresh 规则分离（本文件仅导出组件）。
 */
import { useCallback, useMemo, useState, type ReactNode } from 'react'
import enUS from './locales/en-US.json'
import zhCN from './locales/zh-CN.json'
import { I18nCtx, type LocaleId } from './context'

const STORAGE_KEY = 'globuy-locale'

const catalogs: Record<LocaleId, Record<string, unknown>> = {
  'zh-CN': zhCN as Record<string, unknown>,
  'en-US': enUS as Record<string, unknown>,
}

function getByPath(obj: unknown, path: string): string | undefined {
  const parts = path.split('.')
  let cur: unknown = obj
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined
    cur = (cur as Record<string, unknown>)[p]
  }
  return typeof cur === 'string' ? cur : undefined
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<LocaleId>(() => {
    const raw = localStorage.getItem(STORAGE_KEY) as LocaleId | null
    return raw === 'en-US' ? 'en-US' : 'zh-CN'
  })

  const setLocale = useCallback((l: LocaleId) => {
    setLocaleState(l)
    localStorage.setItem(STORAGE_KEY, l)
    document.documentElement.lang = l === 'zh-CN' ? 'zh-CN' : 'en'
  }, [])

  const t = useCallback(
    (key: string) => {
      return (
        getByPath(catalogs[locale], key) ??
        getByPath(catalogs['zh-CN'], key) ??
        key
      )
    },
    [locale],
  )

  const value = useMemo(() => ({ locale, setLocale, t }), [locale, setLocale, t])

  return <I18nCtx.Provider value={value}>{children}</I18nCtx.Provider>
}
