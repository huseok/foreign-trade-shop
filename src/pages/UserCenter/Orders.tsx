/**
 * 用户中心-订单列表：`GET /api/v1/orders`，Tab + 关键字筛选（与管理端订单页交互模式一致）。
 */
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Input, Table, Tabs, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useDictItems, useOrders } from '../../hooks/apiHooks'
import { UserCenterShell } from '../../components/UserCenterShell'
import { useDictLabel, useI18n } from '../../i18n/I18nProvider'
import type { components } from '../../generated/voyage-paths'

type OrderRow = components['schemas']['OrderView']
type OrderTab = 'all' | 'pending' | 'shipping' | 'done'

function statusColor(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'success'
    case 'CANCELLED':
      return 'default'
    case 'PENDING_PAYMENT':
      return 'warning'
    default:
      return 'processing'
  }
}

function matchesOrderTab(status: string, tab: OrderTab): boolean {
  switch (tab) {
    case 'all':
      return true
    case 'pending':
      return status === 'PENDING_PAYMENT'
    case 'shipping':
      return status === 'PAID' || status === 'SHIPPED'
    case 'done':
      return status === 'DELIVERED' || status === 'COMPLETED'
    default:
      return true
  }
}

function OrderStatusTag({ status, apiLabel }: { status: string; apiLabel: string }) {
  const text = useDictLabel('ORDER_STATUS', status, apiLabel)
  return <Tag color={statusColor(status)}>{text}</Tag>
}

export function UserOrdersPage() {
  const { t } = useI18n()
  const { data: orders = [], isLoading } = useOrders()
  const { data: orderStatusItems = [] } = useDictItems('ORDER_STATUS')
  const [orderTab, setOrderTab] = useState<OrderTab>('all')
  const [keyword, setKeyword] = useState('')

  const labelForStatus = (code: string) =>
    orderStatusItems.find((i) => i.itemCode === code)?.itemLabel ?? code

  const filteredOrders = useMemo(
    () =>
      orders.filter((o) => {
        const tabOk = matchesOrderTab(o.status, orderTab)
        const key = keyword.trim().toLowerCase()
        const kwOk = !key || `${o.orderNo} ${o.receiverName}`.toLowerCase().includes(key)
        return tabOk && kwOk
      }),
    [orders, orderTab, keyword],
  )

  const columns: ColumnsType<OrderRow> = [
    {
      title: t('user.ordersColNo'),
      dataIndex: 'orderNo',
      render: (v: string) => (
        <Link to={`/orders/${encodeURIComponent(v)}`}>{v}</Link>
      ),
    },
    {
      title: t('user.ordersColStatus'),
      dataIndex: 'status',
      render: (_, r) => <OrderStatusTag status={r.status} apiLabel={labelForStatus(r.status)} />,
    },
    {
      title: t('user.ordersColAmount'),
      key: 'amt',
      align: 'right',
      render: (_, r) => (
        <span className="tabular-nums">
          {r.currency} {Number(r.totalAmount).toFixed(2)}
        </span>
      ),
    },
    {
      title: t('user.ordersColReceiver'),
      dataIndex: 'receiverName',
    },
    {
      title: t('user.ordersColTracking'),
      key: 'track',
      render: (_, r) => r.trackingNo ?? '—',
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_, r) => (
        <Link to={`/orders/${encodeURIComponent(r.orderNo)}`} className="btn btn--ghost" style={{ padding: '4px 10px' }}>
          {t('common.detail')}
        </Link>
      ),
    },
  ]

  return (
    <UserCenterShell>
      <h2 className="page-header__title" style={{ fontSize: '1.35rem', marginBottom: 8 }}>
        {t('user.ordersTitle')}
      </h2>
      <p className="page-header__desc">{t('user.ordersDesc')}</p>
      <Tabs
        activeKey={orderTab}
        onChange={(k) => setOrderTab(k as OrderTab)}
        items={[
          { key: 'all', label: t('admin.orders.tabAll') },
          { key: 'pending', label: t('admin.orders.tabPending') },
          { key: 'shipping', label: t('admin.orders.tabShipping') },
          { key: 'done', label: t('admin.orders.tabDone') },
        ]}
        style={{ marginTop: 16 }}
      />
      <Input
        allowClear
        placeholder={t('user.ordersKeywordPh')}
        style={{ maxWidth: 360, marginBottom: 12 }}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <Table<OrderRow>
        rowKey="orderNo"
        loading={isLoading}
        columns={columns}
        dataSource={filteredOrders}
        pagination={{ pageSize: 10 }}
      />
    </UserCenterShell>
  )
}
