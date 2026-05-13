/**
 * 管理后台订单：`GET /api/v1/admin/orders`。
 *
 * Tab 分组、关键字筛选、物流与状态推进；详情以弹窗展示订单快照、行项目、物流与状态日志（无独立「前台详情」入口）。
 */
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { App, Alert, Button, Descriptions, Divider, Flex, Input, Select, Space, Table, Tabs, Tag, Typography } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import type { ChangeEvent } from 'react'
import {
  useAdminAppendOrderLogistics,
  useAdminOrders,
  useAdminUpdateOrderStatus,
  useAdminUpdateOrderTracking,
  useDictItems,
} from '../../../hooks/apiHooks'
import { i18nTpl } from '../../../lib/i18nTpl'
import { useDictLabel, useI18n } from '../../../i18n/useI18n'
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
  const [searchParams, setSearchParams] = useSearchParams()
  const rawUserId = searchParams.get('userId')
  const parsedUserId = rawUserId != null ? Number(rawUserId) : NaN
  const filterUserId = !Number.isNaN(parsedUserId) && parsedUserId > 0 ? parsedUserId : undefined
  const customerLabel = (searchParams.get('customerLabel') ?? '').trim()

  const clearCustomerFilter = () => {
    const next = new URLSearchParams(searchParams)
    next.delete('userId')
    next.delete('customerLabel')
    setSearchParams(next, { replace: true })
  }

  const { data: orders = [], isLoading, refetch } = useAdminOrders({ userId: filterUserId })
  const { data: orderStatusItems = [] } = useDictItems('ORDER_STATUS')
  const trackingMut = useAdminUpdateOrderTracking()
  const statusMut = useAdminUpdateOrderStatus()
  const appendLogisticsMut = useAdminAppendOrderLogistics()
  const [orderTab, setOrderTab] = useState<OrderTab>('pending')
  const [statusFilter, setStatusFilter] = useState('')
  const [paymentFilter, setPaymentFilter] = useState('')
  const [trackingModal, setTrackingModal] = useState<OrderRow | null>(null)
  const [trackingNo, setTrackingNo] = useState('')
  const [logisticsCompany, setLogisticsCompany] = useState('')
  const [statusModal, setStatusModal] = useState<OrderRow | null>(null)
  const [nextStatus, setNextStatus] = useState('')
  const [statusRemark, setStatusRemark] = useState('')
  const [keyword, setKeyword] = useState('')
  const [detailModal, setDetailModal] = useState<OrderRow | null>(null)
  const [logisticsModal, setLogisticsModal] = useState<OrderRow | null>(null)
  const [appendTrackingNo, setAppendTrackingNo] = useState('')
  const [appendCarrier, setAppendCarrier] = useState('')
  const [appendRemark, setAppendRemark] = useState('')
  const [histories, setHistories] = useState<
    Array<{ fromStatus?: string; toStatus: string; changedAt: string; remark?: string }>
  >([])
  const [historyLoading, setHistoryLoading] = useState(false)

  const labelForStatus = (code: string) =>
    orderStatusItems.find((i) => i.itemCode === code)?.itemLabel ?? code

  useEffect(() => {
    if (orderTab !== 'all') setStatusFilter('')
  }, [orderTab])

  useEffect(() => {
    if (!statusModal || orderStatusItems.length === 0) return
    const sorted = [...orderStatusItems].sort((a, b) => a.sortNo - b.sortNo)
    const idx = sorted.findIndex((i) => i.itemCode === statusModal.status)
    const nextItem = idx >= 0 && idx + 1 < sorted.length ? sorted[idx + 1] : undefined
    setNextStatus(nextItem?.itemCode ?? '')
    setStatusRemark('')
  }, [statusModal, orderStatusItems])

  const paymentOptions = useMemo(() => {
    const set = new Set<string>()
    for (const o of orders) {
      const p = o.paymentStatus?.trim()
      if (p) set.add(p)
    }
    return [...set].sort()
  }, [orders])

  const filteredOrders = useMemo(
    () =>
      orders.filter((o) => {
        const tabOk = matchesOrderTab(o.status, orderTab)
        const key = keyword.trim().toLowerCase()
        const kwOk = !key || `${o.orderNo} ${o.receiverName}`.toLowerCase().includes(key)
        const statusOk =
          orderTab !== 'all' || !statusFilter.trim() || o.status === statusFilter.trim()
        const payOk = !paymentFilter.trim() || o.paymentStatus === paymentFilter.trim()
        return tabOk && kwOk && statusOk && payOk
      }),
    [orders, orderTab, keyword, statusFilter, paymentFilter],
  )
  const openOrderDetail = async (row: OrderRow) => {
    setDetailModal(row)
    setHistoryLoading(true)
    try {
      const data = await voyage.audit.listOrderHistoriesByOrderNo(row.orderNo)
      setHistories(data)
    } finally {
      setHistoryLoading(false)
    }
  }

  const closeOrderDetail = () => {
    setDetailModal(null)
    setHistories([])
  }

  const openLogisticsModal = (row: OrderRow) => {
    setLogisticsModal(row)
    setAppendTrackingNo('')
    setAppendCarrier('')
    setAppendRemark('')
  }

  const closeLogisticsModal = () => {
    setLogisticsModal(null)
    setAppendTrackingNo('')
    setAppendCarrier('')
    setAppendRemark('')
  }

  const submitAppendLogistics = async () => {
    if (!logisticsModal || !appendTrackingNo.trim()) {
      message.warning(t('admin.orders.warnTrackingRequired'))
      return
    }
    try {
      await appendLogisticsMut.mutateAsync({
        orderNo: logisticsModal.orderNo,
        body: {
          trackingNo: appendTrackingNo.trim(),
          carrier: appendCarrier.trim() || undefined,
          remark: appendRemark.trim() || undefined,
        },
      })
      message.success(t('admin.orders.appendLogisticsOk'))
      closeLogisticsModal()
      void refetch()
    } catch {
      message.error(t('admin.orders.appendLogisticsFail'))
    }
  }

  const fmtMoney = (currency: string, amount: string) => (
    <span className="tabular-nums">
      {currency} {Number(amount).toFixed(2)}
    </span>
  )
  const fmtPlacedAt = (iso: string) => {
    const d = new Date(iso)
    return Number.isNaN(d.getTime()) ? iso : d.toLocaleString()
  }

  const columns: ProColumns<OrderRow>[] = [
    {
      title: t('admin.orders.colOrderNo'),
      dataIndex: 'orderNo',
      render: (_, r) => <Typography.Text code>{r.orderNo}</Typography.Text>,
    },
    {
      title: t('admin.orders.colCreatedAt'),
      dataIndex: 'createdAt',
      width: 168,
      search: false,
      render: (_, r) => fmtPlacedAt(r.createdAt),
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
          <Button type="link" size="small" onClick={() => void openOrderDetail(r)}>
            {t('admin.orders.detail')}
          </Button>
          <Button type="link" size="small" onClick={() => void openLogisticsModal(r)}>
            {t('admin.orders.logisticsTrail')}
          </Button>
          <Button type="link" size="small" onClick={() => setTrackingModal(r)}>
            {t('admin.orders.tracking')}
          </Button>
          <Button type="link" size="small" onClick={() => setStatusModal(r)}>
            {t('admin.orders.status')}
          </Button>
        </Space>
      ),
    },
  ]

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

  const doStatusUpdate = async (forceRepair: boolean) => {
    if (!statusModal || !nextStatus.trim()) {
      message.warning(t('admin.orders.warnStatusRequired'))
      return
    }
    const cur = statusModal.status
    const next = nextStatus.trim().toUpperCase()
    const curR = statusProgressRank(cur, orderStatusItems)
    const nextR = statusProgressRank(next, orderStatusItems)
    const backward = nextR < curR
    if (forceRepair) {
      if (!backward) {
        message.warning(t('admin.orders.repairOnlyRollback'))
        return
      }
      if (!statusRemark.trim()) {
        message.warning(t('admin.orders.forceRepairRemarkRequired'))
        return
      }
    } else if (backward) {
      message.warning(t('admin.orders.useRepairForRollback'))
      return
    }
    try {
      await statusMut.mutateAsync({
        orderNo: statusModal.orderNo,
        body: {
          status: next,
          remark: statusRemark.trim() || undefined,
          forceRepair,
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

  const submitSaveStatus = () => {
    void doStatusUpdate(false)
  }

  const submitRepairOrder = () => {
    void doStatusUpdate(true)
  }
  return (
    <PageContainer title={t('admin.orders.title')} subTitle={t('admin.orders.subtitle')}>
      {filterUserId != null && (
        <Alert
          type="info"
          showIcon
          closable
          onClose={clearCustomerFilter}
          style={{ marginBottom: 12 }}
          message={t('admin.orders.filterByCustomerTitle')}
          description={i18nTpl(t('admin.orders.filterByCustomerDesc'), {
            display: customerLabel || `ID ${filterUserId}`,
          })}
        />
      )}
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
      <Space style={{ marginBottom: 12 }} wrap align="center">
        <Input
          allowClear
          placeholder={t('admin.orders.keywordPh')}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          style={{ width: 280 }}
        />
        {orderTab === 'all' && (
          <Select
            allowClear
            placeholder={t('admin.orders.filterStatus')}
            style={{ width: 200 }}
            value={statusFilter || undefined}
            onChange={(v) => setStatusFilter(v ?? '')}
            options={orderStatusItems.map((item) => ({
              value: item.itemCode,
              label: `${item.itemLabel} (${item.itemCode})`,
            }))}
          />
        )}
        <Select
          allowClear
          placeholder={t('admin.orders.filterPayment')}
          style={{ width: 180 }}
          value={paymentFilter || undefined}
          onChange={(v) => setPaymentFilter(v ?? '')}
          options={paymentOptions.map((p) => ({ value: p, label: p }))}
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
        title={
          logisticsModal
            ? `${t('admin.orders.logisticsTrail')} · ${logisticsModal.orderNo}`
            : t('admin.orders.logisticsTrail')
        }
        open={Boolean(logisticsModal)}
        onCancel={closeLogisticsModal}
        onOk={() => void submitAppendLogistics()}
        confirmLoading={appendLogisticsMut.isPending}
        okText={t('admin.orders.appendLogistics')}
        destroyOnClose
        width={720}
      >
        <Typography.Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 12 }}>
          {t('admin.orders.logisticsTrailHint')}
        </Typography.Paragraph>
        {logisticsModal && (
          <Table
            style={{ marginBottom: 16 }}
            rowKey={(lg) => String(lg.id)}
            size="small"
            pagination={false}
            dataSource={logisticsModal.logistics ?? []}
            locale={{ emptyText: t('admin.orders.emptyMark') }}
            columns={[
              { title: t('admin.orders.logColCarrier'), dataIndex: 'carrier', render: (v) => v || '—' },
              { title: t('admin.orders.logColTracking'), dataIndex: 'trackingNo' },
              { title: t('admin.orders.logColRemark'), dataIndex: 'remark', ellipsis: true },
              { title: t('admin.orders.logColTime'), dataIndex: 'createdAt', width: 180 },
            ]}
          />
        )}
        <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
          {t('admin.orders.appendLogistics')}
        </Typography.Text>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Input
            placeholder={t('admin.orders.trackingNoPh')}
            value={appendTrackingNo}
            onChange={(e) => setAppendTrackingNo(e.target.value)}
          />
          <Input
            placeholder={t('admin.orders.logisticsPh')}
            value={appendCarrier}
            onChange={(e) => setAppendCarrier(e.target.value)}
          />
          <Input.TextArea
            rows={2}
            placeholder={t('admin.orders.appendLogisticsRemarkPh')}
            value={appendRemark}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setAppendRemark(e.target.value)}
          />
        </Space>
      </StandardModal>

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
        title={
          detailModal
            ? i18nTpl(t('admin.orders.detailModalTitle'), { orderNo: detailModal.orderNo })
            : t('admin.orders.detail')
        }
        open={Boolean(detailModal)}
        onCancel={closeOrderDetail}
        footer={null}
        destroyOnClose
        width={920}
        styles={{ body: { maxHeight: 'min(78vh, 640px)', overflowY: 'auto', paddingTop: 12 } }}
      >
        {detailModal && (
          <>
            <Typography.Title level={5} style={{ marginTop: 0 }}>
              {t('checkout.summaryTitle')}
            </Typography.Title>
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label={t('admin.orders.colOrderNo')} span={2}>
                <Typography.Text code>{detailModal.orderNo}</Typography.Text>
              </Descriptions.Item>
              <Descriptions.Item label={t('admin.orders.colStatus')}>
                <OrderStatusTag status={detailModal.status} apiLabel={labelForStatus(detailModal.status)} />
              </Descriptions.Item>
              <Descriptions.Item label={t('admin.orders.colPayment')}>
                {detailModal.paymentStatus?.trim() ? (
                  <Tag>{detailModal.paymentStatus}</Tag>
                ) : (
                  <Typography.Text type="secondary">{t('admin.orders.emptyMark')}</Typography.Text>
                )}
              </Descriptions.Item>
              <Descriptions.Item label={t('admin.orders.detailCreatedAt')} span={2}>
                {detailModal.createdAt}
              </Descriptions.Item>
              <Descriptions.Item label={t('admin.orders.colAmount')} span={2}>
                {fmtMoney(detailModal.currency, detailModal.totalAmount)}
              </Descriptions.Item>
              <Descriptions.Item label={t('admin.orders.detailSubtotal')}>
                {fmtMoney(detailModal.currency, detailModal.subtotalAmount)}
              </Descriptions.Item>
              <Descriptions.Item label={t('admin.orders.detailShippingFee')}>
                {fmtMoney(detailModal.currency, detailModal.shippingFee)}
              </Descriptions.Item>
              <Descriptions.Item label={t('admin.orders.detailDiscountMember')}>
                {fmtMoney(detailModal.currency, detailModal.discountMember)}
              </Descriptions.Item>
              <Descriptions.Item label={t('admin.orders.detailDiscountPromo')}>
                {fmtMoney(detailModal.currency, detailModal.discountPromo)}
              </Descriptions.Item>
              <Descriptions.Item label={t('admin.orders.detailDiscountCoupon')}>
                {fmtMoney(detailModal.currency, detailModal.discountCoupon)}
              </Descriptions.Item>
              <Descriptions.Item label={t('admin.orders.detailCoupon')} span={2}>
                {detailModal.couponCodeSnapshot?.trim() || t('admin.orders.emptyMark')}
              </Descriptions.Item>
              <Descriptions.Item label={t('admin.orders.detailPaypal')} span={2}>
                {detailModal.paypalOrderId?.trim() || t('admin.orders.emptyMark')}
              </Descriptions.Item>
              <Descriptions.Item label={t('admin.orders.detailIncoterm')}>
                {detailModal.incoterm?.trim() || t('admin.orders.emptyMark')}
              </Descriptions.Item>
              <Descriptions.Item label={t('admin.orders.detailShipMethod')}>
                {detailModal.shippingMethod?.trim() || t('admin.orders.emptyMark')}
              </Descriptions.Item>
            </Descriptions>

            <Divider />
            <Typography.Title level={5}>{t('checkout.shipTitle')}</Typography.Title>
            <Descriptions size="small" column={2} bordered>
              <Descriptions.Item label={t('user.addrReceiver')}>{detailModal.receiverName}</Descriptions.Item>
              <Descriptions.Item label={t('user.addrPhone')}>{detailModal.receiverPhone}</Descriptions.Item>
              <Descriptions.Item label={t('user.addrCompany')} span={2}>
                {detailModal.receiverCompany?.trim() || t('admin.orders.emptyMark')}
              </Descriptions.Item>
              <Descriptions.Item label={t('checkout.taxNo')} span={2}>
                {detailModal.taxNo?.trim() || t('admin.orders.emptyMark')}
              </Descriptions.Item>
              <Descriptions.Item label={t('user.addrCountry')}>{detailModal.country}</Descriptions.Item>
              <Descriptions.Item label={t('user.addrPostal')}>
                {detailModal.postalCode?.trim() || t('admin.orders.emptyMark')}
              </Descriptions.Item>
              <Descriptions.Item label={t('user.addrProvince')}>
                {detailModal.receiverProvince?.trim() || t('admin.orders.emptyMark')}
              </Descriptions.Item>
              <Descriptions.Item label={t('user.addrCity')}>
                {detailModal.receiverCity?.trim() || t('admin.orders.emptyMark')}
              </Descriptions.Item>
              <Descriptions.Item label={t('user.addrLine')} span={2}>
                {detailModal.addressLine}
              </Descriptions.Item>
              <Descriptions.Item label={t('admin.orders.colTracking')} span={2}>
                {detailModal.trackingNo?.trim() || t('admin.orders.emptyMark')}
                {detailModal.logisticsCompany?.trim()
                  ? ` · ${detailModal.logisticsCompany}`
                  : ''}
              </Descriptions.Item>
            </Descriptions>

            <Divider />
            <Typography.Title level={5}>{t('admin.orders.detailLines')}</Typography.Title>
            <Table
              rowKey={(it) => `${it.productId}-${it.titleSnapshot}`}
              size="small"
              pagination={false}
              dataSource={detailModal.items ?? []}
              columns={[
                { title: t('admin.orders.lineColTitle'), dataIndex: 'titleSnapshot', ellipsis: true },
                { title: t('admin.orders.lineColSku'), dataIndex: 'productId', width: 160 },
                {
                  title: t('admin.orders.lineColPrice'),
                  dataIndex: 'priceSnapshot',
                  width: 120,
                  align: 'right',
                  render: (v: string) => fmtMoney(detailModal.currency, v),
                },
                { title: t('admin.orders.lineColQty'), dataIndex: 'quantity', width: 72, align: 'right' },
                {
                  title: t('admin.orders.lineColLine'),
                  key: 'line',
                  width: 120,
                  align: 'right',
                  render: (_, it) =>
                    fmtMoney(
                      detailModal.currency,
                      String(Number(it.priceSnapshot) * it.quantity),
                    ),
                },
              ]}
            />

            <Divider />
            <Typography.Title level={5}>{t('admin.orders.detailLogistics')}</Typography.Title>
            <Table
              rowKey={(lg) => String(lg.id)}
              size="small"
              pagination={false}
              dataSource={detailModal.logistics ?? []}
              locale={{ emptyText: t('admin.orders.emptyMark') }}
              columns={[
                { title: t('admin.orders.logColCarrier'), dataIndex: 'carrier', render: (v) => v || '—' },
                { title: t('admin.orders.logColTracking'), dataIndex: 'trackingNo' },
                { title: t('admin.orders.logColRemark'), dataIndex: 'remark', ellipsis: true },
                { title: t('admin.orders.logColTime'), dataIndex: 'createdAt', width: 200 },
              ]}
            />

            <Divider />
            <Typography.Title level={5}>{t('admin.orders.detailHistory')}</Typography.Title>
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
          </>
        )}
      </StandardModal>

      <StandardModal
        title={t('admin.orders.status')}
        open={Boolean(statusModal)}
        onCancel={() => {
          setStatusModal(null)
          setNextStatus('')
          setStatusRemark('')
        }}
        cancelButtonProps={{ disabled: statusMut.isPending }}
        footer={(_, { CancelBtn }) => (
          <Flex justify="flex-end" gap="small" wrap="wrap" align="center">
            <Button danger onClick={() => void submitRepairOrder()} loading={statusMut.isPending}>
              {t('admin.orders.repairOrder')}
            </Button>
            <CancelBtn />
            <Button type="primary" loading={statusMut.isPending} onClick={() => void submitSaveStatus()}>
              {t('admin.orders.saveStatus')}
            </Button>
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
