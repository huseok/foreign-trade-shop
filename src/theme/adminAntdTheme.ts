import type { ThemeConfig } from 'antd'

/**
 * 与设计稿「Ant Design Pro 浅色」对齐的全局主题（侧栏由 ProLayout 深色菜单承担）。
 * 修改此处即可统一按钮、圆角、表格头等；Modal 等组件级 token 一并集中。
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
  components: {
    Layout: {
      bodyBg: '#f0f2f5',
      headerBg: '#ffffff',
      footerBg: '#f0f2f5',
      siderBg: '#001529',
      triggerBg: '#002140',
      lightSiderBg: '#ffffff',
    },
    Menu: {
      darkItemBg: '#001529',
      darkItemHoverBg: 'rgba(255, 255, 255, 0.08)',
      darkItemSelectedBg: '#1677ff',
      darkSubMenuItemBg: '#000c17',
    },
    Table: {
      headerBg: '#fafafa',
      headerColor: 'rgba(0, 0, 0, 0.45)',
      rowHoverBg: '#fafafa',
    },
    Modal: {
      borderRadiusLG: 8,
      contentBg: '#ffffff',
      headerBg: '#ffffff',
      footerBg: '#ffffff',
      titleFontSize: 16,
    },
    Tabs: {
      itemSelectedColor: '#1677ff',
      inkBarColor: '#1677ff',
      titleFontSize: 14,
    },
  },
}
