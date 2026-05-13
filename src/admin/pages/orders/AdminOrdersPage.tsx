/**
 * 管理后台订单：`GET /api/v1/admin/orders`。
 *
 * Tab 分组、关键字筛选、物流与状态推进；状态展示优先使用字典与 locale（`dict.ORDER_STATUS.*`）。
 */
import { useState } from 'react'
import { DownOutlined } from '@ant-design/icons'
import { App, Button, Dropdown, Flex, Input, Modal, Select, Space, Table, Tabs, Tag, Typography } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import type { ChangeEvent } from 'react'
import {
  useAdminOrders,
  useAdminUpdateOrderStatus,
  useAdminUpdateOrderTracking,
  useDictItems,
} from '../../../hooks/apiHooks'
import { useDictLabel, useI18n } from '../../../i18n/useI18n'
import { i18nTpl } from '../../../lib/i18nTpl'
import type { components } from '../../../generated/voyage-paths'
import { voyage } from '../../../openapi/voyageSdk'
import { StandardModal } from '../../components/shared/StandardModal'

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
    case 'PAID':
      return 'processing'
    case 'SHIPPED':
      return 'cyan'
    case 'DELIVERED':
      return 'blue'
    default:
      return 'default'
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

/** 结合字典 sortNo 推断状态顺序；缺失时用内置兜底序列 */
function statusProgressRank(
  code: string,
  items: Array<{ itemCode: string; sortNo: number }>,
): number {
  const hit = items.find((i) => i.itemCode === code)
  if (hit != null && typeof hit.sortNo === 'number' && !Number.isNaN(hit.sortNo)) {
    return hit.sortNo
  }
  const fallback = ['PENDING_PAYMENT', 'PAID', 'SHIPPED', 'DELIVERED', 'COMPLETED']
  const idx = fallback.indexOf(code)
  if (idx >= 0) return 100 + idx
  if (code === 'CANCELLED') return 1000
  return 5000
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
  const [orderTab, setOrderTab] = useState<OrderTab>('pending')
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

  const openOrderHistory = async (orderNo: string) => {
    setHistoryModalOrderNo(orderNo)
    setHistoryLoading(true)
    try {
      const data = await voyage.audit.listOrderHistoriesByOrderNo(orderNo)
      setHistories(data)
    } finally {
      setHistoryLoading(false)
    }
  }

  const columns: ProColumns<OrderRow>[] = [
    {
      title: t('admin.orders.colOrderNo'),
      dataIndex: 'orderNo',
      render: (_, r) => <Typography.Text code>{r.orderNo}</Typography.Text>,
    },
    {
      title: t('admin.orders.colStatus'),
      dataIndex: 'status',
      render: (_, r) => <OrderStatusTag status={r.status} apiLabel={labelForStatus(r.status)} />,
    },
    {
      title: t('admin.orders.colPayment'),
      dataIndex: 'paymentStatus',
      search: false,
      width: 120,
      render: (_, r) =>
        r.paymentStatus?.trim() ? (
          <Tag>{r.paymentStatus}</Tag>
        ) : (
          <Typography.Text type="secondary">{t('admin.orders.emptyMark')}</Typography.Text>
        ),
    },
    {
      title: t('admin.orders.colAmount'),
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
      title: t('admin.orders.colReceiver'),
      dataIndex: 'receiverName',
    },
    {
      title: t('admin.orders.colTracking'),
      key: 'track',
      search: false,
      render: (_, r) => r.trackingNo?.trim() || t('admin.orders.emptyMark'),
    },
    {
      title: t('admin.orders.colActions'),
      key: 'actions',
      search: false,
      render: (_, r) => (
        <Space wrap size={4}>
          <Button type="link" size="small" onClick={() => setTrackingModal(r)}>
            {t('admin.orders.tracking')}
          </Button>
          <Button type="link" size="small" onClick={() => setStatusModal(r)}>
            {t('admin.orders.status')}
          </Button>
          <Dropdown
            trigger={['click']}
            placement="bottomRight"
            menu={{
              style: { minWidth: 112 },
              items: [
                { key: 'view', label: t('admin.orders.viewOrder') },
                { key: 'history', label: t('admin.orders.history') },
              ],
              onClick: ({ key, domEvent }) => {
                domEvent.stopPropagation()
                if (key === 'view') {
                  window.open(`/orders/${encodeURIComponent(r.orderNo)}`, '_blank', 'noopener,noreferrer')
                  return
                }
                if (key === 'history') {
                  void openOrderHistory(r.orderNo)
                }
              },
            }}
          >
            <Button type="link" size="small">
              {t('admin.orders.more')} <DownOutlined style={{ fontSize: 10 }} />
            </Button>
          </Dropdown>
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
      message.warning(t('admin.orders.warnTrackingRequired'))
      return
    }
    try {
      await trackingMut.mutateAsync({
        orderNo: trackingModal.orderNo,
        body: { trackingNo: trackingNo.trim(), logisticsCompany: logisticsCompany.trim() || undefined },
      })
      message.success(t('admin.orders.trackingOk'))
      setTrackingModal(null)
      setTrackingNo('')
      setLogisticsCompany('')
      void refetch()
    } catch {
      message.error(t('admin.orders.trackingFail'))
    }
  }

  const runStatusUpdate = async () => {
    if (!statusModal || !nextStatus.trim()) {
      message.warning(t('admin.orders.warnStatusRequired'))
      return
    }
    const cur = statusModal.status
    const next = nextStatus.trim().toUpperCase()
    const curR = statusProgressRank(cur, orderStatusItems)
    const nextR = statusProgressRank(next, orderStatusItems)
    const backward = nextR < curR
    if (backward && !statusRemark.trim()) {
      message.warning(t('admin.orders.forceRepairRemarkRequired'))
      return
    }
    try {
      await statusMut.mutateAsync({
        orderNo: statusModal.orderNo,
        body: {
          status: next,
          remark: statusRemark.trim() || undefined,
          forceRepair: backward,
        },
      })
      message.success(t('admin.orders.statusOk'))
      setStatusModal(null)
      setNextStatus('')
      setStatusRemark('')
      void refetch()
    } catch {
      message.error(t('admin.orders.statusFail'))
    }
  }

  const submitStatus = () => {
    if (!statusModal || !nextStatus.trim()) {
      message.warning(t('admin.orders.warnStatusRequired'))
      return
    }
    const cur = statusModal.status
    const next = nextStatus.trim().toUpperCase()
    const curR = statusProgressRank(cur, orderStatusItems)
    const nextR = statusProgressRank(next, orderStatusItems)
    const backward = nextR < curR
    if (backward && !statusRemark.trim()) {
      message.warning(t('admin.orders.forceRepairRemarkRequired'))
      return
    }
    if (backward) {
      Modal.confirm({
        title: t('admin.orders.statusRevertTitle'),
        content: i18nTpl(t('admin.orders.statusRevertDesc'), {
          from: labelForStatus(cur),
          to: labelForStatus(next),
        }),
        okText: t('admin.orders.statusRevertOk'),
        cancelText: t('admin.orders.statusRevertCancel'),
        onOk: () => runStatusUpdate(),
      })
    } else {
      void runStatusUpdate()
    }
  }

  const submitFlowNext = async () => {
    if (!statusModal) return
    const sorted = [...orderStatusItems].sort((a, b) => a.sortNo - b.sortNo)
    const curIdx = sorted.findIndex((i) => i.itemCode === statusModal.status)
    const nextItem = curIdx >= 0 && curIdx + 1 < sorted.length ? sorted[curIdx + 1] : undefined
    if (!nextItem) {
      message.warning(t('admin.orders.flowNextNoNext'))
      return
    }
    try {
      await statusMut.mutateAsync({
        orderNo: statusModal.orderNo,
        body: {
          status: nextItem.itemCode,
          remark: statusRemark.trim() || undefined,
        },
      })
      message.success(t('admin.orders.flowNextOk'))
      setStatusModal(null)
      setNextStatus('')
      setStatusRemark('')
      void refetch()
    } catch {
      message.error(t('admin.orders.flowNextFail'))
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
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (n) => i18nTpl(t('admin.orders.showTotal'), { n }),
          className: 'admin-table-pagination',
        }}
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
            placeholder={t('admin.orders.trackingNoPh')}
            value={trackingNo}
            onChange={(e) => setTrackingNo(e.target.value)}
          />
          <Input
            placeholder={t('admin.orders.logisticsPh')}
            value={logisticsCompany}
            onChange={(e) => setLogisticsCompany(e.target.value)}
          />
        </Space>
      </StandardModal>

      <StandardModal
        title={i18nTpl(t('admin.orders.historyModalTitle'), { orderNo: historyModalOrderNo ?? '' })}
        open={Boolean(historyModalOrderNo)}
        onCancel={() => setHistoryModalOrderNo(null)}
        footer={null}
        destroyOnClose
        width={760}
        styles={{ body: { maxHeight: 'min(72vh, 560px)', overflowY: 'auto', paddingTop: 12 } }}
      >
        <Table
          rowKey={(_, idx) => String(idx)}
          size="small"
          loading={historyLoading}
          dataSource={histories}
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            pageSizeOptions: ['8', '16', '32'],
            showTotal: (n) => i18nTpl(t('admin.orders.showTotal'), { n }),
            size: 'default',
            className: 'admin-table-pagination',
          }}
          scroll={{ x: 'max-content' }}
          columns={[
            {
              title: t('admin.orders.historyColFrom'),
              dataIndex: 'fromStatus',
              width: 140,
              ellipsis: true,
              render: (v: string | undefined) => v?.trim() || t('admin.orders.emptyMark'),
            },
            {
              title: t('admin.orders.historyColTo'),
              dataIndex: 'toStatus',
              width: 140,
              ellipsis: true,
            },
            {
              title: t('admin.orders.historyColTime'),
              dataIndex: 'changedAt',
              width: 200,
              ellipsis: true,
            },
            {
              title: t('admin.orders.historyColRemark'),
              dataIndex: 'remark',
              ellipsis: true,
              render: (v: string | undefined) => v?.trim() || t('admin.orders.emptyMark'),
            },
          ]}
        />
      </StandardModal>

      <StandardModal
        title={t('admin.orders.status')}
        open={Boolean(statusModal)}
        onOk={() => submitStatus()}
        onCancel={() => {
          setStatusModal(null)
          setNextStatus('')
          setStatusRemark('')
        }}
        confirmLoading={statusMut.isPending}
        okButtonProps={{ disabled: statusMut.isPending }}
        cancelButtonProps={{ disabled: statusMut.isPending }}
        footer={(_, { OkBtn, CancelBtn }) => (
          <Flex justify="flex-end" gap="small" wrap="wrap" align="center">
            <Button type="default" onClick={() => void submitFlowNext()} loading={statusMut.isPending}>
              {t('admin.orders.flowNext')}
            </Button>
            <CancelBtn />
            <OkBtn />
          </Flex>
        )}
        destroyOnClose
      >
        <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
          {t('admin.orders.statusModalHint')}
        </Typography.Paragraph>
        <Select
          placeholder={t('admin.orders.statusSelectPh')}
          value={nextStatus || undefined}
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
          placeholder={t('admin.orders.remarkPh')}
          value={statusRemark}
          onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setStatusRemark(e.target.value)}
        />
      </StandardModal>
    </PageContainer>
  )
}
