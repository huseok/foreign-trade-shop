/**
 * 管理端订单列表：数据来自 `GET /api/v1/admin/orders`。
 *
 * 提供「前台订单详情」外链（新标签打开）、以及录入物流 / 推进状态的弹窗（对应 PATCH 管理接口）。
 */
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { App, Button, Input, Modal, Space, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import {
  useAdminOrders,
  useAdminUpdateOrderStatus,
  useAdminUpdateOrderTracking,
} from '../../hooks/apiHooks'
import type { components } from '../../generated/voyage-paths'

type OrderRow = components['schemas']['OrderView']

/** 将后端订单状态映射为 Ant Design Tag 的预设颜色 */
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

export function AdminOrdersPage() {
  const { message } = App.useApp()
  const { data: orders = [], isLoading, refetch } = useAdminOrders()
  const trackingMut = useAdminUpdateOrderTracking()
  const statusMut = useAdminUpdateOrderStatus()
  const [trackingModal, setTrackingModal] = useState<OrderRow | null>(null)
  const [trackingNo, setTrackingNo] = useState('')
  const [logisticsCompany, setLogisticsCompany] = useState('')
  const [statusModal, setStatusModal] = useState<OrderRow | null>(null)
  const [nextStatus, setNextStatus] = useState('')

  const columns: ColumnsType<OrderRow> = [
    {
      title: '订单号',
      dataIndex: 'orderNo',
      render: (no: string) => <Typography.Text code>{no}</Typography.Text>,
    },
    {
      title: '状态',
      dataIndex: 'status',
      render: (s: string) => <Tag color={statusColor(s)}>{s}</Tag>,
    },
    {
      title: '金额',
      key: 'amt',
      render: (_, r) => `${r.currency} ${Number(r.totalAmount).toFixed(2)}`,
    },
    {
      title: '收货人',
      dataIndex: 'receiverName',
    },
    {
      title: '运单',
      key: 'track',
      render: (_, r) => r.trackingNo ?? '—',
    },
    {
      title: '操作',
      key: 'actions',
      render: (_, r) => (
        <Space wrap>
          <Link to={`/orders/${encodeURIComponent(r.orderNo)}`} target="_blank" rel="noreferrer">
            前台详情
          </Link>
          <Button type="link" size="small" onClick={() => setTrackingModal(r)}>
            物流
          </Button>
          <Button type="link" size="small" onClick={() => setStatusModal(r)}>
            状态
          </Button>
        </Space>
      ),
    },
  ]

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
      message.warning('请填写目标状态')
      return
    }
    try {
      await statusMut.mutateAsync({
        orderNo: statusModal.orderNo,
        body: { status: nextStatus.trim().toUpperCase() },
      })
      message.success('状态已更新')
      setStatusModal(null)
      setNextStatus('')
      void refetch()
    } catch {
      message.error('更新失败（请检查状态流转是否合法）')
    }
  }

  return (
    <>
      <Typography.Title level={4} style={{ marginTop: 0 }}>
        订单管理
      </Typography.Title>
      <Typography.Paragraph type="secondary">
        数据来自后端 <Typography.Text code>/api/v1/admin/orders</Typography.Text>。
      </Typography.Paragraph>
      <Table<OrderRow>
        rowKey="orderNo"
        loading={isLoading}
        columns={columns}
        dataSource={orders}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />

      <Modal
        title="更新物流"
        open={Boolean(trackingModal)}
        onOk={() => void submitTracking()}
        onCancel={() => {
          setTrackingModal(null)
          setTrackingNo('')
          setLogisticsCompany('')
        }}
        confirmLoading={trackingMut.isPending}
        okButtonProps={{ disabled: trackingMut.isPending }}
        destroyOnHidden
      >
        <Space orientation="vertical" style={{ width: '100%' }}>
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
      </Modal>

      <Modal
        title="推进订单状态"
        open={Boolean(statusModal)}
        onOk={() => void submitStatus()}
        onCancel={() => {
          setStatusModal(null)
          setNextStatus('')
        }}
        confirmLoading={statusMut.isPending}
        okButtonProps={{ disabled: statusMut.isPending }}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
          合法流转示例：PENDING_PAYMENT→PAID→SHIPPED→DELIVERED→COMPLETED
        </Typography.Paragraph>
        <Input
          placeholder="目标状态，如 PAID"
          value={nextStatus}
          onChange={(e) => setNextStatus(e.target.value)}
        />
      </Modal>
    </>
  )
}
