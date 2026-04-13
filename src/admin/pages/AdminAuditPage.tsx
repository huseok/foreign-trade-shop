import { Typography } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { useAdminAuditLogs } from '../../hooks/apiHooks'

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
  const { data = [], isLoading } = useAdminAuditLogs()

  const columns: ProColumns<AuditRow>[] = [
    { title: 'ID', dataIndex: 'id', width: 80, search: false },
    { title: '动作', dataIndex: 'actionCode', search: false },
    { title: '实体类型', dataIndex: 'entityType', search: false },
    { title: '实体ID', dataIndex: 'entityId', search: false },
    { title: '操作者', dataIndex: 'actorUserId', width: 100, search: false, render: (_, r) => r.actorUserId ?? '—' },
    { title: '时间', dataIndex: 'createdAt', width: 200, search: false },
  ]

  return (
    <PageContainer title="操作日志" subTitle="记录关键动作与实体变更轨迹，便于审计追溯。">
      <ProTable<AuditRow>
        rowKey="id"
        loading={isLoading}
        search={false}
        options={false}
        columns={columns}
        dataSource={data as AuditRow[]}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        footer={() => (
          <Typography.Text type="secondary">建议后续按 actionCode/entityType 加筛选与导出。</Typography.Text>
        )}
      />
    </PageContainer>
  )
}
