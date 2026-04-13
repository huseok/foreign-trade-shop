import { App, Button, Card, Form, Input, InputNumber, Popconfirm, Select, Space, Table } from 'antd'
import { useState } from 'react'
import { AdminPageHeader } from '../components/AdminPageHeader'
import {
  useAdminCreateShippingRule,
  useAdminCreateShippingTemplate,
  useAdminDeleteShippingRule,
  useShippingTemplateRules,
  useShippingTemplates,
} from '../../hooks/apiHooks'

/**
 * 运费模板管理：模板创建 + 规则创建（按重量计费）。
 */
export function AdminShippingPage() {
  const { message } = App.useApp()
  const { data = [], isLoading } = useShippingTemplates()
  const createTpl = useAdminCreateShippingTemplate()
  const createRule = useAdminCreateShippingRule()
  const deleteRule = useAdminDeleteShippingRule()
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>(undefined)
  const { data: rules = [], refetch: refetchRules } = useShippingTemplateRules(selectedTemplateId)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <AdminPageHeader title="运费模板" description="按模板配置运费策略，商品通过模板ID绑定计费规则。" />
      <Card title="新增运费模板">
        <Form
          layout="inline"
          onFinish={async (v: { templateName: string; billingMode: string }) => {
            try {
              await createTpl.mutateAsync(v)
              message.success('模板已创建')
            } catch {
              message.error('模板创建失败')
            }
          }}
        >
          <Form.Item name="templateName" rules={[{ required: true, message: '请输入模板名称' }]}><Input placeholder="模板名称" /></Form.Item>
          <Form.Item name="billingMode" initialValue="BY_WEIGHT"><Select style={{ width: 160 }} options={[{ value: 'BY_WEIGHT' }, { value: 'FLAT' }]} /></Form.Item>
          <Button type="primary" htmlType="submit" loading={createTpl.isPending}>创建模板</Button>
        </Form>
      </Card>
      <Card title="新增模板规则">
        <Form
          layout="inline"
          onFinish={async (v: {
            templateId: number
            firstWeightKg: number
            firstFee: number
            additionalWeightKg: number
            additionalFee: number
            regionCode?: string
          }) => {
            try {
              await createRule.mutateAsync(v)
              message.success('规则已创建')
            } catch {
              message.error('规则创建失败')
            }
          }}
        >
          <Form.Item name="templateId" rules={[{ required: true }]}>
            <Select
              style={{ width: 220 }}
              placeholder="选择模板"
              options={data.map((x) => ({ value: x.id, label: `${x.id} - ${x.templateName}` }))}
              onChange={(value) => setSelectedTemplateId(value)}
            />
          </Form.Item>
          <Form.Item name="firstWeightKg" rules={[{ required: true }]}><InputNumber placeholder="首重kg" min={0} /></Form.Item>
          <Form.Item name="firstFee" rules={[{ required: true }]}><InputNumber placeholder="首费" min={0} /></Form.Item>
          <Form.Item name="additionalWeightKg" rules={[{ required: true }]}><InputNumber placeholder="续重kg" min={0.001} step={0.1} /></Form.Item>
          <Form.Item name="additionalFee" rules={[{ required: true }]}><InputNumber placeholder="续费" min={0} /></Form.Item>
          <Form.Item name="regionCode" initialValue="GLOBAL"><Input placeholder="区域" /></Form.Item>
          <Button type="primary" htmlType="submit" loading={createRule.isPending}>创建规则</Button>
        </Form>
      </Card>
      <Card title="模板列表">
        <Table
          rowKey="id"
          loading={isLoading}
          dataSource={data}
          columns={[
            { title: 'ID', dataIndex: 'id', width: 80 },
            { title: '模板名', dataIndex: 'templateName' },
            { title: '计费模式', dataIndex: 'billingMode' },
            { title: '状态', dataIndex: 'isActive', render: (v) => (v ? '启用' : '停用') },
          ]}
          pagination={false}
        />
      </Card>
      <Card title="模板规则列表（选择模板后展示）">
        <Table
          rowKey="id"
          dataSource={rules}
          columns={[
            { title: '规则ID', dataIndex: 'id', width: 90 },
            { title: '区域', dataIndex: 'regionCode' },
            { title: '首重kg', dataIndex: 'firstWeightKg' },
            { title: '首费', dataIndex: 'firstFee' },
            { title: '续重kg', dataIndex: 'additionalWeightKg' },
            { title: '续费', dataIndex: 'additionalFee' },
            {
              title: '操作',
              key: 'actions',
              render: (_, row) => (
                <Popconfirm
                  title="确认删除该规则？"
                  onConfirm={async () => {
                    try {
                      await deleteRule.mutateAsync(row.id)
                      message.success('规则已删除')
                      void refetchRules()
                    } catch {
                      message.error('删除失败')
                    }
                  }}
                >
                  <Button type="link" danger>
                    删除
                  </Button>
                </Popconfirm>
              ),
            },
          ]}
          pagination={false}
        />
      </Card>
    </Space>
  )
}
