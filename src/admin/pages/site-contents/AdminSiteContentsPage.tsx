import { App, Button, Card, Form, Input, InputNumber, Space, Switch } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { useAdminSiteContents, useAdminUpsertSiteContent } from '../../../hooks/apiHooks'
import { useI18n } from '../../../i18n/I18nProvider'

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
  const { t } = useI18n()
  const { message } = App.useApp()
  const { data = [], isLoading } = useAdminSiteContents()
  const upsertMut = useAdminUpsertSiteContent()

  const columns: ProColumns<SiteContentRow>[] = [
    { title: t('admin.siteContents.colId'), dataIndex: 'id', width: 80, search: false },
    { title: t('admin.siteContents.colKey'), dataIndex: 'contentKey', search: false },
    { title: t('admin.siteContents.colType'), dataIndex: 'contentType', search: false },
    { title: t('admin.siteContents.colTitle'), dataIndex: 'title', ellipsis: true, search: false },
    { title: t('admin.siteContents.colSort'), dataIndex: 'sortNo', width: 80, search: false },
    {
      title: t('admin.siteContents.colStatus'),
      dataIndex: 'isActive',
      width: 90,
      search: false,
      render: (_, r) => (r.isActive ? t('admin.siteContents.active') : t('admin.siteContents.inactive')),
    },
  ]

  return (
    <PageContainer title={t('admin.siteContents.title')} subTitle={t('admin.siteContents.subtitle')}>
      <Card title={t('admin.siteContents.cardUpsert')} style={{ marginBottom: 16 }}>
        <Form
          layout="vertical"
          onFinish={async (v) => {
            try {
              await upsertMut.mutateAsync(v)
              message.success(t('admin.siteContents.saveOk'))
            } catch {
              message.error(t('admin.siteContents.saveFail'))
            }
          }}
        >
          <Space style={{ width: '100%' }} align="start" wrap>
            <Form.Item name="contentKey" rules={[{ required: true }]} label={t('admin.siteContents.labelKey')}>
              <Input placeholder={t('admin.siteContents.keyPh')} />
            </Form.Item>
            <Form.Item name="contentType" rules={[{ required: true }]} label={t('admin.siteContents.labelType')}>
              <Input placeholder={t('admin.siteContents.typePh')} />
            </Form.Item>
            <Form.Item name="sortNo" initialValue={0} label={t('admin.siteContents.labelSort')}>
              <InputNumber />
            </Form.Item>
            <Form.Item name="isActive" initialValue={true} valuePropName="checked" label={t('admin.siteContents.labelActive')}>
              <Switch />
            </Form.Item>
          </Space>
          <Form.Item name="title" label={t('admin.siteContents.labelTitle')}>
            <Input />
          </Form.Item>
          <Form.Item name="subtitle" label={t('admin.siteContents.labelSubtitle')}>
            <Input />
          </Form.Item>
          <Form.Item name="body" label={t('admin.siteContents.labelBody')}>
            <Input.TextArea rows={3} />
          </Form.Item>
          <Form.Item name="imageUrl" label={t('admin.siteContents.labelImageUrl')}>
            <Input />
          </Form.Item>
          <Form.Item name="actionUrl" label={t('admin.siteContents.labelActionUrl')}>
            <Input />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={upsertMut.isPending}>
            {t('admin.siteContents.save')}
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
