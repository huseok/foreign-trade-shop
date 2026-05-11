/**
 * 商品列表右侧编辑抽屉，与完整编辑页共用 `AdminProductUpsertFields`。
 */
import { useEffect } from 'react'
import { App, Alert, Button, Drawer, Form, Space, Spin } from 'antd'
import {
  useAdminProductDetail,
  useAdminTags,
  useCategories,
  useShippingTemplates,
  useUpdateAdminProduct,
} from '../../../hooks/apiHooks'
import { useI18n } from '../../../i18n/I18nProvider'
import { i18nTpl } from '../../../lib/i18nTpl'
import { toErrorMessage } from '../../../lib/http/error'
import {
  adminProductFormValuesToPayload,
  productDtoToAdminFormValues,
  type AdminProductFormValues,
} from '../../lib/adminProductFormPayload'
import { AdminProductUpsertFields } from './AdminProductUpsertFields'

type Props = {
  /** 非空时抽屉打开并加载该商品详情 */
  productId: number | null
  onClose: () => void
}

export function AdminProductEditDrawer({ productId, onClose }: Props) {
  const open = productId != null
  const { t } = useI18n()
  const { message } = App.useApp()
  const [form] = Form.useForm<AdminProductFormValues>()

  const detailId = open && productId != null ? productId : undefined
  const { data: product, isLoading, isError } = useAdminProductDetail(detailId)
  const updateMutation = useUpdateAdminProduct()
  const { data: categories = [] } = useCategories()
  const { data: shippingTemplates = [] } = useShippingTemplates()
  const { data: tagList = [] } = useAdminTags()

  useEffect(() => {
    if (!open) {
      form.resetFields()
      return
    }
    if (product) {
      form.setFieldsValue(productDtoToAdminFormValues(product))
    }
  }, [open, product, form])

  const submitting = updateMutation.isPending

  return (
    <Drawer
      title={
        productId != null ? i18nTpl(t('admin.productsList.editDrawerTitle'), { id: productId }) : ''
      }
      placement="right"
      width={720}
      open={open}
      onClose={onClose}
      destroyOnClose
      styles={{ body: { paddingBottom: 88 } }}
      footer={
        <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
          <Button onClick={onClose} disabled={submitting}>
            {t('admin.productsList.editCancel')}
          </Button>
          <Button type="primary" loading={submitting} onClick={() => form.submit()}>
            {t('admin.productsList.editSave')}
          </Button>
        </Space>
      }
    >
      {isError ? (
        <Alert type="error" message={t('admin.productsList.editLoadFail')} showIcon />
      ) : isLoading && !product ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          disabled={submitting}
          onFinish={async (values: AdminProductFormValues) => {
            const id = product?.id ?? productId
            if (id == null) return
            try {
              await updateMutation.mutateAsync({
                id,
                payload: adminProductFormValuesToPayload(values),
              })
              message.success(t('admin.productsList.editSaved'))
              onClose()
            } catch (err) {
              message.error(toErrorMessage(err, t('admin.productsList.editSaveFail')))
            }
          }}
          initialValues={{ currency: 'USD', moq: 1, isActive: true, images: [], tagIds: [] }}
        >
          <AdminProductUpsertFields
            categories={categories}
            shippingTemplates={shippingTemplates}
            tags={tagList.map((tg) => ({ id: tg.id, name: tg.name, code: tg.code, isActive: tg.isActive }))}
          />
        </Form>
      )}
    </Drawer>
  )
}
