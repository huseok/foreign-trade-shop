/**
 * 后台客户列表：注册用户 + 会员档位与累计消费（只读）。
 */
import { Button, Input, Space, Tag, Typography } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import dayjs from 'dayjs'
import { useMemo, useState } from 'react'
import { useAdminCustomersPage } from '../../../hooks/apiHooks'
import { useI18n } from '../../../i18n/I18nProvider'
import { i18nTpl } from '../../../lib/i18nTpl'
import type { components } from '../../../generated/voyage-paths'

type Row = components['schemas']['CustomerAdminView']

function tierLabel(t: (k: string) => string, code: string): string {
  const key = `admin.customers.tier.${code}`
  const v = t(key)
  return v === key ? code : v
}

export function AdminCustomersPage() {
  const { t } = useI18n()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')

  const { data, isLoading, isFetching } = useAdminCustomersPage({
    page,
    size: pageSize,
    q: q.trim() || undefined,
  })

  const rows = data?.items ?? []
  const total = data?.total ?? 0

  const columns: ProColumns<Row>[] = useMemo(
    () => [
      { title: 'ID', dataIndex: 'id', width: 72, search: false },
      { title: t('admin.customers.colEmail'), dataIndex: 'email', ellipsis: true, width: 200, search: false },
      { title: t('admin.customers.colName'), dataIndex: 'name', ellipsis: true, search: false },
      { title: t('admin.customers.colPhone'), dataIndex: 'phone', width: 120, search: false, render: (_, r) => r.phone ?? '—' },
      { title: t('admin.customers.colCountry'), dataIndex: 'country', width: 88, search: false, render: (_, r) => r.country ?? '—' },
      {
        title: t('admin.customers.colRole'),
        dataIndex: 'role',
        width: 100,
        search: false,
        render: (_, r) => <Tag>{r.role}</Tag>,
      },
      {
        title: t('admin.customers.colStatus'),
        dataIndex: 'status',
        width: 96,
        search: false,
        render: (_, r) => <Tag color={r.status === 'ACTIVE' ? 'green' : 'default'}>{r.status}</Tag>,
      },
      {
        title: t('admin.customers.colTier'),
        dataIndex: 'tier',
        width: 100,
        search: false,
        render: (_, r) => tierLabel(t, r.tier),
      },
      {
        title: t('admin.customers.colLifetime'),
        dataIndex: 'lifetimePaidUsd',
        width: 120,
        search: false,
        render: (_, r) => `${r.lifetimePaidUsd} USD`,
      },
      {
        title: t('admin.customers.colMemberDiscount'),
        dataIndex: 'memberDiscountPercent',
        width: 100,
        search: false,
        render: (_, r) => (r.memberDiscountPercent > 0 ? `${r.memberDiscountPercent}%` : '—'),
      },
      {
        title: t('admin.customers.colCreated'),
        dataIndex: 'createdAt',
        width: 160,
        search: false,
        render: (_, r) => dayjs(r.createdAt).format('YYYY-MM-DD HH:mm'),
      },
    ],
    [t],
  )

  return (
    <PageContainer title={t('admin.customers.title')} subTitle={t('admin.customers.subtitle')}>
      <Space style={{ marginBottom: 16 }} wrap>
        <Input
          allowClear
          placeholder={t('admin.customers.keywordPh')}
          style={{ width: 280 }}
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          onPressEnter={() => {
            setQ(qInput)
            setPage(0)
          }}
        />
        <Button
          type="primary"
          onClick={() => {
            setQ(qInput)
            setPage(0)
          }}
        >
          {t('admin.customers.search')}
        </Button>
      </Space>
      <ProTable<Row>
        rowKey="id"
        loading={isLoading || isFetching}
        search={false}
        options={false}
        columns={columns}
        dataSource={rows}
        pagination={{
          current: page + 1,
          pageSize,
          total,
          showSizeChanger: true,
          pageSizeOptions: [10, 20, 50],
          onChange: (p, ps) => {
            setPage((p ?? 1) - 1)
            setPageSize(ps ?? 20)
          },
        }}
        footer={() => (
          <Typography.Text type="secondary">{i18nTpl(t('admin.customers.footerHint'), { n: String(total) })}</Typography.Text>
        )}
      />
    </PageContainer>
  )
}
