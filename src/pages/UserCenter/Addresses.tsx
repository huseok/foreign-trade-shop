/**
 * 用户中心-地址管理模块。
 */
import { App, Button, Card, Form, Input, Switch, Table } from 'antd'
import { useCreateUserAddress, useUserAddresses } from '../../hooks/apiHooks'

export function UserAddressesPage() {
  const { message } = App.useApp()
  const { data = [], isLoading } = useUserAddresses(true)
  const createMut = useCreateUserAddress()

  return (
    <section className="page-pad">
      <div className="container">
        <h1 className="page-header__title">地址管理</h1>
        <p className="page-header__desc">维护收货地址，支持默认地址设置。</p>
        <Card style={{ marginTop: 16 }}>
          <Form
            layout="inline"
            onFinish={(v) => createMut.mutateAsync(v).then(() => message.success('地址已新增'))}
          >
            <Form.Item name="receiverName" rules={[{ required: true }]}><Input placeholder="收货人" /></Form.Item>
            <Form.Item name="receiverPhone" rules={[{ required: true }]}><Input placeholder="电话" /></Form.Item>
            <Form.Item name="country" rules={[{ required: true }]}><Input placeholder="国家" /></Form.Item>
            <Form.Item name="addressLine" rules={[{ required: true }]}><Input placeholder="详细地址" style={{ width: 280 }} /></Form.Item>
            <Form.Item name="postalCode"><Input placeholder="邮编" /></Form.Item>
            <Form.Item name="isDefault" valuePropName="checked" initialValue={false}><Switch checkedChildren="默认" /></Form.Item>
            <Button type="primary" htmlType="submit" loading={createMut.isPending}>新增地址</Button>
          </Form>
        </Card>
        <Table
          style={{ marginTop: 16 }}
          rowKey="id"
          loading={isLoading}
          dataSource={data}
          columns={[
            { title: '收货人', dataIndex: 'receiverName' },
            { title: '电话', dataIndex: 'receiverPhone' },
            { title: '国家', dataIndex: 'country' },
            { title: '地址', dataIndex: 'addressLine' },
            { title: '默认', dataIndex: 'isDefault', render: (v) => (v ? '是' : '否') },
          ]}
          pagination={false}
        />
      </div>
    </section>
  )
}
