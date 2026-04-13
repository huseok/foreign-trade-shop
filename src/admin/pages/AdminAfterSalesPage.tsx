/**
 * 管理端售后工单列表；数据来自 `GET /api/v1/admin/after-sales`。
 *
 * 支持通过弹窗调用 `PATCH .../admin/after-sales/{id}/status` 更新状态。
 */
import { useState } from 'react'
import { App, Button, Input, Modal, Space, Tag, Typography } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { useAdminAfterSales, useAdminUpdateAfterSaleStatus } from '../../hooks/apiHooks'
import type { components } from '../../generated/voyage-paths'

type Row = components['schemas']['AfterSaleView']

export function AdminAfterSalesPage() {
  const { message } = App.useApp()
  const { data: rows = [], isLoading, refetch } = useAdminAfterSales()
  const statusMut = useAdminUpdateAfterSaleStatus()
  const [modal, setModal] = useState<Row | null>(null)
  const [status, setStatus] = useState('')

  const columns: ProColumns<Row>[] = [
    { title: 'ID', dataIndex: 'id', width: 80, search: false },
    { title: '订单号', dataIndex: 'orderNo', search: false },
    {
      title: '状态',
      dataIndex: 'status',
      search: false,
      render: (_, r) => <Tag>{r.status}</Tag>,
    },
    { title: '内容', dataIndex: 'content', ellipsis: true, search: false },
    {
      title: '操作',
      key: 'act',
      width: 120,
      search: false,
      render: (_, r) => (
        <Button type="link" size="small" onClick={() => setModal(r)}>
          更新状态
        </Button>
      ),
    },
  ]

  const submit = async () => {
    if (!modal || !status.trim()) {
      message.warning('请填写状态')
      return
    }
    try {
      await statusMut.mutateAsync({ id: modal.id, body: { status: status.trim() } })
      message.success('已更新')
      setModal(null)
      setStatus('')
      void refetch()
    } catch {
      message.error('更新失败')
    }
  }

  return (
    <PageContainer title="售后工单" subTitle="数据来自 /api/v1/admin/after-sales">
      <ProTable<Row>
        rowKey="id"
        loading={isLoading}
        search={false}
        options={false}
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />
      <Modal
        title="更新售后状态"
        open={Boolean(modal)}
        onOk={() => void submit()}
        onCancel={() => {
          setModal(null)
          setStatus('')
        }}
        confirmLoading={statusMut.isPending}
        okButtonProps={{ disabled: statusMut.isPending }}
        destroyOnClose
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Typography.Text type="secondary">工单 #{modal?.id}</Typography.Text>
          <Input placeholder="新状态" value={status} onChange={(e) => setStatus(e.target.value)} />
        </Space>
      </Modal>
    </PageContainer>
  )
}
