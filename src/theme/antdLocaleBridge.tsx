/**
 * 根据 I18n locale 切换 Ant Design 自带文案（表格分页等），与设计稿语言切换联动。
 */
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import enUS from 'antd/locale/en_US'
import type { ReactNode } from 'react'
import { useI18n } from '../i18n/I18nProvider'
import { adminAntdTheme } from './adminAntdTheme'

export function AntdLocaleBridge({ children }: { children: ReactNode }) {
  const { locale } = useI18n()
  return (
    <ConfigProvider locale={locale === 'en-US' ? enUS : zhCN} theme={adminAntdTheme}>
      {children}
    </ConfigProvider>
  )
}
