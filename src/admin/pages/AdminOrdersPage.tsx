/**
 * 管理端订单列表：`GET /api/v1/admin/orders`。
 *
 * 设计稿对齐：顶部四个 Tab（全部 / 待付款 / 待发货·配送 / 已完成）+ 关键字筛选；
 * 字典展示优先读 locale 文件 `dict.ORDER_STATUS.*`，缺省回退库内中文标签。
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { App, Button, Input, Select, Space, Table, Tabs, Tag, Typography } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import type { ChangeEvent } from 'react'
import {
  useAdminFlowNextOrderStatus,
  useAdminOrders,
  useAdminUpdateOrderStatus,
  useAdminUpdateOrderTracking,
  useDictItems,
} from '../../hooks/apiHooks'
import { useDictLabel, useI18n } from '../../i18n/I18nProvider'
import type { components } from '../../generated/voyage-paths'
import { voyage } from '../../openapi/voyageSdk'
import { StandardModal } from '../components/StandardModal'

type OrderRow = components['schemas']['OrderView']

type OrderTab = 'all' | 'pending' | 'shipping' | 'done'

function statusColor(status: string) {
  switch (status) {
    case 'COMPLETED':
      return 'success'
    case 'CANCELLED':
      return 'error'
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

export function AdminOrdersPage() {
  const { message } = App.useApp()
  const { t } = useI18n()
  const { data: orders = [], isLoading, refetch } = useAdminOrders()
  const { data: orderStatusItems = [] } = useDictItems('ORDER_STATUS')
  const trackingMut = useAdminUpdateOrderTracking()
  const statusMut = useAdminUpdateOrderStatus()
  const flowNextMut = useAdminFlowNextOrderStatus()
  const [orderTab, setOrderTab] = useState<OrderTab>('all')
  const [trackingModal, setTrackingModal] = useState<OrderRow | null>(null)
  const [trackingNo, setTrackingNo] = useState('')
  const [logisticsCompany, setLogisticsCompany] = useState('')
  const [statusModal, setStatusModal] = useState<OrderRow | null>(null)
  const [nextStatus, setNextStatus] = useState('')
  const [statusRemark, setStatusRemark] = useState('')
  const [keyword, setKeyword] = useState('')
  const [historyModalOrderNo, setHistoryModalOrderNo] = useState<string | null>(null)
  const [histories, setHistories] = useState<
    Array<{ fromStatus?: string; toStatus: string; changedAt: string; remark?: string }>
  >([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const labelForStatus = (code: string) =>
    orderStatusItems.find((i) => i.itemCode === code)?.itemLabel ?? code

  const columns: ProColumns<OrderRow>[] = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      render: (_, r) => <Typography.Text code>{r.orderNo}</Typography.Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (_, r) => <OrderStatusTag status={r.status} apiLabel={labelForStatus(r.status)} />,
    },
    {
      title: '金额',
      key: 'amt',
      search: false,
      align: 'right',
      render: (_, r) => (
        <span className="tabular-nums">
          {r.currency} {Number(r.totalAmount).toFixed(2)}
        </span>
      ),
    },
    {
      title: '收货人',
      dataIndex: 'receiverName',
    },
    {
      title: '运单',
      key: 'track',
      search: false,
      render: (_, r) => r.trackingNo ?? '—',
    },
    {
      title: '操作',
      key: 'actions',
      search: false,
      render: (_, r) => (
        <Space wrap>
          <Link to={`/orders/${encodeURIComponent(r.orderNo)}`} target="_blank" rel="noreferrer">
            前台详情
          </Link>
          <Button type="link" size="small" onClick={() => setTrackingModal(r)}>
            {t('admin.orders.tracking')}
          </Button>
          <Button type="link" size="small" onClick={() => setStatusModal(r)}>
            {t('admin.orders.status')}
          </Button>
          <Button
            type="link"
            size="small"
            onClick={async () => {
              setHistoryModalOrderNo(r.orderNo)
              setHistoryLoading(true)
              try {
                const data = await voyage.audit.listOrderHistoriesByOrderNo(r.orderNo)
                setHistories(data)
              } finally {
                setHistoryLoading(false)
              }
            }}
          >
            {t('admin.orders.history')}
          </Button>
        </Space>
      ),
    },
  ]

  const filteredOrders = orders.filter((o) => {
    const tabOk = matchesOrderTab(o.status, orderTab)
    const key = keyword.trim().toLowerCase()
    const kwOk = !key || `${o.orderNo} ${o.receiverName}`.toLowerCase().includes(key)
    return tabOk && kwOk
  })

  const submitTracking = async () => {
    if (!trackingModal || !trackingNo.trim()) {
      message.warning('请填写运单号')
      return
    }
    try {
      await trackingMut.mutateAsync({
        orderNo: trackingModal.orderNo,
        body: { trackingNo: trackingNo.trim(), logisticsCompany: logisticsCompany.trim() || undefined },
      })
      message.success('已更新物流')
      setTrackingModal(null)
      setTrackingNo('')
      setLogisticsCompany('')
      void refetch()
    } catch {
      message.error('更新失败')
    }
  }

  const submitStatus = async () => {
    if (!statusModal || !nextStatus.trim()) {
      message.warning('请选择目标状态')
      return
    }
    try {
      await statusMut.mutateAsync({
        orderNo: statusModal.orderNo,
        body: { status: nextStatus.trim().toUpperCase(), remark: statusRemark.trim() || undefined },
      })
      message.success('状态已更新')
      setStatusModal(null)
      setNextStatus('')
      setStatusRemark('')
      void refetch()
    } catch {
      message.error('更新失败（请检查状态流转是否合法）')
    }
  }

  const submitFlowNext = async () => {
    if (!statusModal) return
    try {
      await flowNextMut.mutateAsync({
        orderNo: statusModal.orderNo,
        remark: statusRemark.trim() || undefined,
      })
      message.success('已自动流转到下一环节')
      setStatusModal(null)
      setNextStatus('')
      setStatusRemark('')
      void refetch()
    } catch {
      message.error('流转失败（请检查字典配置和当前状态）')
    }
  }

  return (
    <PageContainer title={t('admin.orders.title')} subTitle={t('admin.orders.subtitle')}>
      <Tabs
        className="admin-page-tab"
        activeKey={orderTab}
        onChange={(k) => setOrderTab(k as OrderTab)}
        style={{ marginBottom: 12 }}
        items={[
          { key: 'all', label: t('admin.orders.tabAll') },
          { key: 'pending', label: t('admin.orders.tabPending') },
          { key: 'shipping', label: t('admin.orders.tabShipping') },
          { key: 'done', label: t('admin.orders.tabDone') },
        ]}
      />
      <Space style={{ marginBottom: 12 }} wrap>
        <Input
          allowClear
          placeholder={t('admin.orders.keywordPh')}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ width: 280 }}
        />
      </Space>
      <ProTable<OrderRow>
        rowKey="orderNo"
        loading={isLoading}
        search={false}
        options={false}
        columns={columns}
        dataSource={filteredOrders}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      <StandardModal
        title={t('admin.orders.tracking')}
        open={Boolean(trackingModal)}
        onOk={() => void submitTracking()}
        onCancel={() => {
          setTrackingModal(null)
          setTrackingNo('')
          setLogisticsCompany('')
        }}
        confirmLoading={trackingMut.isPending}
        okButtonProps={{ disabled: trackingMut.isPending }}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Input
            placeholder="运单号 trackingNo"
            value={trackingNo}
            onChange={(e) => setTrackingNo(e.target.value)}
          />
          <Input
            placeholder="物流公司（可选）"
            value={logisticsCompany}
            onChange={(e) => setLogisticsCompany(e.target.value)}
          />
        </Space>
      </StandardModal>

      <StandardModal
        title={`${t('admin.orders.history')}：${historyModalOrderNo ?? ''}`}
        open={Boolean(historyModalOrderNo)}
        onCancel={() => setHistoryModalOrderNo(null)}
        footer={null}
        destroyOnClose
      >
        <Table
          rowKey={(_, idx) => String(idx)}
          loading={historyLoading}
          pagination={false}
          dataSource={histories}
          columns={[
            { title: '从状态', dataIndex: 'fromStatus', render: (v) => v ?? '-' },
            { title: '到状态', dataIndex: 'toStatus' },
            { title: '时间', dataIndex: 'changedAt' },
            { title: '备注', dataIndex: 'remark', render: (v) => v ?? '-' },
          ]}
        />
      </StandardModal>

      <StandardModal
        title={t('admin.orders.status')}
        open={Boolean(statusModal)}
        onOk={() => void submitStatus()}
        onCancel={() => {
          setStatusModal(null)
          setNextStatus('')
          setStatusRemark('')
        }}
        confirmLoading={statusMut.isPending || flowNextMut.isPending}
        okButtonProps={{ disabled: statusMut.isPending || flowNextMut.isPending }}
        cancelButtonProps={{ disabled: statusMut.isPending || flowNextMut.isPending }}
        footer={(_, { OkBtn, CancelBtn }) => (
          <>
            <Button onClick={() => void submitFlowNext()} loading={flowNextMut.isPending}>
              流转下一环节
            </Button>
            <CancelBtn />
            <OkBtn />
          </>
        )}
        destroyOnClose
      >
        <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
          状态来源于字典 ORDER_STATUS；可手动选择目标状态，或一键流转到下一环节。
        </Typography.Paragraph>
        <Select
          placeholder="选择目标状态"
          value={nextStatus}
          onChange={setNextStatus}
          style={{ width: '100%' }}
          options={orderStatusItems.map((item) => ({
            value: item.itemCode,
            label: `${item.itemLabel} (${item.itemCode})`,
          }))}
        />
        <Input.TextArea
          style={{ marginTop: 12 }}
          rows={3}
          placeholder="流转备注（可选）"
          value={statusRemark}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setStatusRemark(e.target.value)}
        />
      </StandardModal>
    </PageContainer>
  )
}
