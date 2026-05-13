/**
 * 后台客户管理页：
 * - 分页列出注册用户，展示会员档位、累计消费、称呼与运营备注摘要；
 * - 支持按邮箱/姓名搜索；
 * - 「编辑」打开弹窗维护备注/偏好，并在弹窗内提供「重置密码」（二次确认、可选手工密码，留空则服务端使用邮箱）；
 * - 「查看订单」跳转订单管理并带上 userId，订单页自动筛出该客户订单。
 */
import { Button, Input, Space, Tag, Typography } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import dayjs from 'dayjs'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAdminCustomersPage } from '../../../hooks/apiHooks'
import { useI18n } from '../../../i18n/useI18n'
import { i18nTpl } from '../../../lib/i18nTpl'
import type { components } from '../../../generated/voyage-paths'
import { AdminCustomerEditModal } from '../../components/customers/AdminCustomerEditModal'

type Row = components['schemas']['CustomerAdminView']

function tierLabel(t: (k: string) => string, code: string): string {
  const key = `admin.customers.tier.${code}`
  const v = t(key)
  return v === key ? code : v
}

/** 列表单元格内对长文本做截断，完整内容在编辑弹窗中查看。 */
function ellipsize(s: string | null | undefined, max: number): string {
  if (s == null || s === '') return '—'
  const t = s.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max)}…`
}

export function AdminCustomersPage() {
  const { t } = useI18n()
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(20)
  const [qInput, setQInput] = useState('')
  const [q, setQ] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [editRow, setEditRow] = useState<Row | null>(null)

  const { data, isLoading, isFetching, refetch } = useAdminCustomersPage({
    page,
    size: pageSize,
    q: q.trim() || undefined,
  })

  const rows = data?.items ?? []
  const total = data?.total ?? 0

  const openEdit = (r: Row) => {
    setEditRow(r)
    setEditOpen(true)
  }

  const closeEdit = () => {
    setEditOpen(false)
    setEditRow(null)
  }

  const columns: ProColumns<Row>[] = [
    { title: 'ID', dataIndex: 'id', width: 72, search: false, fixed: 'left' },
    { title: t('admin.customers.colEmail'), dataIndex: 'email', ellipsis: true, width: 200, search: false },
    { title: t('admin.customers.colName'), dataIndex: 'name', ellipsis: true, width: 120, search: false },
    {
      title: t('admin.customers.colSalutation'),
      dataIndex: 'salutation',
      width: 100,
      search: false,
      ellipsis: true,
    },
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
      title: t('admin.customers.colAdminNote'),
      dataIndex: 'adminNote',
      width: 160,
      search: false,
      ellipsis: true,
      render: (_, r) => ellipsize(r.adminNote, 80),
    },
    {
      title: t('admin.customers.colPreferences'),
      dataIndex: 'preferences',
      width: 160,
      search: false,
      ellipsis: true,
      render: (_, r) => ellipsize(r.preferences, 80),
    },
    {
      title: t('admin.customers.colCreated'),
      dataIndex: 'createdAt',
      width: 160,
      search: false,
      render: (_, r) => dayjs(r.createdAt).format('YYYY-MM-DD HH:mm'),
    },
    {
      title: t('admin.customers.actions'),
      key: 'actions',
      width: 200,
      fixed: 'right',
      search: false,
      render: (_, r) => (
        <Space wrap size={4}>
          <Button type="link" size="small" onClick={() => openEdit(r)}>
            {t('admin.customers.edit')}
          </Button>
          <Link to={`/admin/orders?userId=${r.id}&customerLabel=${encodeURIComponent(r.email)}`}>
            {t('admin.customers.viewOrders')}
          </Link>
        </Space>
      ),
    },
  ]

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
        scroll={{ x: 1400 }}
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
      <AdminCustomerEditModal
        open={editOpen}
        record={editRow}
        onClose={closeEdit}
        onSaved={() => void refetch()}
      />
    </PageContainer>
  )
}
