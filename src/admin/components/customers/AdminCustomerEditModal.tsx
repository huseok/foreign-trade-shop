/**
 * 后台编辑客户弹窗：维护 [CustomerAdminUpdateRequest] 对应的「运营备注」「客户偏好」；
 * 另含「重置密码」：二次确认后调用接口，可选手工输入新密码，留空则服务端使用该客户邮箱作为新密码。
 *
 * - 提交备注成功后由父组件负责作废 `adminCustomers` 查询缓存。
 * - 重置密码成功后会额外作废订单列表缓存（同一用户订单可能涉及运营视图）。
 */
import { App, Alert, Button, Divider, Form, Input, Space, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useAdminPatchCustomer, useAdminResetCustomerPassword } from '../../../hooks/apiHooks'
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
  const { message, modal } = App.useApp()
  const [form] = Form.useForm<FormValues>()
  const rf = asRcFormInstance(form)
  const patchMut = useAdminPatchCustomer()
  const resetPwdMut = useAdminResetCustomerPassword()
  const [newPasswordDraft, setNewPasswordDraft] = useState('')

  useEffect(() => {
    if (!open || !record) return
    rf.setFieldsValue({
      adminNote: record.adminNote ?? '',
      preferences: record.preferences ?? '',
    })
    setNewPasswordDraft('')
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

  const openResetPasswordFlow = () => {
    if (!record) return
    const trimmed = newPasswordDraft.trim()
    const body = trimmed ? { newPassword: trimmed } : {}
    modal.confirm({
      title: t('admin.customers.resetPwdConfirmTitle'),
      content: (
        <div>
          <p style={{ marginBottom: 8 }}>{t('admin.customers.resetPwdConfirmDesc')}</p>
          <p style={{ marginBottom: 0 }}>
            {i18nTpl(t('admin.customers.resetPwdConfirmEmailFallback'), { email: record.email })}
          </p>
        </div>
      ),
      okText: t('admin.customers.resetPwd'),
      okType: 'danger',
      cancelText: t('admin.customers.editCancel'),
      onOk: () =>
        new Promise<void>((resolve, reject) => {
          modal.confirm({
            title: t('admin.customers.resetPwdConfirmSecondTitle'),
            content: trimmed
              ? t('admin.customers.resetPwdConfirmSecondDescManual')
              : i18nTpl(t('admin.customers.resetPwdConfirmSecondDescEmail'), { email: record.email }),
            okText: t('admin.customers.resetPwd'),
            okType: 'danger',
            cancelText: t('admin.customers.editCancel'),
            onOk: async () => {
              try {
                const res = await resetPwdMut.mutateAsync({ id: record.id, body })
                modal.success({
                  title: t('admin.customers.resetPwdResultTitle'),
                  width: 480,
                  content: (
                    <div>
                      <Typography.Paragraph type="secondary" style={{ marginBottom: 12 }}>
                        {t('admin.customers.resetPwdResultDesc')}
                      </Typography.Paragraph>
                      <Typography.Paragraph copyable={{ text: res.temporaryPassword }} code style={{ marginBottom: 0 }}>
                        {res.temporaryPassword}
                      </Typography.Paragraph>
                    </div>
                  ),
                })
                setNewPasswordDraft('')
                onSaved()
                resolve()
              } catch (err) {
                message.error(toErrorMessage(err, t('admin.customers.resetFail')))
                reject(err)
              }
            },
            onCancel: () => reject(new Error('cancel')),
          })
        }),
    })
  }

  return (
    <StandardModal
      title={record ? i18nTpl(t('admin.customers.editTitle'), { id: String(record.id) }) : ''}
      open={open && Boolean(record)}
      onCancel={() => {
        rf.resetFields()
        setNewPasswordDraft('')
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
        <Divider plain>{t('admin.customers.resetPwdSectionTitle')}</Divider>
        <Alert
          type="warning"
          showIcon
          style={{ marginBottom: 12 }}
          message={t('admin.customers.resetPwdHintTitle')}
          description={i18nTpl(t('admin.customers.resetPwdHintBody'), { email: record?.email ?? '—' })}
        />
        <Space direction="vertical" style={{ width: '100%' }} size={8}>
          <Input.Password
            autoComplete="new-password"
            value={newPasswordDraft}
            onChange={(e) => setNewPasswordDraft(e.target.value)}
            placeholder={t('admin.customers.resetPwdPlaceholder')}
            allowClear
          />
          <Button danger loading={resetPwdMut.isPending} onClick={() => void openResetPasswordFlow()}>
            {t('admin.customers.resetPwd')}
          </Button>
        </Space>
      </Form>
    </StandardModal>
  )
}