import { Card, Table, Typography } from 'antd'
import { useAdminAuditLogs } from '../../hooks/apiHooks'
import { AdminPageHeader } from '../components/AdminPageHeader'

/**
 * 审计日志页：用于追踪关键操作。
 */
export function AdminAuditPage() {
  const { data = [], isLoading } = useAdminAuditLogs()
  return (
    <Card>
      <AdminPageHeader title="操作日志" description="记录关键动作与实体变更轨迹，便于审计追溯。" />
      <Table
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        columns={[
          { title: 'ID', dataIndex: 'id', width: 80 },
          { title: '动作', dataIndex: 'actionCode' },
          { title: '实体类型', dataIndex: 'entityType' },
          { title: '实体ID', dataIndex: 'entityId' },
          { title: '操作者', dataIndex: 'actorUserId', render: (v) => v ?? '-' },
          { title: '时间', dataIndex: 'createdAt' },
        ]}
        pagination={{ pageSize: 20 }}
      />
      <Typography.Text type="secondary">建议后续按 actionCode/entityType 加筛选与导出。</Typography.Text>
    </Card>
  )
}
