/**
 * 管理端商品新建/编辑共用的表单项（须放在 `<Form>` 内使用）。
 */
import { Checkbox, Form, Input, InputNumber, Select, Space, Typography } from 'antd'
import { useI18n } from '../../../i18n/I18nProvider'
import { AdminProductImagesField } from './AdminProductImagesField'

type Option = { id: number; name: string }
type Template = { id: number; templateName: string }
type TagOption = { id: number; name: string; code: string; isActive?: boolean }

type Props = {
  categories?: Option[]
  shippingTemplates?: Template[]
  tags?: TagOption[]
}

export function AdminProductUpsertFields({ categories = [], shippingTemplates = [], tags = [] }: Props) {
  const { t } = useI18n()
  return (
    <>
      <Form.Item name="title" label="标题" rules={[{ required: true, message: '请填写标题' }]}>
        <Input placeholder="商品名称" />
      </Form.Item>
      <Space wrap style={{ width: '100%' }}>
        <Form.Item name="price" label="价格（现价）" rules={[{ required: true, message: '请填写价格' }]}>
          <InputNumber min={0.01} step={0.01} style={{ width: 160 }} />
        </Form.Item>
        <Form.Item
          name="listPrice"
          label="划线原价（可选）"
          tooltip="填写且高于现价时，前台活动区等位置显示原价划线 + 现价；留空表示无促销划线价。"
        >
          <InputNumber min={0.01} step={0.01} style={{ width: 160 }} placeholder="无则不填" />
        </Form.Item>
        <Form.Item
          name="costPrice"
          label="成本价（可选）"
          tooltip="内部核算用，不会展示给前台访客；留空表示未录入。"
        >
          <InputNumber min={0} step={0.01} style={{ width: 160 }} placeholder="无则不填" />
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
        <Form.Item name="weightKg" label="重量(kg)">
          <InputNumber min={0} step={0.1} style={{ width: 140 }} />
        </Form.Item>
      </Space>
      <Space wrap style={{ width: '100%' }}>
        <Form.Item name="categoryId" label="分类">
          <Select
            allowClear
            placeholder="选择分类"
            style={{ width: 220 }}
            options={categories.map((c) => ({ value: c.id, label: c.name }))}
          />
        </Form.Item>
        <Form.Item name="shippingTemplateId" label="运费模板">
          <Select
            allowClear
            placeholder="选择模板"
            style={{ width: 260 }}
            options={shippingTemplates.map((tm) => ({ value: tm.id, label: `${tm.id} - ${tm.templateName}` }))}
          />
        </Form.Item>
        <Form.Item name="tagIds" label={t('product.tags')}>
          <Select
            mode="multiple"
            allowClear
            placeholder={t('admin.tags.keywordPh')}
            style={{ minWidth: 280, maxWidth: '100%' }}
            options={tags.map((tg) => ({
              value: tg.id,
              label: `${tg.name} (${tg.code})${tg.isActive === false ? ' [×]' : ''}`,
              disabled: tg.isActive === false,
            }))}
          />
        </Form.Item>
      </Space>
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        属性矩阵（SKU 规格组合）下一阶段将接入独立 SKU 管理页；当前先保证商品主档字段完整。
      </Typography.Text>
      <AdminProductImagesField />
      <Form.Item name="description" label="描述">
        <Input.TextArea rows={4} placeholder="可选" />
      </Form.Item>
      <Form.Item name="isActive" valuePropName="checked" label="上架状态">
        <Checkbox>上架（前台可见）</Checkbox>
      </Form.Item>
    </>
  )
}
