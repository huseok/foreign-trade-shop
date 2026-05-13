/**
 * 全局语言切换：持久化 localStorage，详见 `I18nProvider`。
 * 文案标签固定为英文 “Language”，不随界面语言切换。
 */
import { Select } from 'antd'
import { useI18n, type LocaleId } from '../../i18n/useI18n'
import './LanguageSwitcher.scss'

const OPTIONS: Array<{ value: LocaleId; label: string }> = [
  { value: 'zh-CN', label: '中文' },
  { value: 'en-US', label: 'English' },
]

export function LanguageSwitcher({ size = 'small' }: { size?: 'small' | 'middle' }) {
  const { locale, setLocale } = useI18n()
  return (
    <div className="language-switcher">
      <span className="language-switcher__label">Language</span>
      <Select
        size={size}
        variant="borderless"
        value={locale}
        aria-label="Language"
        options={OPTIONS}
        onChange={(v) => setLocale(v as LocaleId)}
        popupMatchSelectWidth={false}
        style={{ minWidth: 100 }}
      />
    </div>
  )
}
