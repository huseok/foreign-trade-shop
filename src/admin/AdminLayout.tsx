/**
 * 管理后台主布局（Pro 版本）：
 * 使用 ProLayout 提供标准后台壳层能力（菜单、头部、内容容器）。
 */
import { Typography } from 'antd'
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
        layout="side"
        navTheme="realDark"
        location={{ pathname: location.pathname }}
        route={{ routes: menuRoutes }}
        menu={{ type: 'sub' }}
        fixSiderbar
        avatarProps={{ title: me?.email ?? 'admin' }}
        menuItemRender={(item, dom) => <Link to={item.path ?? '/admin/orders'}>{dom}</Link>}
        actionsRender={() => [
          <Typography.Link key="go-site" href="/" target="_blank">
            <GlobalOutlined /> {t('admin.siteLink')}
          </Typography.Link>,
          <Typography.Link
            key="logout"
            onClick={() => {
              authStore.clearToken()
              navigate('/admin/login', { replace: true })
            }}
          >
            <LogoutOutlined /> {t('admin.logout')}
          </Typography.Link>,
        ]}
      >
        <div style={{ padding: 24 }}>
          <Outlet />
        </div>
      </ProLayout>
    </div>
  )
}
