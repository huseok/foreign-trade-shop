import { useContext } from 'react'
import { I18nCtx, type LocaleId } from './context'

export type { LocaleId }

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
