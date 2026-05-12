/**
 * 管理端商品新建/编辑共用的表单项（须放在 `<Form>` 内使用）。
 * 分区展示；重量与运费模板为必填（与后端 `ProductService.validateAdminPhysical` 一致）。
 */
import { Alert, Checkbox, Collapse, Form, Input, InputNumber, Select, Space, Typography } from 'antd'
import { Link } from 'react-router-dom'
import { useI18n } from '../../../i18n/I18nProvider'
import { AdminProductImagesField } from './AdminProductImagesField'

type Option = { id: number; name: string }
type Template = { id: number; templateName: string }
type TagOption = { id: number; name: string; code: string; isActive?: boolean }

type Props = {
  categories?: Option[]
  shippingTemplates?: Template[]
  tags?: TagOption[]
  /** 已存在商品 id 时展示「规格矩阵」入口 */
  productId?: number
}

export function AdminProductUpsertFields({
  categories = [],
  shippingTemplates = [],
  tags = [],
  productId,
}: Props) {
  const { t } = useI18n()
  return (
    <Collapse
      bordered={false}
      defaultActiveKey={['basic', 'pricing', 'trade', 'logistics', 'media', 'publish']}
      style={{ background: 'transparent' }}
    >
      <Collapse.Panel header={t('admin.products.sectionBasic')} key="basic">
        <Form.Item name="title" label="标题" rules={[{ required: true, message: '请填写标题' }]}>
          <Input placeholder="商品名称" />
        </Form.Item>
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
      </Collapse.Panel>

      <Collapse.Panel header={t('admin.products.sectionPricing')} key="pricing">
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
      </Collapse.Panel>

      <Collapse.Panel header={t('admin.products.sectionTrade')} key="trade">
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
      </Collapse.Panel>

      <Collapse.Panel header={t('admin.products.sectionLogistics')} key="logistics">
        <Space wrap style={{ width: '100%' }} align="start">
          <Form.Item
            name="weightKg"
            label="重量(kg)"
            rules={[
              { required: true, message: t('admin.products.weightRequired') },
              {
                type: 'number',
                min: 0.01,
                message: t('admin.products.weightMin'),
              },
            ]}
          >
            <InputNumber min={0.01} step={0.01} style={{ width: 160 }} placeholder="0.01" />
          </Form.Item>
          <Form.Item name="categoryId" label="分类">
            <Select
              allowClear
              placeholder="选择分类"
              style={{ width: 220 }}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
            />
          </Form.Item>
          <Form.Item
            name="shippingTemplateId"
            label="运费模板"
            rules={[{ required: true, message: t('admin.products.templateRequired') }]}
          >
            <Select
              placeholder={t('admin.products.templatePlaceholder')}
              style={{ width: 280 }}
              options={shippingTemplates.map((tm) => ({ value: tm.id, label: `${tm.id} - ${tm.templateName}` }))}
            />
          </Form.Item>
          <Form.Item name="tagIds" label={t('product.tags')} style={{ minWidth: 280 }}>
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
        {productId != null && Number.isFinite(productId) && productId > 0 && (
          <Alert
            type="info"
            showIcon
            style={{ marginTop: 8 }}
            message={
              <span>
                {t('admin.products.skuMatrixHint')}{' '}
                <Link to={`/admin/products/${productId}/sku-matrix`}>{t('admin.products.skuMatrixLink')}</Link>
              </span>
            }
          />
        )}
      </Collapse.Panel>

      <Collapse.Panel header={t('admin.products.sectionMedia')} key="media">
        <AdminProductImagesField />
        <Form.Item name="description" label="描述">
          <Input.TextArea rows={4} placeholder="可选" />
        </Form.Item>
      </Collapse.Panel>

      <Collapse.Panel header={t('admin.products.sectionPublish')} key="publish">
        <Form.Item name="isActive" valuePropName="checked" label="上架状态">
          <Checkbox>上架（前台可见）</Checkbox>
        </Form.Item>
        <Typography.Text type="secondary" style={{ display: 'block' }}>
          {t('admin.products.physicalHint')}
        </Typography.Text>
      </Collapse.Panel>
    </Collapse>
  )
}
