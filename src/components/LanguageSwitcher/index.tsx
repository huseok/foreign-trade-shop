/**
 * 全局语言切换：持久化 localStorage，详见 `I18nProvider`。
 */
import { Select } from 'antd'
import { useI18n, type LocaleId } from '../../i18n/I18nProvider'

const OPTIONS: Array<{ value: LocaleId; label: string }> = [
  { value: 'zh-CN', label: '中文' },
  { value: 'en-US', label: 'English' },
]

export function LanguageSwitcher({ size = 'small' }: { size?: 'small' | 'middle' }) {
  const { locale, setLocale, t } = useI18n()
  return (
    <Select
      size={size}
      variant="borderless"
      value={locale}
      aria-label={t('header.language')}
      options={OPTIONS}
      onChange={(v) => setLocale(v as LocaleId)}
      popupMatchSelectWidth={false}
      style={{ minWidth: 100 }}
    />
  )
}
