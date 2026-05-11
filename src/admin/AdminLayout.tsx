/**
 * 管理后台主布局（Pro 版本）：
 * 左侧导航 + 无顶栏；标题在侧栏顶，邮箱与前台/退出在侧栏底；支持折叠。
 */
import { Space, Typography } from 'antd'
import {
  AppstoreOutlined,
  BookOutlined,
  ClusterOutlined,
  DashboardOutlined,
  FileSearchOutlined,
  GlobalOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TeamOutlined,
  TagsOutlined,
  UserOutlined,
} from '@ant-design/icons'
import { ProLayout } from '@ant-design/pro-components'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useMe } from '../hooks/apiHooks'
import { useI18n } from '../i18n/I18nProvider'
import { authStore } from '../lib/auth/authStore'
import '../styles/admin-shell.css'

export function AdminLayout() {
  const { t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const { data: me } = useMe(true)

  const menuRoutes = [
    { path: '/admin/orders', name: t('admin.menu.orders'), icon: <ShoppingCartOutlined /> },
    { path: '/admin/products', name: t('admin.menu.products'), icon: <ShoppingOutlined /> },
    { path: '/admin/after-sales', name: t('admin.menu.afterSales'), icon: <TeamOutlined /> },
    { path: '/admin/categories', name: t('admin.menu.categories'), icon: <ClusterOutlined /> },
    { path: '/admin/tags', name: t('admin.menu.tags'), icon: <TagsOutlined /> },
    { path: '/admin/shipping', name: t('admin.menu.shipping'), icon: <AppstoreOutlined /> },
    { path: '/admin/dicts', name: t('admin.menu.dicts'), icon: <BookOutlined /> },
    { path: '/admin/site-contents', name: t('admin.menu.siteContents'), icon: <FileSearchOutlined /> },
    { path: '/admin/audit', name: t('admin.menu.audit'), icon: <FileSearchOutlined /> },
  ]

  const brandTitle = t('admin.title')
  const email = me?.email ?? ''

  return (
    <div className="admin-shell">
      <ProLayout
        layout="side"
        navTheme="realDark"
        headerRender={false}
        title={brandTitle}
        logo={false}
        location={{ pathname: location.pathname }}
        route={{ routes: menuRoutes }}
        menu={{ type: 'sub' }}
        fixSiderbar
        menuItemRender={(item, dom) => <Link to={item.path ?? '/admin/orders'}>{dom}</Link>}
        actionsRender={false}
        menuHeaderRender={(_logo, _title, props) => {
          const collapsed = Boolean(props?.collapsed)
          return (
            <div className="admin-sider-brand">
              {collapsed ? (
                <DashboardOutlined className="admin-sider-brand__icon-collapsed" aria-hidden />
              ) : (
                <Typography.Title level={5} className="admin-sider-brand__title">
                  {brandTitle}
                </Typography.Title>
              )}
            </div>
          )
        }}
        menuFooterRender={(props) => {
          const collapsed = Boolean(props?.collapsed)
          return (
            <Space direction="vertical" size={8} className="admin-sider-footer-inner">
              {email ? (
                <Typography.Text
                  ellipsis={{ tooltip: email }}
                  className="admin-sider-footer__email"
                  style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                >
                  <UserOutlined aria-hidden />
                  {!collapsed ? email : null}
                </Typography.Text>
              ) : null}
              <Typography.Link
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="admin-sider-footer__link"
                title={t('admin.siteLink')}
              >
                <GlobalOutlined /> {!collapsed ? ` ${t('admin.siteLink')}` : null}
              </Typography.Link>
              <Typography.Link
                className="admin-sider-footer__link"
                title={t('admin.logout')}
                onClick={() => {
                  authStore.clearToken()
                  navigate('/admin/login', { replace: true })
                }}
              >
                <LogoutOutlined /> {!collapsed ? ` ${t('admin.logout')}` : null}
              </Typography.Link>
            </Space>
          )
        }}
      >
        <div style={{ padding: 24 }}>
          <Outlet />
        </div>
      </ProLayout>
    </div>
  )
}
