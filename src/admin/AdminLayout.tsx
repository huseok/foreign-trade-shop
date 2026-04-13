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
} from '@ant-design/icons'
import { ProLayout } from '@ant-design/pro-components'
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useMe } from '../hooks/apiHooks'
import { authStore } from '../lib/auth/authStore'

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { data: me } = useMe(true)
  const menuRoutes = [
    { path: '/admin/orders', name: '订单', icon: <ShoppingCartOutlined /> },
    { path: '/admin/products', name: '商品', icon: <ShoppingOutlined /> },
    { path: '/admin/after-sales', name: '售后', icon: <TeamOutlined /> },
    { path: '/admin/categories', name: '分类', icon: <ClusterOutlined /> },
    { path: '/admin/shipping', name: '运费模板', icon: <AppstoreOutlined /> },
    { path: '/admin/dicts', name: '字典管理', icon: <BookOutlined /> },
    { path: '/admin/site-contents', name: '站点内容', icon: <FileSearchOutlined /> },
    { path: '/admin/audit', name: '操作日志', icon: <FileSearchOutlined /> },
  ]

  return (
    <ProLayout
      title="CHZfobkey Admin"
      logo={false}
      location={{ pathname: location.pathname }}
      route={{ routes: menuRoutes }}
      menu={{ type: 'sub' }}
      fixSiderbar
      layout="mix"
      avatarProps={{ title: me?.email ?? 'admin' }}
      menuItemRender={(item, dom) => <Link to={item.path ?? '/admin/orders'}>{dom}</Link>}
      actionsRender={() => [
        <Typography.Link key="go-site" href="/" target="_blank">
          <GlobalOutlined /> 前台站点
        </Typography.Link>,
        <Typography.Link
          key="logout"
          onClick={() => {
            authStore.clearToken()
            navigate('/admin/login', { replace: true })
          }}
        >
          <LogoutOutlined /> 退出
        </Typography.Link>,
      ]}
    >
      <div style={{ padding: 16 }}>
        <Outlet />
      </div>
    </ProLayout>
  )
}
