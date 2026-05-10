/**
 * 商品标签管理：`t_tags` + 商品侧通过 `tagIds` 绑定（见商品编辑页）。
 */
import { App, Button, Card, Form, Input, InputNumber, Popconfirm, Space, Switch, Typography } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { useMemo, useState } from 'react'
import {
  useAdminCreateTag,
  useAdminDeleteTag,
  useAdminTags,
  useAdminUpdateTag,
} from '../../hooks/apiHooks'
import { useI18n } from '../../i18n/I18nProvider'
import { i18nTpl } from '../../lib/i18nTpl'
import type { components } from '../../generated/voyage-paths'
import { StandardModal } from '../components/StandardModal'

type TagRow = components['schemas']['TagView']

type FormOps<T> = {
  resetFields: () => void
  setFieldsValue: (values: Partial<T>) => void
  submit: () => void
}

export function AdminTagsPage() {
  const { t } = useI18n()
  const { message } = App.useApp()
  const { data: rawList = [], isLoading } = useAdminTags()
  const createMut = useAdminCreateTag()
  const updateMut = useAdminUpdateTag()
  const deleteMut = useAdminDeleteTag()
  const [form] = Form.useForm<components['schemas']['TagUpsertRequest']>()
  const [editForm] = Form.useForm<components['schemas']['TagUpsertRequest']>()
  const [editing, setEditing] = useState<(typeof rawList)[0] | null>(null)
  const [keyword, setKeyword] = useState('')

  const rows: TagRow[] = useMemo(() => rawList, [rawList])

  const filtered = useMemo(
    () => rows.filter((x) => `${x.code} ${x.name}`.toLowerCase().includes(keyword.trim().toLowerCase())),
    [rows, keyword],
  )

  const onCreate = async (values: components['schemas']['TagUpsertRequest']) => {
    try {
      await createMut.mutateAsync(values)
      message.success(t('admin.tags.created'))
      ;(form as unknown as FormOps<typeof values>).resetFields()
    } catch {
      message.error(t('admin.tags.createFail'))
    }
  }

  const columns: ProColumns<TagRow>[] = [
    { title: 'ID', dataIndex: 'id', width: 72, search: false },
    { title: t('admin.tags.colCode'), dataIndex: 'code', search: false },
    { title: t('admin.tags.colName'), dataIndex: 'name', search: false },
    { title: t('admin.tags.sort'), dataIndex: 'sortNo', width: 80, search: false },
    {
      title: t('admin.tags.colStatus'),
      dataIndex: 'isActive',
      width: 90,
      search: false,
      render: (_, r) => (r.isActive ? t('admin.tags.active') : t('admin.tags.inactive')),
    },
    {
      title: t('admin.tags.colActions'),
      key: 'actions',
      width: 160,
      search: false,
      render: (_, row) => (
        <Space>
          <Button
            type="link"
            size="small"
            onClick={() => {
              setEditing(row)
              ;(editForm as unknown as FormOps<components['schemas']['TagUpsertRequest']>).setFieldsValue({
                code: row.code,
                name: row.name,
                sortNo: row.sortNo,
                isActive: row.isActive,
              })
            }}
          >
            {t('admin.tags.editBtn')}
          </Button>
          <Popconfirm title={t('admin.tags.deleteConfirm')} onConfirm={() => void handleDelete(row.id)}>
            <Button danger type="link" size="small">
              {t('admin.tags.deleteBtn')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  const handleDelete = async (id: number) => {
    try {
      await deleteMut.mutateAsync(id)
      message.success(t('admin.tags.deleted'))
    } catch {
      message.error(t('admin.tags.deleteFail'))
    }
  }

  return (
    <PageContainer title={t('admin.tags.title')} subTitle={t('admin.tags.subtitle')}>
      <Card title={t('admin.tags.createCard')} style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" onFinish={(v) => void onCreate(v)} initialValues={{ sortNo: 0, isActive: true }}>
          <Form.Item name="code" rules={[{ required: true, message: t('admin.tags.codeRequired') }]}>
            <Input placeholder={t('admin.tags.codePh')} style={{ width: 140 }} />
          </Form.Item>
          <Form.Item name="name" rules={[{ required: true, message: t('admin.tags.nameRequired') }]}>
            <Input placeholder={t('admin.tags.namePh')} style={{ width: 160 }} />
          </Form.Item>
          <Form.Item name="sortNo">
            <InputNumber placeholder={t('admin.tags.sort')} style={{ width: 100 }} />
          </Form.Item>
          <Form.Item name="isActive" valuePropName="checked">
            <Switch checkedChildren={t('admin.tags.active')} unCheckedChildren={t('admin.tags.inactive')} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={createMut.isPending}>
            {t('admin.tags.create')}
          </Button>
        </Form>
      </Card>
      <Input
        allowClear
        placeholder={t('admin.tags.keywordPh')}
        style={{ maxWidth: 320, marginBottom: 12 }}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <ProTable<TagRow>
        rowKey="id"
        loading={isLoading}
        search={false}
        options={false}
        columns={columns}
        dataSource={filtered}
        pagination={false}
        footer={() => (
          <Typography.Text type="secondary">{i18nTpl(t('admin.tags.footerHint'), { n: String(filtered.length) })}</Typography.Text>
        )}
      />
      <StandardModal
        title={t('admin.tags.editTitle')}
        open={Boolean(editing)}
        onCancel={() => setEditing(null)}
        onOk={() => void (editForm as unknown as FormOps<components['schemas']['TagUpsertRequest']>).submit()}
        confirmLoading={updateMut.isPending}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={async (values) => {
            if (!editing) return
            try {
              await updateMut.mutateAsync({ id: editing.id, body: values })
              message.success(t('admin.tags.updated'))
              setEditing(null)
            } catch {
              message.error(t('admin.tags.updateFail'))
            }
          }}
        >
          <Form.Item name="code" label={t('admin.tags.colCode')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label={t('admin.tags.colName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sortNo" label={t('admin.tags.sort')}>
            <InputNumber style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isActive" label={t('admin.tags.active')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </StandardModal>
    </PageContainer>
  )
}
