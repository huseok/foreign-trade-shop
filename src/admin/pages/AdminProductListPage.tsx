/**
 * 管理端商品列表：服务端分页 + 关键词 + 上架状态；入口新建 / 行内编辑。
 */
import { useEffect, useState } from 'react'
import { App, Button, Card, Input, Modal, Popconfirm, Select, Space, Table, Typography, Upload } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { Link } from 'react-router-dom'
import { useAdminBulkProductStatus, useAdminProductsPage, useMe } from '../../hooks/apiHooks'
import { AdminFilterBar } from '../components/AdminFilterBar'
import { AdminPageHeader } from '../components/AdminPageHeader'
import type { ProductDto } from '../../types/api'
import { voyage } from '../../openapi/voyageSdk'

type StatusFilter = 'all' | 'active' | 'inactive'

export function AdminProductListPage() {
  const { message } = App.useApp()
  const { data: me, isLoading: meLoading } = useMe(true)
  const [page, setPage] = useState(0)
  const [pageSize, setPageSize] = useState(10)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all')
  const [qInput, setQInput] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [importErrors, setImportErrors] = useState<Array<{ line: number; reason: string }>>([])
  const [importSummary, setImportSummary] = useState<{ ok: number; total: number } | null>(null)
  const bulkStatusMut = useAdminBulkProductStatus()

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
      width: 180,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Link to={`/admin/products/${r.id}/edit`}>编辑</Link>
          <Link to={`/admin/products/${r.id}/sku-matrix`}>规格矩阵</Link>
        </Space>
      ),
    },
  ]

  const exportCsv = () => {
    const header = ['id', 'title', 'price', 'currency', 'moq', 'isActive']
    const lines = rows.map((r) =>
      [r.id, `"${r.title.replaceAll('"', '""')}"`, r.price ?? '', r.currency ?? 'USD', r.moq, r.isActive]
        .join(',')
    )
    const csv = [header.join(','), ...lines].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'products-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadTemplate = () => {
    const header = ['id', 'title', 'price', 'currency', 'moq', 'isActive']
    const sample = ['', 'Sample Product', '19.99', 'USD', '2', 'true']
    const csv = [header.join(','), sample.join(',')].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'products-import-template.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const importCsv = async (file: File) => {
    const text = await file.text()
    const lines = text.split(/\r?\n/).filter(Boolean)
    if (lines.length <= 1) {
      message.warning('CSV 无有效数据')
      return false
    }
    const [head, ...body] = lines
    const cols = head.split(',').map((x) => x.trim())
    const idx = (name: string) => cols.indexOf(name)
    let ok = 0
    const errors: Array<{ line: number; reason: string }> = []
    for (let i = 0; i < body.length; i += 1) {
      const lineNo = i + 2
      const line = body[i]
      const parts = line.split(',')
      const id = Number(parts[idx('id')] || '')
      const payload = {
        title: (parts[idx('title')] || '').replace(/^"|"$/g, ''),
        price: Number(parts[idx('price')] || 0),
        currency: (parts[idx('currency')] || 'USD').trim(),
        moq: Number(parts[idx('moq')] || 1),
        isActive: String(parts[idx('isActive')] || 'true').trim() === 'true',
      }
      if (!payload.title) {
        errors.push({ line: lineNo, reason: 'title 为空' })
        continue
      }
      if (payload.price <= 0) {
        errors.push({ line: lineNo, reason: 'price 必须 > 0' })
        continue
      }
      if (payload.moq < 1) {
        errors.push({ line: lineNo, reason: 'moq 必须 >= 1' })
        continue
      }
      try {
        if (Number.isFinite(id) && id > 0) {
          await voyage.products.adminUpdate(id, payload)
        } else {
          await voyage.products.adminCreate(payload)
        }
        ok += 1
      } catch {
        errors.push({ line: lineNo, reason: '调用接口失败' })
      }
    }
    setImportErrors(errors)
    setImportSummary({ ok, total: body.length })
    message.success(`导入完成，成功 ${ok} 条，失败 ${errors.length} 条`)
    setSelectedIds([])
    return false
  }

  return (
    <div style={{ maxWidth: 1200 }}>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <Space align="center" style={{ width: '100%', justifyContent: 'space-between' }} wrap>
          <AdminPageHeader title="商品列表" description="支持按关键字和上下架状态筛选，点击可进入编辑页。" />
          <Link to="/admin/products/new">
            <Button type="primary">新建商品</Button>
          </Link>
        </Space>

        <Card>
          <Space orientation="vertical" size="middle" style={{ width: '100%', marginBottom: 16 }}>
            <AdminFilterBar>
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
              <Button onClick={exportCsv}>导出CSV</Button>
              <Button onClick={downloadTemplate}>下载导入模板</Button>
              <Upload
                accept=".csv"
                showUploadList={false}
                beforeUpload={(file) => {
                  void importCsv(file)
                  return false
                }}
              >
                <Button>导入CSV</Button>
              </Upload>
              <Popconfirm
                title={`确认批量上架 ${selectedIds.length} 条商品？`}
                disabled={selectedIds.length === 0}
                onConfirm={async () => {
                  await bulkStatusMut.mutateAsync({ ids: selectedIds, isActive: true })
                  message.success(`已批量上架 ${selectedIds.length} 条`)
                  setSelectedIds([])
                }}
              >
                <Button disabled={selectedIds.length === 0} loading={bulkStatusMut.isPending}>
                  批量上架
                </Button>
              </Popconfirm>
              <Popconfirm
                title={`确认批量下架 ${selectedIds.length} 条商品？`}
                disabled={selectedIds.length === 0}
                onConfirm={async () => {
                  await bulkStatusMut.mutateAsync({ ids: selectedIds, isActive: false })
                  message.success(`已批量下架 ${selectedIds.length} 条`)
                  setSelectedIds([])
                }}
              >
                <Button danger disabled={selectedIds.length === 0} loading={bulkStatusMut.isPending}>
                  批量下架
                </Button>
              </Popconfirm>
            </AdminFilterBar>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              当前条件共 {total} 条（第 {page + 1} 页，每页 {pageSize} 条）
            </Typography.Text>
          </Space>
          <Table<ProductDto>
            rowKey="id"
            loading={listLoading}
            columns={columns}
            dataSource={rows}
            rowSelection={{
              selectedRowKeys: selectedIds,
              onChange: (keys) => setSelectedIds(keys.map((x) => Number(x))),
            }}
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
      <Modal
        title="CSV 导入报告"
        open={Boolean(importSummary)}
        onCancel={() => setImportSummary(null)}
        footer={null}
        destroyOnHidden
      >
        <Typography.Paragraph>
          共 {importSummary?.total ?? 0} 行，成功 {importSummary?.ok ?? 0} 行，失败 {importErrors.length} 行。
        </Typography.Paragraph>
        <Table
          rowKey={(r) => `${r.line}-${r.reason}`}
          dataSource={importErrors}
          pagination={{ pageSize: 8 }}
          columns={[
            { title: '行号', dataIndex: 'line', width: 90 },
            { title: '失败原因', dataIndex: 'reason' },
          ]}
        />
      </Modal>
    </div>
  )
}
