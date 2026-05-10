/**
 * 用户中心-地址管理模块。
 */
import { App, Button, Card, Form, Input, Switch, Table } from 'antd'
import { UserCenterShell } from '../../components/UserCenterShell'
import { useCreateUserAddress, useUserAddresses } from '../../hooks/apiHooks'
import { useI18n } from '../../i18n/I18nProvider'

export function UserAddressesPage() {
  const { t } = useI18n()
  const { message } = App.useApp()
  const { data = [], isLoading } = useUserAddresses(true)
  const createMut = useCreateUserAddress()

  return (
    <UserCenterShell>
      <h2 className="page-header__title" style={{ fontSize: '1.35rem', marginBottom: 8 }}>
        {t('user.addressesTitle')}
      </h2>
      <p className="page-header__desc">{t('user.addressesDesc')}</p>
      <Card style={{ marginTop: 16 }}>
        <Form
          layout="inline"
          onFinish={async (v) => {
            try {
              await createMut.mutateAsync(v)
              message.success(t('user.addrAddOk'))
            } catch {
              message.error(t('user.addrAddFail'))
            }
          }}
        >
          <Form.Item name="receiverName" rules={[{ required: true }]}>
            <Input placeholder={t('user.addrReceiver')} />
          </Form.Item>
          <Form.Item name="receiverPhone" rules={[{ required: true }]}>
            <Input placeholder={t('user.addrPhone')} />
          </Form.Item>
          <Form.Item name="country" rules={[{ required: true }]}>
            <Input placeholder={t('user.addrCountry')} />
          </Form.Item>
          <Form.Item name="addressLine" rules={[{ required: true }]}>
            <Input placeholder={t('user.addrLine')} style={{ width: 280 }} />
          </Form.Item>
          <Form.Item name="postalCode">
            <Input placeholder={t('user.addrPostal')} />
          </Form.Item>
          <Form.Item name="isDefault" valuePropName="checked" initialValue={false}>
            <Switch checkedChildren={t('common.default')} unCheckedChildren={t('common.no')} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={createMut.isPending}>
            {t('user.addrAdd')}
          </Button>
        </Form>
      </Card>
      <Table
        style={{ marginTop: 16 }}
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        columns={[
          { title: t('user.addrReceiver'), dataIndex: 'receiverName' },
          { title: t('user.addrPhone'), dataIndex: 'receiverPhone' },
          { title: t('user.addrCountry'), dataIndex: 'country' },
          { title: t('user.addrLine'), dataIndex: 'addressLine' },
          {
            title: t('user.addrDefault'),
            dataIndex: 'isDefault',
            render: (v: boolean) => (v ? t('common.yes') : t('common.no')),
          },
        ]}
        pagination={false}
      />
    </UserCenterShell>
  )
}
