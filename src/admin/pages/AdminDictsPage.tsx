import { App, Button, Card, Form, Input, Space, Table, Typography } from 'antd'
import { useAdminCreateDictItem, useAdminCreateDictType, useDictTypes } from '../../hooks/apiHooks'
import { AdminPageHeader } from '../components/AdminPageHeader'

/**
 * 字典管理页：字典类型与字典项的新增入口。
 */
export function AdminDictsPage() {
  const { message } = App.useApp()
  const { data = [], isLoading } = useDictTypes()
  const createType = useAdminCreateDictType()
  const createItem = useAdminCreateDictItem()

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <AdminPageHeader title="字典管理" description="维护业务状态字典，减少前后端硬编码枚举分散。" />
      <Card title="新增字典类型">
        <Form
          layout="inline"
          onFinish={async (v: { dictCode: string; dictName: string }) => {
            try {
              await createType.mutateAsync(v)
              message.success('字典类型已创建')
            } catch {
              message.error('创建失败，请检查编码是否重复')
            }
          }}
        >
          <Form.Item name="dictCode" rules={[{ required: true }, { pattern: /^[A-Z0-9_]+$/, message: '仅支持大写编码' }]}><Input placeholder="如 ORDER_STATUS" /></Form.Item>
          <Form.Item name="dictName" rules={[{ required: true }]}><Input placeholder="显示名称" /></Form.Item>
          <Button type="primary" htmlType="submit" loading={createType.isPending}>创建</Button>
        </Form>
      </Card>
      <Card title="新增字典项">
        <Form
          layout="inline"
          onFinish={async (v: { dictCode: string; itemCode: string; itemLabel: string; sortNo?: number }) => {
            try {
              await createItem.mutateAsync(v)
              message.success('字典项已创建')
            } catch {
              message.error('字典项创建失败')
            }
          }}
        >
          <Form.Item name="dictCode" rules={[{ required: true }]}><Input placeholder="字典编码" /></Form.Item>
          <Form.Item name="itemCode" rules={[{ required: true }]}><Input placeholder="项编码" /></Form.Item>
          <Form.Item name="itemLabel" rules={[{ required: true }]}><Input placeholder="项名称" /></Form.Item>
          <Button type="primary" htmlType="submit" loading={createItem.isPending}>创建</Button>
        </Form>
      </Card>
      <Card title="字典类型列表">
        <Table
          rowKey="dictCode"
          loading={isLoading}
          dataSource={data}
          columns={[
            { title: '字典编码', dataIndex: 'dictCode' },
            { title: '字典名称', dataIndex: 'dictName' },
          ]}
          pagination={false}
        />
        <Typography.Text type="secondary">字典项查询接口：/api/v1/dicts/{'{dictCode}'}/items</Typography.Text>
      </Card>
    </Space>
  )
}
