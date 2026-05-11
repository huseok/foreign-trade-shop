import { createContext } from 'react'

export type LocaleId = 'zh-CN' | 'en-US'

export type I18nContextValue = {
  locale: LocaleId
  setLocale: (l: LocaleId) => void
  /** 点路径，如 `nav.home`、`dict.ORDER_STATUS.PAID` */
  t: (key: string) => string
}

export const I18nCtx = createContext<I18nContextValue | null>(null)
