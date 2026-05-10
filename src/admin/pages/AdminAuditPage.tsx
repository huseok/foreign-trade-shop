import { Typography } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { useAdminAuditLogs } from '../../hooks/apiHooks'
import { useI18n } from '../../i18n/I18nProvider'

type AuditRow = {
  id: number
  actorUserId?: number
  actorRole?: string
  actionCode: string
  entityType: string
  entityId: string
  detailJson?: string
  createdAt: string
}

/**
 * 审计日志页：用于追踪关键操作。
 */
export function AdminAuditPage() {
  const { t } = useI18n()
  const { data = [], isLoading } = useAdminAuditLogs()

  const columns: ProColumns<AuditRow>[] = [
    { title: t('admin.audit.colId'), dataIndex: 'id', width: 80, search: false },
    { title: t('admin.audit.colAction'), dataIndex: 'actionCode', search: false },
    { title: t('admin.audit.colEntityType'), dataIndex: 'entityType', search: false },
    { title: t('admin.audit.colEntityId'), dataIndex: 'entityId', search: false },
    {
      title: t('admin.audit.colActor'),
      dataIndex: 'actorUserId',
      width: 100,
      search: false,
      render: (_, r) => r.actorUserId ?? '—',
    },
    { title: t('admin.audit.colTime'), dataIndex: 'createdAt', width: 200, search: false },
  ]

  return (
    <PageContainer title={t('admin.audit.title')} subTitle={t('admin.audit.subtitle')}>
      <ProTable<AuditRow>
        rowKey="id"
        loading={isLoading}
        search={false}
        options={false}
        columns={columns}
        dataSource={data as AuditRow[]}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        footer={() => <Typography.Text type="secondary">{t('admin.audit.footerHint')}</Typography.Text>}
      />
    </PageContainer>
  )
}
