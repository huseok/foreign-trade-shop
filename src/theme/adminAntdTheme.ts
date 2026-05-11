import type { ThemeConfig } from 'antd'

/**
 * 后台全局主题：仅覆写 Design Token，不单拆组件样式（表格/布局/菜单由 antd 默认推导）。
 */
export const adminAntdTheme: ThemeConfig = {
  token: {
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#fa8c16',
    colorError: '#ff4d4f',
    colorBgLayout: '#f0f2f5',
    colorBgContainer: '#ffffff',
    colorBorder: '#f0f0f0',
    colorBorderSecondary: '#f0f0f0',
    colorText: 'rgba(0, 0, 0, 0.88)',
    colorTextSecondary: 'rgba(0, 0, 0, 0.45)',
    borderRadius: 6,
    fontSize: 14,
  },
}
