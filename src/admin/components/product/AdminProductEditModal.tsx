/**
 * 商品列表内编辑：与快捷新建相同的宽 Modal + 滚动，共用 `AdminProductUpsertFields`。
 */
import { useEffect } from 'react'
import { App, Alert, Form, Spin } from 'antd'
import {
  useAdminProductDetail,
  useAdminTags,
  useCategories,
  useShippingTemplates,
  useUpdateAdminProduct,
} from '../../../hooks/apiHooks'
import { useI18n } from '../../../i18n/I18nProvider'
import { i18nTpl } from '../../../lib/i18nTpl'
import { asRcFormInstance } from '../../../lib/formAntdCompat'
import { toErrorMessage } from '../../../lib/http/error'
import {
  adminProductFormValuesToPayload,
  productDtoToAdminFormValues,
  type AdminProductFormValues,
} from '../../lib/adminProductFormPayload'
import { AdminProductUpsertFields } from './AdminProductUpsertFields'
import { StandardModal } from '../shared/StandardModal'

type Props = {
  productId: number | null
  onClose: () => void
}

export function AdminProductEditModal({ productId, onClose }: Props) {
  const open = productId != null
  const { t } = useI18n()
  const { message } = App.useApp()
  const [form] = Form.useForm<AdminProductFormValues>()
  const rfForm = asRcFormInstance(form)

  const detailId = open && productId != null ? productId : undefined
  const { data: product, isLoading, isError } = useAdminProductDetail(detailId)
  const updateMutation = useUpdateAdminProduct()
  const { data: categories = [] } = useCategories()
  const { data: shippingTemplates = [] } = useShippingTemplates()
  const { data: tagList = [] } = useAdminTags({ enabled: open })

  useEffect(() => {
    if (!open) {
      rfForm.resetFields()
      return
    }
    if (product) {
      rfForm.setFieldsValue(productDtoToAdminFormValues(product))
    }
  }, [open, product, rfForm])

  const submit = async () => {
    const id = product?.id ?? productId
    if (id == null) return
    try {
      const v = await rfForm.validateFields()
      await updateMutation.mutateAsync({
        id,
        payload: adminProductFormValuesToPayload(v),
      })
      message.success(t('admin.productsList.editSaved'))
      rfForm.resetFields()
      onClose()
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      message.error(toErrorMessage(err, t('admin.productsList.editSaveFail')))
    }
  }

  const canEdit = Boolean(product) && !isLoading && !isError

  return (
    <StandardModal
      title={productId != null ? i18nTpl(t('admin.productsList.editDrawerTitle'), { id: productId }) : ''}
      open={open}
      width={920}
      destroyOnClose
      mask={false}
      maskClosable={false}
      okText={t('admin.productsList.editSave')}
      cancelText={t('admin.productsList.editCancel')}
      confirmLoading={updateMutation.isPending}
      okButtonProps={{ disabled: !canEdit || updateMutation.isPending }}
      cancelButtonProps={{ disabled: updateMutation.isPending }}
      onCancel={() => {
        rfForm.resetFields()
        onClose()
      }}
      onOk={() => void submit()}
      styles={{ body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingTop: 12 } }}
    >
      {isError ? (
        <Alert type="error" message={t('admin.productsList.editLoadFail')} showIcon />
      ) : isLoading && !product ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Spin />
        </div>
      ) : (
        <Form<AdminProductFormValues>
          form={form}
          layout="vertical"
          initialValues={{ currency: 'USD', moq: 1, isActive: true, images: [], tagIds: [] }}
        >
          <AdminProductUpsertFields
            categories={categories}
            shippingTemplates={shippingTemplates}
            tags={tagList.map((tg) => ({ id: tg.id, name: tg.name, code: tg.code, isActive: tg.isActive }))}
          />
        </Form>
      )}
    </StandardModal>
  )
}
