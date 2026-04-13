import { App, Button, Card, Form, Input, InputNumber, Space, Switch } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { useAdminSiteContents, useAdminUpsertSiteContent } from '../../hooks/apiHooks'

type SiteContentRow = {
  id: number
  contentKey: string
  contentType: string
  title?: string
  subtitle?: string
  body?: string
  imageUrl?: string
  actionUrl?: string
  sortNo: number
  isActive: boolean
}

/**
 * 站点内容管理：维护首页 banner/说明/优势/联系人等 CMS 内容。
 */
export function AdminSiteContentsPage() {
  const { message } = App.useApp()
  const { data = [], isLoading } = useAdminSiteContents()
  const upsertMut = useAdminUpsertSiteContent()

  const columns: ProColumns<SiteContentRow>[] = [
    { title: 'ID', dataIndex: 'id', width: 80, search: false },
    { title: '内容键', dataIndex: 'contentKey', search: false },
    { title: '类型', dataIndex: 'contentType', search: false },
    { title: '标题', dataIndex: 'title', ellipsis: true, search: false },
    { title: '排序', dataIndex: 'sortNo', width: 80, search: false },
    { title: '状态', dataIndex: 'isActive', width: 90, search: false, render: (_, r) => (r.isActive ? '启用' : '停用') },
  ]

  return (
    <PageContainer title="站点内容管理" subTitle="统一维护首页文案、Banner、优势卡片与联系人信息内容源。">
      <Card title="新增/更新内容" style={{ marginBottom: 16 }}>
        <Form
          layout="vertical"
          onFinish={async (v) => {
            try {
              await upsertMut.mutateAsync(v)
              message.success('内容已保存')
            } catch {
              message.error('保存失败，请检查内容键或字段格式')
            }
          }}
        >
          <Space style={{ width: '100%' }} align="start" wrap>
            <Form.Item name="contentKey" rules={[{ required: true }]} label="内容键（唯一）">
              <Input placeholder="HOME_BANNER_1" />
            </Form.Item>
            <Form.Item name="contentType" rules={[{ required: true }]} label="内容类型">
              <Input placeholder="BANNER / INTRO / ADVANTAGE / CONTACT" />
            </Form.Item>
            <Form.Item name="sortNo" initialValue={0} label="排序">
              <InputNumber />
            </Form.Item>
            <Form.Item name="isActive" initialValue={true} valuePropName="checked" label="启用">
              <Switch />
            </Form.Item>
          </Space>
          <Form.Item name="title" label="标题">
            <Input />
          </Form.Item>
          <Form.Item name="subtitle" label="副标题">
            <Input />
          </Form.Item>
          <Form.Item name="body" label="正文">
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="imageUrl" label="图片地址">
            <Input />
          </Form.Item>
          <Form.Item name="actionUrl" label="跳转地址">
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={upsertMut.isPending}>
            保存
          </Button>
        </Form>
      </Card>
      <ProTable<SiteContentRow>
        rowKey="id"
        loading={isLoading}
        search={false}
        options={false}
        columns={columns}
        dataSource={data as SiteContentRow[]}
        pagination={false}
      />
    </PageContainer>
  )
}
