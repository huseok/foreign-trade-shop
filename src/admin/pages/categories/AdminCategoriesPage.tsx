import { App, Button, Card, Form, Input, InputNumber, Popconfirm, Space, Switch, Typography } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { useMemo, useState } from 'react'
import {
  useAdminCreateCategory,
  useAdminDeleteCategory,
  useAdminUpdateCategory,
  useCategories,
} from '../../../hooks/apiHooks'
import { useI18n } from '../../../i18n/useI18n'
import { i18nTpl } from '../../../lib/i18nTpl'
import { StandardModal } from '../../components/shared/StandardModal'

type CategoryRow = {
  id: number
  parentId?: number | null
  name: string
  code: string
  sortNo: number
  isActive: boolean
}

type FormOps<T> = {
  resetFields: () => void
  setFieldsValue: (values: Partial<T>) => void
  submit: () => void
}

/**
 * 分类管理页：支持查看分类与新增分类（Pro 布局 + ProTable）。
 */
export function AdminCategoriesPage() {
  const { t } = useI18n()
  const { message } = App.useApp()
  const { data = [], isLoading } = useCategories()
  const createMut = useAdminCreateCategory()
  const updateMut = useAdminUpdateCategory()
  const deleteMut = useAdminDeleteCategory()
  const [form] = Form.useForm<CategoryRow>()
  const [editing, setEditing] = useState<CategoryRow | null>(null)
  const [keyword, setKeyword] = useState('')

  const onFinish = async (values: { name: string; code: string; sortNo?: number; isActive?: boolean }) => {
    try {
      await createMut.mutateAsync(values)
      message.success(t('admin.categories.created'))
      ;(form as unknown as FormOps<CategoryRow>).resetFields()
    } catch {
      message.error(t('admin.categories.createFail'))
    }
  }
  const filtered = useMemo(
    () => (data as CategoryRow[]).filter((x) => `${x.name} ${x.code}`.toLowerCase().includes(keyword.trim().toLowerCase())),
    [data, keyword]
  )
  const [editForm] = Form.useForm<CategoryRow>()

  const columns: ProColumns<CategoryRow>[] = [
    { title: t('admin.categories.colId'), dataIndex: 'id', width: 80, search: false },
    { title: t('admin.categories.name'), dataIndex: 'name', search: false },
    { title: t('admin.categories.code'), dataIndex: 'code', search: false },
    { title: t('admin.categories.parent'), dataIndex: 'parentId', search: false, render: (_, r) => r.parentId ?? '—' },
    { title: t('admin.categories.sort'), dataIndex: 'sortNo', width: 90, search: false },
    {
      title: t('admin.categories.colStatus'),
      dataIndex: 'isActive',
      width: 90,
      search: false,
      render: (_, r) => (r.isActive ? t('admin.categories.active') : t('admin.categories.inactive')),
    },
    {
      title: t('admin.categories.colActions'),
      key: 'actions',
      width: 160,
      search: false,
      render: (_, row) => (
        <Space>
          <Button
            type="link"
            onClick={() => {
              setEditing(row)
              ;(editForm as unknown as FormOps<CategoryRow>).setFieldsValue(row)
            }}
          >
            {t('admin.categories.editBtn')}
          </Button>
          <Popconfirm
            title={t('admin.categories.deleteConfirm')}
            onConfirm={async () => {
              try {
                await deleteMut.mutateAsync(row.id)
                message.success(t('admin.categories.deleted'))
              } catch {
                message.error(t('admin.categories.deleteFail'))
              }
            }}
          >
            <Button danger type="link">
              {t('admin.categories.deleteBtn')}
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <PageContainer title={t('admin.categories.title')} subTitle={t('admin.categories.subtitle')}>
      <Card title={t('admin.categories.createCard')} style={{ marginBottom: 16 }}>
        <Form form={form} layout="inline" onFinish={(v) => void onFinish(v)}>
          <Form.Item
            name="name"
            rules={[
              { required: true, message: t('admin.categories.nameRequired') },
              { min: 2, message: t('admin.categories.nameMin') },
            ]}
          >
            <Input placeholder={t('admin.categories.name')} />
          </Form.Item>
          <Form.Item
            name="code"
            rules={[
              { required: true, message: t('admin.categories.codeRequired') },
              { pattern: /^[A-Z0-9_]+$/, message: t('admin.categories.codePattern') },
            ]}
          >
            <Input placeholder={t('admin.categories.code')} />
          </Form.Item>
          <Form.Item name="sortNo" initialValue={0}>
            <InputNumber placeholder={t('admin.categories.sort')} />
          </Form.Item>
          <Form.Item name="isActive" initialValue={true} valuePropName="checked">
            <Switch checkedChildren={t('admin.categories.active')} unCheckedChildren={t('admin.categories.inactive')} />
          </Form.Item>
          <Button type="primary" htmlType="submit" loading={createMut.isPending}>
            {t('admin.categories.create')}
          </Button>
        </Form>
      </Card>
      <Input
        allowClear
        placeholder={t('admin.categories.keywordPh')}
        style={{ maxWidth: 320, marginBottom: 12 }}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <ProTable<CategoryRow>
        rowKey="id"
        loading={isLoading}
        search={false}
        options={false}
        columns={columns}
        dataSource={filtered}
        pagination={false}
        footer={() => (
          <Typography.Text type="secondary">
            {i18nTpl(t('admin.categories.footerHint'), { n: String(filtered.length) })}
          </Typography.Text>
        )}
      />
      <StandardModal
        title={t('admin.categories.edit')}
        open={Boolean(editing)}
        onCancel={() => setEditing(null)}
        onOk={() => void (editForm as unknown as FormOps<CategoryRow>).submit()}
        confirmLoading={updateMut.isPending}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={async (values) => {
            if (!editing) return
            try {
              const { id: _id, ...rest } = values
              void _id
              const payload = {
                ...rest,
                parentId: rest.parentId ?? undefined,
              }
              await updateMut.mutateAsync({ id: editing.id, ...payload })
              message.success(t('admin.categories.updated'))
              setEditing(null)
            } catch {
              message.error(t('admin.categories.updateFail'))
            }
          }}
        >
          <Form.Item name="name" label={t('admin.categories.name')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="code" label={t('admin.categories.code')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sortNo" label={t('admin.categories.sort')}>
            <InputNumber />
          </Form.Item>
          <Form.Item name="isActive" label={t('admin.categories.active')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </StandardModal>
    </PageContainer>
  )
}
