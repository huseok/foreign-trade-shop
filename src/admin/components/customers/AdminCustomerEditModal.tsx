/**
 * 后台编辑客户弹窗：维护 [CustomerAdminUpdateRequest] 对应的「运营备注」「客户偏好」文本。
 *
 * - 与列表页解耦，便于单独复用（例如将来客户详情页）。
 * - 提交成功后由父组件负责作废 `adminCustomers` 查询缓存。
 */
import { App, Form, Input } from 'antd'
import { useEffect } from 'react'
import { useAdminPatchCustomer } from '../../../hooks/apiHooks'
import { useI18n } from '../../../i18n/useI18n'
import { i18nTpl } from '../../../lib/i18nTpl'
import { asRcFormInstance } from '../../../lib/formAntdCompat'
import { toErrorMessage } from '../../../lib/http/error'
import type { components } from '../../../generated/voyage-paths'
import { getAdminModalContainer } from '../../adminModalRoot'
import { StandardModal } from '../shared/StandardModal'

type Row = components['schemas']['CustomerAdminView']

type FormValues = {
  adminNote: string
  preferences: string
}

type Props = {
  /** 弹窗是否展示；为 false 时不发请求。 */
  open: boolean
  /** 当前行；关闭时可由父组件置空。 */
  record: Row | null
  onClose: () => void
  /** 保存成功后的回调（例如 `invalidateQueries`）。 */
  onSaved: () => void
}

export function AdminCustomerEditModal({ open, record, onClose, onSaved }: Props) {
  const { t } = useI18n()
  const { message } = App.useApp()
  const [form] = Form.useForm<FormValues>()
  const rf = asRcFormInstance(form)
  const patchMut = useAdminPatchCustomer()

  useEffect(() => {
    if (!open || !record) return
    rf.setFieldsValue({
      adminNote: record.adminNote ?? '',
      preferences: record.preferences ?? '',
    })
  }, [open, record, rf])

  const handleOk = async () => {
    if (!record) return
    try {
      const v = await rf.validateFields()
      await patchMut.mutateAsync({
        id: record.id,
        body: {
          adminNote: v.adminNote.trim(),
          preferences: v.preferences.trim(),
        },
      })
      message.success(t('admin.customers.editSaved'))
      onSaved()
      onClose()
    } catch (e) {
      if (e && typeof e === 'object' && 'errorFields' in e) return
      message.error(toErrorMessage(e, t('admin.customers.editSaveFail')))
    }
  }

  return (
    <StandardModal
      title={record ? i18nTpl(t('admin.customers.editTitle'), { id: String(record.id) }) : ''}
      open={open && Boolean(record)}
      onCancel={() => {
        rf.resetFields()
        onClose()
      }}
      onOk={() => void handleOk()}
      confirmLoading={patchMut.isPending}
      okText={t('admin.customers.editSave')}
      cancelText={t('admin.customers.editCancel')}
      destroyOnClose
      width={560}
      getContainer={getAdminModalContainer}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item
          name="adminNote"
          label={t('admin.customers.fieldAdminNote')}
          rules={[{ max: 2000, message: t('admin.customers.fieldTooLong') }]}
        >
          <Input.TextArea rows={4} placeholder={t('admin.customers.adminNotePh')} allowClear />
        </Form.Item>
        <Form.Item
          name="preferences"
          label={t('admin.customers.fieldPreferences')}
          rules={[{ max: 4000, message: t('admin.customers.fieldTooLong') }]}
        >
          <Input.TextArea rows={5} placeholder={t('admin.customers.preferencesPh')} allowClear />
        </Form.Item>
      </Form>
    </StandardModal>
  )
}
