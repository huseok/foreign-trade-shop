/**
 * 管理后台主布局：左侧导航 + 顶栏 + 内容区（`Outlet`）。
 *
 * 与商城 `MainLayout` 完全独立；菜单项链接到 `/admin/orders` 等子路由。
 */
import { Layout, Menu, Typography, theme } from 'antd'
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
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useMe } from '../hooks/apiHooks'
import { authStore } from '../lib/auth/authStore'

const { Header, Sider, Content } = Layout

export function AdminLayout() {
  const location = useLocation()
  const navigate = useNavigate()
  const { token } = theme.useToken()
  const { data: me } = useMe(true)

  /** 根据 URL 高亮侧边栏当前项 */
  const selected = (() => {
    if (location.pathname.startsWith('/admin/products')) return ['products']
    if (location.pathname.startsWith('/admin/after-sales')) return ['after-sales']
    if (location.pathname.startsWith('/admin/categories')) return ['categories']
    if (location.pathname.startsWith('/admin/shipping')) return ['shipping']
    if (location.pathname.startsWith('/admin/dicts')) return ['dicts']
    if (location.pathname.startsWith('/admin/site-contents')) return ['site']
    if (location.pathname.startsWith('/admin/audit')) return ['audit']
    return ['orders']
  })()

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider breakpoint="lg" collapsedWidth="0" theme="dark" width={220}>
        <div
          style={{
            height: 56,
            margin: 16,
            borderRadius: token.borderRadius,
            background: 'rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
            color: '#fff',
            letterSpacing: 0.02,
          }}
        >
          CHZfobkey Admin
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={selected}
          items={[
            {
              key: 'orders',
              icon: <ShoppingCartOutlined />,
              label: <Link to="/admin/orders">订单</Link>,
            },
            {
              key: 'products',
              icon: <ShoppingOutlined />,
              label: <Link to="/admin/products">商品</Link>,
            },
            {
              key: 'after-sales',
              icon: <TeamOutlined />,
              label: <Link to="/admin/after-sales">售后</Link>,
            },
            {
              key: 'categories',
              icon: <ClusterOutlined />,
              label: <Link to="/admin/categories">分类</Link>,
            },
            {
              key: 'shipping',
              icon: <AppstoreOutlined />,
              label: <Link to="/admin/shipping">运费模板</Link>,
            },
            {
              key: 'dicts',
              icon: <BookOutlined />,
              label: <Link to="/admin/dicts">字典管理</Link>,
            },
            {
              key: 'site',
              icon: <FileSearchOutlined />,
              label: <Link to="/admin/site-contents">站点内容</Link>,
            },
            {
              key: 'audit',
              icon: <FileSearchOutlined />,
              label: <Link to="/admin/audit">操作日志</Link>,
            },
          ]}
        />
      </Sider>
      <Layout>
        <Header
          style={{
            padding: '0 24px',
            background: token.colorBgContainer,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
          }}
        >
          <Typography.Text type="secondary">管理后台 · {me?.email}</Typography.Text>
          <span>
            <Typography.Link href="/" target="_blank" style={{ marginRight: 16 }}>
              <GlobalOutlined /> 前台站点
            </Typography.Link>
            <Typography.Link
              onClick={() => {
                authStore.clearToken()
                navigate('/admin/login', { replace: true })
              }}
            >
              <LogoutOutlined /> 退出
            </Typography.Link>
          </span>
        </Header>
        <Content style={{ margin: 24, minHeight: 280 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
