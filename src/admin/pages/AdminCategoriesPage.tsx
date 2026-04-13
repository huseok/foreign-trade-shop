import { App, Button, Card, Form, Input, InputNumber, Modal, Popconfirm, Space, Switch, Table, Typography } from 'antd'
import { useMemo, useState } from 'react'
import { AdminPageHeader } from '../components/AdminPageHeader'
import { useAdminCreateCategory, useAdminDeleteCategory, useAdminUpdateCategory, useCategories } from '../../hooks/apiHooks'

/**
 * 分类管理页：支持查看分类与新增分类。
 */
export function AdminCategoriesPage() {
  const { message } = App.useApp()
  const { data = [], isLoading } = useCategories()
  const createMut = useAdminCreateCategory()
  const updateMut = useAdminUpdateCategory()
  const deleteMut = useAdminDeleteCategory()
  const [form] = Form.useForm()
  const [editing, setEditing] = useState<{ id: number; name: string; code: string; sortNo: number; isActive: boolean } | null>(null)
  const [keyword, setKeyword] = useState('')

  const onFinish = async (values: { name: string; code: string; sortNo?: number; isActive?: boolean }) => {
    try {
      await createMut.mutateAsync(values)
      message.success('分类已创建')
      form.resetFields()
    } catch {
      message.error('创建失败，请检查字段后重试')
    }
  }
  const filtered = useMemo(
    () => data.filter((x) => `${x.name} ${x.code}`.toLowerCase().includes(keyword.trim().toLowerCase())),
    [data, keyword]
  )
  const [editForm] = Form.useForm()

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <AdminPageHeader title="分类管理" description="用于维护前台分类树与筛选目录，编码建议使用稳定英文大写。" />
      <Card title="新增分类">
        <Form form={form} layout="inline" onFinish={(v) => void onFinish(v)}>
          <Form.Item name="name" rules={[{ required: true, message: '请输入分类名称' }, { min: 2, message: '至少2个字符' }]}><Input placeholder="分类名称" /></Form.Item>
          <Form.Item name="code" rules={[{ required: true, message: '请输入分类编码' }, { pattern: /^[A-Z0-9_]+$/, message: '仅支持大写字母/数字/下划线' }]}><Input placeholder="分类编码" /></Form.Item>
          <Form.Item name="sortNo" initialValue={0}><InputNumber placeholder="排序" /></Form.Item>
          <Form.Item name="isActive" initialValue={true} valuePropName="checked"><Switch checkedChildren="启用" unCheckedChildren="停用" /></Form.Item>
          <Button type="primary" htmlType="submit" loading={createMut.isPending}>创建</Button>
        </Form>
      </Card>
      <Card title="分类列表">
        <Input
          allowClear
          placeholder="按名称或编码筛选"
          style={{ maxWidth: 320, marginBottom: 12 }}
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={filtered}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 80 },
            { title: '名称', dataIndex: 'name' },
            { title: '编码', dataIndex: 'code' },
            { title: '父级', dataIndex: 'parentId', render: (v) => v ?? '-' },
            { title: '排序', dataIndex: 'sortNo' },
            { title: '状态', dataIndex: 'isActive', render: (v) => (v ? '启用' : '停用') },
            {
              title: '操作',
              key: 'actions',
              render: (_, row) => (
                <Space>
                  <Button
                    type="link"
                    onClick={() => {
                      setEditing(row)
                      editForm.setFieldsValue(row)
                    }}
                  >
                    编辑
                  </Button>
                  <Popconfirm
                    title="确认删除该分类？"
                    onConfirm={async () => {
                      try {
                        await deleteMut.mutateAsync(row.id)
                        message.success('已删除')
                      } catch {
                        message.error('删除失败')
                      }
                    }}
                  >
                    <Button danger type="link">
                      删除
                    </Button>
                  </Popconfirm>
                </Space>
              ),
            },
          ]}
          pagination={false}
        />
        <Typography.Text type="secondary">用于前台分类树和筛选区域。当前共 {filtered.length} 条。</Typography.Text>
      </Card>
      <Modal
        title="编辑分类"
        open={Boolean(editing)}
        onCancel={() => setEditing(null)}
        onOk={() => void editForm.submit()}
        confirmLoading={updateMut.isPending}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={async (values) => {
            if (!editing) return
            try {
              await updateMut.mutateAsync({ id: editing.id, ...values })
              message.success('分类已更新')
              setEditing(null)
            } catch {
              message.error('更新失败')
            }
          }}
        >
          <Form.Item name="name" label="分类名称" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="code" label="分类编码" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="sortNo" label="排序"><InputNumber /></Form.Item>
          <Form.Item name="isActive" label="启用" valuePropName="checked"><Switch /></Form.Item>
        </Form>
      </Modal>
    </Space>
  )
}
