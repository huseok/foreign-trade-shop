/**
 * 管理后台主布局（Pro 版本）：
 * 无顶栏；后台标题由 ProLayout 默认渲染在侧栏顶；邮箱与前台/退出在侧栏底。不改主题色，沿用 antd / Pro 默认样式。
 */
import { Space, Typography } from 'antd'
import {
  AppstoreOutlined,
  BarChartOutlined,
  BookOutlined,
  ClusterOutlined,
  CrownOutlined,
  FileSearchOutlined,
  GlobalOutlined,
  GiftOutlined,
  IdcardOutlined,
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
import { ADMIN_MODAL_ROOT_ID } from './adminModalRoot'
import '../styles/admin-shell.css'

export function AdminLayout() {
  const { t } = useI18n()
  const location = useLocation()
  const navigate = useNavigate()
  const { data: me } = useMe(true)

  const menuRoutes = [
    { path: '/admin/stats', name: t('admin.menu.stats'), icon: <BarChartOutlined /> },
    { path: '/admin/orders', name: t('admin.menu.orders'), icon: <ShoppingCartOutlined /> },
    { path: '/admin/customers', name: t('admin.menu.customers'), icon: <IdcardOutlined /> },
    { path: '/admin/products', name: t('admin.menu.products'), icon: <ShoppingOutlined /> },
    { path: '/admin/after-sales', name: t('admin.menu.afterSales'), icon: <TeamOutlined /> },
    { path: '/admin/categories', name: t('admin.menu.categories'), icon: <ClusterOutlined /> },
    { path: '/admin/tags', name: t('admin.menu.tags'), icon: <TagsOutlined /> },
    { path: '/admin/marketing', name: t('admin.menu.marketing'), icon: <GiftOutlined /> },
    { path: '/admin/membership-rules', name: t('admin.menu.membershipRules'), icon: <CrownOutlined /> },
    { path: '/admin/shipping', name: t('admin.menu.shipping'), icon: <AppstoreOutlined /> },
    { path: '/admin/dicts', name: t('admin.menu.dicts'), icon: <BookOutlined /> },
    { path: '/admin/site-contents', name: t('admin.menu.siteContents'), icon: <FileSearchOutlined /> },
    { path: '/admin/audit', name: t('admin.menu.audit'), icon: <FileSearchOutlined /> },
  ]

  const email = me?.email ?? ''

  return (
    <div className="admin-shell">
      <div id={ADMIN_MODAL_ROOT_ID} />
      <ProLayout
        layout="side"
        headerRender={false}
        title={t('admin.title')}
        logo={false}
        location={{ pathname: location.pathname }}
        route={{ routes: menuRoutes }}
        menu={{ type: 'sub' }}
        fixSiderbar
        menuItemRender={(item, dom) => <Link to={item.path ?? '/admin/orders'}>{dom}</Link>}
        actionsRender={false}
        menuFooterRender={(props) => {
          const collapsed = Boolean(props?.collapsed)
          return (
            <Space direction="vertical" size={8} style={{ width: '100%' }}>
              {email ? (
                <Typography.Text ellipsis={{ tooltip: email }}>
                  <UserOutlined aria-hidden /> {!collapsed ? email : null}
                </Typography.Text>
              ) : null}
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
