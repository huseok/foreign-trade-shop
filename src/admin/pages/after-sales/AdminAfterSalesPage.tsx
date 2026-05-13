/**
 * 管理端售后工单列表；数据来自 `GET /api/v1/admin/after-sales`。
 *
 * 支持通过弹窗调用 `PATCH .../admin/after-sales/{id}/status` 更新状态。
 */
import { useState } from 'react'
import { App, Button, Input, Space, Tag, Typography } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { useAdminAfterSales, useAdminUpdateAfterSaleStatus } from '../../../hooks/apiHooks'
import type { components } from '../../../generated/voyage-paths'
import { useI18n } from '../../../i18n/useI18n'
import { i18nTpl } from '../../../lib/i18nTpl'
import { StandardModal } from '../../components/shared/StandardModal'

type Row = components['schemas']['AfterSaleView']

export function AdminAfterSalesPage() {
  const { t } = useI18n()
  const { message } = App.useApp()
  const { data: rows = [], isLoading, refetch } = useAdminAfterSales()
  const statusMut = useAdminUpdateAfterSaleStatus()
  const [modal, setModal] = useState<Row | null>(null)
  const [status, setStatus] = useState('')

  const columns: ProColumns<Row>[] = [
    { title: t('admin.afterSales.colId'), dataIndex: 'id', width: 80, search: false },
    { title: t('admin.afterSales.colOrderNo'), dataIndex: 'orderNo', search: false },
    {
      title: t('admin.afterSales.colStatus'),
      dataIndex: 'status',
      search: false,
      render: (_, r) => <Tag>{r.status}</Tag>,
    },
    { title: t('admin.afterSales.colContent'), dataIndex: 'content', ellipsis: true, search: false },
    {
      title: t('admin.afterSales.colActions'),
      key: 'act',
      width: 120,
      search: false,
      render: (_, r) => (
        <Button type="link" size="small" onClick={() => setModal(r)}>
          {t('admin.afterSales.updateStatus')}
        </Button>
      ),
    },
  ]

  const submit = async () => {
    if (!modal || !status.trim()) {
      message.warning(t('admin.afterSales.warnStatus'))
      return
    }
    try {
      await statusMut.mutateAsync({ id: modal.id, body: { status: status.trim() } })
      message.success(t('admin.afterSales.success'))
      setModal(null)
      setStatus('')
      void refetch()
    } catch {
      message.error(t('admin.afterSales.fail'))
    }
  }

  return (
    <PageContainer title={t('admin.afterSales.title')} subTitle={t('admin.afterSales.subtitle')}>
      <ProTable<Row>
        rowKey="id"
        loading={isLoading}
        search={false}
        options={false}
        columns={columns}
        dataSource={rows}
        pagination={{ pageSize: 10, showSizeChanger: true }}
      />
      <StandardModal
        title={t('admin.afterSales.modalTitle')}
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
          <Typography.Text type="secondary">
            {modal ? i18nTpl(t('admin.afterSales.ticketLabel'), { id: String(modal.id) }) : ''}
          </Typography.Text>
          <Input placeholder={t('admin.afterSales.statusPh')} value={status} onChange={(e) => setStatus(e.target.value)} />
        </Space>
      </StandardModal>
    </PageContainer>
  )
}
