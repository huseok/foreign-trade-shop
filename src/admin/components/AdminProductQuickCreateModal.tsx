/**
 * 快捷新建商品：字段与完整表单一致（分类、运费、规格文案等），体积用宽 Modal + 滚动承载。
 */
import { App, Form } from 'antd'
import {
  useAdminTags,
  useCategories,
  useCreateAdminProduct,
  useShippingTemplates,
} from '../../hooks/apiHooks'
import { useI18n } from '../../i18n/I18nProvider'
import { toErrorMessage } from '../../lib/http/error'
import { asRcFormInstance } from '../../lib/formAntdCompat'
import {
  adminProductFormValuesToPayload,
  type AdminProductFormValues,
} from '../lib/adminProductFormPayload'
import { AdminProductUpsertFields } from './AdminProductUpsertFields'
import { StandardModal } from './StandardModal'

type Props = {
  open: boolean
  onClose: () => void
}

export function AdminProductQuickCreateModal({ open, onClose }: Props) {
  const { message } = App.useApp()
  const { t } = useI18n()
  const [form] = Form.useForm<AdminProductFormValues>()
  const rfForm = asRcFormInstance(form)
  const createMut = useCreateAdminProduct()
  const { data: categories = [] } = useCategories()
  const { data: shippingTemplates = [] } = useShippingTemplates()
  const { data: tagList = [] } = useAdminTags({ enabled: open })

  const submit = async () => {
    try {
      const v = await rfForm.validateFields()
      const payload = adminProductFormValuesToPayload(v)
      await createMut.mutateAsync(payload)
      message.success(t('admin.products.createOk'))
      rfForm.resetFields()
      onClose()
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return
      message.error(toErrorMessage(err, t('admin.products.createFail')))
    }
  }

  return (
    <StandardModal
      title={t('admin.products.quickCreate')}
      open={open}
      onCancel={() => {
        rfForm.resetFields()
        onClose()
      }}
      width={920}
      destroyOnClose
      okText={t('admin.products.modalOk')}
      cancelText={t('admin.products.modalCancel')}
      confirmLoading={createMut.isPending}
      onOk={() => void submit()}
      maskClosable={false}
      styles={{ body: { maxHeight: 'calc(100vh - 220px)', overflowY: 'auto', paddingTop: 12 } }}
    >
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
    </StandardModal>
  )
}
