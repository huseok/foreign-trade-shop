/**
 * 国际化上下文：默认中文；文案来自 JSON 文件，发布前直接改文件即可，无需写库。
 * 字典项显示：优先匹配 `dict.{DICT_CODE}.{ITEM_CODE}`，否则回退接口返回的 itemLabel（多为中文库内标签）。
 */
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import enUS from './locales/en-US.json'
import zhCN from './locales/zh-CN.json'

const STORAGE_KEY = 'globuy-locale'

export type LocaleId = 'zh-CN' | 'en-US'

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

type Ctx = {
  locale: LocaleId
  setLocale: (l: LocaleId) => void
  /** 点路径，如 `nav.home`、`dict.ORDER_STATUS.PAID` */
  t: (key: string) => string
}

const I18nCtx = createContext<Ctx | null>(null)

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

export function useI18n() {
  const ctx = useContext(I18nCtx)
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider')
  return ctx
}

/** 业务字典 code → 展示文案：文件优先，其次运营库 itemLabel */
export function useDictLabel(dictCode: string, itemCode: string, apiLabel: string) {
  const { t } = useI18n()
  const key = `dict.${dictCode}.${itemCode}`
  const localized = t(key)
  return localized === key ? apiLabel : localized
}
