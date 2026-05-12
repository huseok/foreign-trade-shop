/**
 * 用户中心-地址管理：增删改、默认地址；字段与订单收货快照对齐（公司/省/市）。
 */
import { App, Button, Card, Form, Input, Modal, Popconfirm, Space, Switch, Table } from 'antd'
import { useEffect, useState } from 'react'
import { UserCenterShell } from '../../../components/UserCenterShell'
import {
  useCreateUserAddress,
  useDeleteUserAddress,
  useSetDefaultUserAddress,
  useUpdateUserAddress,
  useUserAddresses,
} from '../../../hooks/apiHooks'
import type { UserAddressView } from '../../../types/api'
import { useI18n } from '../../../i18n/I18nProvider'

export function UserAddressesPage() {
  const { t } = useI18n()
  const { message } = App.useApp()
  const { data = [], isLoading } = useUserAddresses(true)
  const createMut = useCreateUserAddress()
  const updateMut = useUpdateUserAddress()
  const deleteMut = useDeleteUserAddress()
  const defaultMut = useSetDefaultUserAddress()
  const [editOpen, setEditOpen] = useState(false)
  const [editing, setEditing] = useState<UserAddressView | null>(null)
  const [form] = Form.useForm()
  const [editForm] = Form.useForm()

  useEffect(() => {
    if (!editOpen) return
    if (!editing) return
    editForm.setFieldsValue({
      receiverName: editing.receiverName,
      receiverPhone: editing.receiverPhone,
      receiverCompany: editing.receiverCompany ?? '',
      country: editing.country,
      province: editing.province ?? '',
      city: editing.city ?? '',
      addressLine: editing.addressLine,
      postalCode: editing.postalCode ?? '',
      isDefault: editing.isDefault,
    })
  }, [editOpen, editing, editForm])

  const openEdit = (row: UserAddressView) => {
    setEditing(row)
    setEditOpen(true)
  }

  return (
    <UserCenterShell>
      <h2 className="page-header__title" style={{ fontSize: '1.35rem', marginBottom: 8 }}>
        {t('user.addressesTitle')}
      </h2>
      <p className="page-header__desc">{t('user.addressesDesc')}</p>
      <Card style={{ marginTop: 16 }} title={t('user.addrAdd')}>
        <Form
          form={form}
          layout="vertical"
          style={{ maxWidth: 560 }}
          onFinish={async (v) => {
            try {
              await createMut.mutateAsync({
                receiverName: v.receiverName,
                receiverPhone: v.receiverPhone,
                country: v.country,
                addressLine: v.addressLine,
                receiverCompany: v.receiverCompany || undefined,
                province: v.province || undefined,
                city: v.city || undefined,
                postalCode: v.postalCode || undefined,
                isDefault: !!v.isDefault,
              })
              message.success(t('user.addrAddOk'))
              form.resetFields()
            } catch {
              message.error(t('user.addrAddFail'))
            }
          }}
        >
          <Form.Item name="receiverName" label={t('user.addrReceiver')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="receiverPhone" label={t('user.addrPhone')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="receiverCompany" label={t('user.addrCompany')}>
            <Input />
          </Form.Item>
          <Form.Item name="country" label={t('user.addrCountry')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="province" label={t('user.addrProvince')}>
            <Input />
          </Form.Item>
          <Form.Item name="city" label={t('user.addrCity')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="addressLine" label={t('user.addrLine')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="postalCode" label={t('user.addrPostal')}>
            <Input />
          </Form.Item>
          <Form.Item name="isDefault" valuePropName="checked" initialValue={false}>
            <Switch checkedChildren={t('common.default')} unCheckedChildren={t('common.no')} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={createMut.isPending}>
            {t('user.addrAdd')}
          </Button>
        </Form>
      </Card>
      <Table<UserAddressView>
        style={{ marginTop: 16 }}
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        columns={[
          { title: t('user.addrReceiver'), dataIndex: 'receiverName' },
          { title: t('user.addrPhone'), dataIndex: 'receiverPhone' },
          { title: t('user.addrCompany'), dataIndex: 'receiverCompany', render: (v) => v || '—' },
          { title: t('user.addrCountry'), dataIndex: 'country' },
          { title: t('user.addrProvince'), dataIndex: 'province', render: (v) => v || '—' },
          { title: t('user.addrCity'), dataIndex: 'city', render: (v) => v || '—' },
          { title: t('user.addrLine'), dataIndex: 'addressLine', ellipsis: true },
          { title: t('user.addrPostal'), dataIndex: 'postalCode', render: (v) => v || '—' },
          {
            title: t('user.addrDefault'),
            dataIndex: 'isDefault',
            render: (v: boolean) => (v ? t('common.yes') : t('common.no')),
          },
          {
            title: t('user.addrActions'),
            key: 'actions',
            render: (_, row) => (
              <Space wrap>
                <Button type="link" size="small" onClick={() => openEdit(row)}>
                  {t('user.addrEdit')}
                </Button>
                {!row.isDefault && (
                  <Button
                    type="link"
                    size="small"
                    loading={defaultMut.isPending && defaultMut.variables === row.id}
                    onClick={async () => {
                      try {
                        await defaultMut.mutateAsync(row.id)
                        message.success(t('user.addrDefaultOk'))
                      } catch {
                        message.error(t('user.addrAddFail'))
                      }
                    }}
                  >
                    {t('user.addrSetDefault')}
                  </Button>
                )}
                <Popconfirm
                  title={t('user.addrDelete')}
                  okButtonProps={{ loading: deleteMut.isPending }}
                  onConfirm={async () => {
                    try {
                      await deleteMut.mutateAsync(row.id)
                      message.success(t('user.addrDeleteOk'))
                    } catch {
                      message.error(t('user.addrDeleteFail'))
                    }
                  }}
                >
                  <Button type="link" size="small" danger>
                    {t('user.addrDelete')}
                  </Button>
                </Popconfirm>
              </Space>
            ),
          },
        ]}
        pagination={false}
      />

      <Modal
        title={t('user.addrEdit')}
        open={editOpen}
        onCancel={() => {
          setEditOpen(false)
          setEditing(null)
        }}
        footer={null}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={async (v) => {
            if (!editing) return
            try {
              await updateMut.mutateAsync({
                id: editing.id,
                payload: {
                  receiverName: v.receiverName,
                  receiverPhone: v.receiverPhone,
                  country: v.country,
                  addressLine: v.addressLine,
                  receiverCompany: v.receiverCompany || undefined,
                  province: v.province || undefined,
                  city: v.city || undefined,
                  postalCode: v.postalCode || undefined,
                  isDefault: !!v.isDefault,
                },
              })
              message.success(t('user.addrUpdateOk'))
              setEditOpen(false)
              setEditing(null)
            } catch {
              message.error(t('user.addrUpdateFail'))
            }
          }}
        >
          <Form.Item name="receiverName" label={t('user.addrReceiver')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="receiverPhone" label={t('user.addrPhone')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="receiverCompany" label={t('user.addrCompany')}>
            <Input />
          </Form.Item>
          <Form.Item name="country" label={t('user.addrCountry')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="province" label={t('user.addrProvince')}>
            <Input />
          </Form.Item>
          <Form.Item name="city" label={t('user.addrCity')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="addressLine" label={t('user.addrLine')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="postalCode" label={t('user.addrPostal')}>
            <Input />
          </Form.Item>
          <Form.Item name="isDefault" valuePropName="checked">
            <Switch checkedChildren={t('common.default')} unCheckedChildren={t('common.no')} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={updateMut.isPending}>
            {t('user.addrEdit')}
          </Button>
        </Form>
      </Modal>
    </UserCenterShell>
  )
}
