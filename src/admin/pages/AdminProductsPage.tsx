/**
 * 管理端商品：新建表单 + 当前商品表格。
 *
 * 依赖 `useMe` 二次校验 ADMIN（与路由守卫双保险）；创建接口为 `POST /api/v1/admin/products`。
 */
import { useEffect } from 'react'
import { App, Button, Card, Checkbox, Form, Input, InputNumber, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCreateAdminProduct, useMe, useProducts } from '../../hooks/apiHooks'
import type { ProductDto } from '../../types/api'
import { toErrorMessage } from '../../lib/http/error'

export function AdminProductsPage() {
  const { message } = App.useApp()
  const [form] = Form.useForm()
  const { data: me, isLoading: meLoading } = useMe(true)
  const { data: products = [], isLoading: productsLoading } = useProducts()
  const createMutation = useCreateAdminProduct()

  useEffect(() => {
    if (!meLoading && me?.role !== 'ADMIN') {
      message.warning('无管理员权限')
    }
  }, [me, meLoading, message])

  if (meLoading) {
    return <Typography.Paragraph>加载中…</Typography.Paragraph>
  }

  if (me?.role !== 'ADMIN') {
    return (
      <Card>
        <Typography.Title level={4}>无权限</Typography.Title>
        <Typography.Paragraph>请使用 ADMIN 账号从后台入口登录。</Typography.Paragraph>
      </Card>
    )
  }

  const columns: ColumnsType<ProductDto> = [
    { title: 'ID', dataIndex: 'id', width: 72 },
    { title: '标题', dataIndex: 'title' },
    { title: 'SKU', dataIndex: 'skuCode', render: (v) => v ?? '—' },
    {
      title: '价格',
      key: 'price',
      render: (_, r) =>
        r.price == null ? '—' : `${r.currency ?? ''} ${Number(r.price).toFixed(2)}`,
    },
    { title: 'MOQ', dataIndex: 'moq', width: 80 },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 96,
      render: (v: boolean) => (v ? '上架' : '下架'),
    },
  ]

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <Typography.Title level={4} style={{ margin: 0 }}>
        商品管理
      </Typography.Title>

      <Card title="新建商品">
        <Form
          form={form}
          layout="vertical"
          onFinish={async (values) => {
            try {
              const resp = await createMutation.mutateAsync({
                title: values.title.trim(),
                price: values.price,
                currency: String(values.currency).trim().toUpperCase(),
                moq: values.moq,
                description: values.description?.trim() || undefined,
                skuCode: values.skuCode?.trim() || undefined,
                hsCode: values.hsCode?.trim() || undefined,
                unit: values.unit?.trim() || undefined,
                incoterm: values.incoterm?.trim().toUpperCase() || undefined,
                originCountry: values.originCountry?.trim() || undefined,
                leadTimeDays: values.leadTimeDays ?? undefined,
                isActive: Boolean(values.isActive),
              })
              message.success(`已创建，ID=${resp.id}`)
              form.resetFields()
              form.setFieldsValue({ currency: 'USD', moq: 1, isActive: true })
            } catch (err) {
              message.error(toErrorMessage(err, '创建失败'))
            }
          }}
          initialValues={{ currency: 'USD', moq: 1, isActive: true }}
        >
          <Form.Item name="title" label="标题" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Space wrap style={{ width: '100%' }}>
            <Form.Item name="price" label="价格" rules={[{ required: true }]}>
              <InputNumber min={0.01} step={0.01} style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="currency" label="币种" rules={[{ required: true }]}>
              <Input style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="moq" label="MOQ" rules={[{ required: true }]}>
              <InputNumber min={1} style={{ width: 120 }} />
            </Form.Item>
          </Space>
          <Space wrap style={{ width: '100%' }}>
            <Form.Item name="skuCode" label="SKU">
              <Input style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="hsCode" label="HS Code">
              <Input style={{ width: 160 }} />
            </Form.Item>
            <Form.Item name="unit" label="单位">
              <Input placeholder="pcs" style={{ width: 120 }} />
            </Form.Item>
          </Space>
          <Space wrap style={{ width: '100%' }}>
            <Form.Item name="incoterm" label="Incoterm">
              <Input placeholder="FOB" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="originCountry" label="原产国">
              <Input placeholder="CN" style={{ width: 120 }} />
            </Form.Item>
            <Form.Item name="leadTimeDays" label="交期(天)">
              <InputNumber min={0} style={{ width: 120 }} />
            </Form.Item>
          </Space>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="isActive" valuePropName="checked">
            <Checkbox>上架</Checkbox>
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={createMutation.isPending}
              disabled={createMutation.isPending}
            >
              创建
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <Card title="商品列表">
        <Table<ProductDto>
          rowKey="id"
          loading={productsLoading}
          columns={columns}
          dataSource={products}
          pagination={{ pageSize: 10, showSizeChanger: true }}
        />
      </Card>
    </Space>
  )
}
