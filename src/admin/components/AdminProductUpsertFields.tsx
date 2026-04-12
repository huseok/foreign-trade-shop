/**
 * 管理端商品新建/编辑共用的表单项（须放在 `<Form>` 内使用）。
 */
import { Checkbox, Form, Input, InputNumber, Space } from 'antd'

export function AdminProductUpsertFields() {
  return (
    <>
      <Form.Item name="title" label="标题" rules={[{ required: true, message: '请填写标题' }]}>
        <Input placeholder="商品名称" />
      </Form.Item>
      <Space wrap style={{ width: '100%' }}>
        <Form.Item name="price" label="价格" rules={[{ required: true, message: '请填写价格' }]}>
          <InputNumber min={0.01} step={0.01} style={{ width: 160 }} />
        </Form.Item>
        <Form.Item name="currency" label="币种" rules={[{ required: true, message: '请填写币种' }]}>
          <Input style={{ width: 120 }} placeholder="USD" />
        </Form.Item>
        <Form.Item name="moq" label="MOQ" rules={[{ required: true, message: '请填写 MOQ' }]}>
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
        <Input.TextArea rows={4} placeholder="可选" />
      </Form.Item>
      <Form.Item name="isActive" valuePropName="checked" label="上架状态">
        <Checkbox>上架（前台可见）</Checkbox>
      </Form.Item>
    </>
  )
}
