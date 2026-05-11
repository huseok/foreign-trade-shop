/**
 * 管理后台主布局（Pro 版本）：
 * 使用 ProLayout 提供标准后台壳层能力（菜单、头部、内容容器）。
 */
import { Space, Typography } from 'antd'
import {
  AppstoreOutlined,
  BookOutlined,
  ClusterOutlined,
  FileSearchOutlined,
  GlobalOutlined,
  LogoutOutlined,
  ShoppingCartOutlined,
  ShoppingOutlined,
  TeamOutlined,
  TagsOutlined,
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

  return (
    <div className="admin-shell">
      <ProLayout
        title={t('admin.title')}
        logo={false}
        location={{ pathname: location.pathname }}
        route={{ routes: menuRoutes }}
        menu={{ type: 'sub' }}
        fixSiderbar
        layout="mix"
        avatarProps={{ title: me?.email ?? 'admin' }}
        menuItemRender={(item, dom) => <Link to={item.path ?? '/admin/orders'}>{dom}</Link>}
        actionsRender={false}
        menuFooterRender={(props) => {
          const collapsed = Boolean(props?.collapsed)
          return (
            <Space direction="vertical" size={4} style={{ width: '100%' }}>
              <Typography.Link href="/" target="_blank" rel="noopener noreferrer" title={t('admin.siteLink')}>
                <GlobalOutlined /> {!collapsed ? ` ${t('admin.siteLink')}` : null}
              </Typography.Link>
              <Typography.Link
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
