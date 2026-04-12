/**
 * 管理端商品列表：服务端分页 + 关键词 + 上架状态；入口新建 / 行内编辑。
 */
import { useEffect, useState } from 'react'
import { App, Button, Card, Input, Select, Space, Table, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Link } from 'react-router-dom'
import { useAdminProductsPage, useMe } from '../../hooks/apiHooks'
import type { ProductDto } from '../../types/api'

type StatusFilter = 'all' | 'active' | 'inactive'

export function AdminProductListPage() {
  const { message } = App.useApp()
  const { data: me, isLoading: meLoading } = useMe(true)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [qInput, setQInput] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(qInput.trim()), 350)
    return () => window.clearTimeout(t)
  }, [qInput])

  useEffect(() => {
    setPage(0)
  }, [debouncedQ, statusFilter])

  const activeParam: boolean | undefined =
    statusFilter === 'active' ? true : statusFilter === 'inactive' ? false : undefined

  const { data, isLoading: listLoading } = useAdminProductsPage({
    page,
    size: pageSize,
    q: debouncedQ || undefined,
    active: activeParam,
  })

  useEffect(() => {
    if (!meLoading && me?.role !== 'ADMIN') {
      message.warning('无管理员权限')
    }
  }, [me, meLoading, message])

  if (meLoading) {
    return <Typography.Paragraph>加载中…</Typography.Paragraph>
  }

  if (me?.role !== 'ADMIN') {
    return (
      <Card>
        <Typography.Title level={4}>无权限</Typography.Title>
        <Typography.Paragraph>请使用 ADMIN 账号从后台入口登录。</Typography.Paragraph>
      </Card>
    )
  }

  const rows = data?.items ?? []
  const total = data?.total ?? 0

  const columns: ColumnsType<ProductDto> = [
    { title: 'ID', dataIndex: 'id', width: 72, fixed: 'left' },
    { title: '标题', dataIndex: 'title', ellipsis: true },
    { title: 'SKU', dataIndex: 'skuCode', width: 120, render: (v) => v ?? '—' },
    {
      title: '价格',
      key: 'price',
      width: 140,
      render: (_, r) =>
        r.price == null ? '—' : `${r.currency ?? ''} ${Number(r.price).toFixed(2)}`,
    },
    { title: 'MOQ', dataIndex: 'moq', width: 80 },
    {
      title: '状态',
      dataIndex: 'isActive',
      width: 88,
      render: (v: boolean) => (v ? '上架' : '下架'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 100,
      fixed: 'right',
      render: (_, r) => <Link to={`/admin/products/${r.id}/edit`}>编辑</Link>,
    },
  ]

  return (
    <div style={{ maxWidth: 1200 }}>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <Typography.Title level={4} style={{ margin: 0 }}>
            商品列表
          </Typography.Title>
          <Link to="/admin/products/new">
            <Button type="primary">新建商品</Button>
          </Link>
        </Space>

        <Card>
          <Space orientation="vertical" size="middle" style={{ width: '100%', marginBottom: 16 }}>
            <Space wrap style={{ width: '100%', rowGap: 8 }}>
              <Input.Search
                allowClear
                placeholder="搜索标题、SKU 或商品 ID（服务端）"
                value={qInput}
                onChange={(e) => setQInput(e.target.value)}
                style={{ minWidth: 240, maxWidth: 360, flex: 1 }}
              />
              <Select<StatusFilter>
                value={statusFilter}
                onChange={setStatusFilter}
                style={{ width: 140 }}
                options={[
                  { value: 'all', label: '全部状态' },
                  { value: 'active', label: '仅上架' },
                  { value: 'inactive', label: '仅下架' },
                ]}
              />
              <Button
                onClick={() => {
                  setQInput('')
                  setDebouncedQ('')
                  setStatusFilter('all')
                  setPage(0)
                }}
              >
                重置条件
              </Button>
            </Space>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              当前条件共 {total} 条（第 {page + 1} 页，每页 {pageSize} 条）
            </Typography.Text>
          </Space>
          <Table<ProductDto>
            rowKey="id"
            loading={listLoading}
            columns={columns}
            dataSource={rows}
            scroll={{ x: 720 }}
            pagination={{
              current: page + 1,
              pageSize,
              total,
              showSizeChanger: true,
              showTotal: (t) => `共 ${t} 条`,
              onChange: (p, ps) => {
                setPage(p - 1)
                setPageSize(ps)
              },
            }}
            locale={{
              emptyText: listLoading ? '加载中…' : '暂无数据',
            }}
          />
        </Card>
      </Space>
    </div>
  )
}
