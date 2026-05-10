/**
 * 管理端商品列表：服务端分页 + 关键词 + 上架状态；入口新建 / 行内编辑。
 */
import { useEffect, useState } from 'react'
import { App, Button, Input, Popconfirm, Select, Space, Table, Typography, Upload } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { Link } from 'react-router-dom'
import { useAdminBulkProductStatus, useAdminProductsPage, useMe } from '../../hooks/apiHooks'
import { useI18n } from '../../i18n/I18nProvider'
import { i18nTpl } from '../../lib/i18nTpl'
import { productThumbUrl } from '../../lib/media/resolveMediaUrl'
import type { ProductDto } from '../../types/api'
import { voyage } from '../../openapi/voyageSdk'
import { AdminProductQuickCreateModal } from '../components/AdminProductQuickCreateModal'
import { StandardModal } from '../components/StandardModal'

type StatusFilter = 'all' | 'active' | 'inactive'

export function AdminProductListPage() {
  const { message } = App.useApp()
  const { t } = useI18n()
  const { data: me, isLoading: meLoading } = useMe(true)
  const [quickOpen, setQuickOpen] = useState(false)
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
      message.warning(t('admin.productsList.warnNoAdmin'))
    }
  }, [me, meLoading, message, t])

  if (meLoading) {
    return <Typography.Paragraph>{t('admin.common.loading')}</Typography.Paragraph>
  }

  if (me?.role !== 'ADMIN') {
    return (
      <div>
        <Typography.Title level={4}>{t('admin.common.noPermission')}</Typography.Title>
        <Typography.Paragraph>{t('admin.common.noPermissionHint')}</Typography.Paragraph>
      </div>
    )
  }

  const rows = data?.items ?? []
  const total = data?.total ?? 0

  const columns: ProColumns<ProductDto>[] = [
    { title: 'ID', dataIndex: 'id', width: 72, fixed: 'left' },
    {
      title: t('admin.productsList.colThumb'),
      key: 'thumb',
      width: 76,
      search: false,
      render: (_, r) => {
        const src = productThumbUrl(r)
        return src ? (
          <img src={src} alt="" width={48} height={48} style={{ objectFit: 'cover', borderRadius: 4 }} />
        ) : (
          '—'
        )
      },
    },
    { title: t('admin.productsList.colTitle'), dataIndex: 'title', ellipsis: true },
    { title: t('admin.productsList.colSku'), dataIndex: 'skuCode', width: 120, render: (v) => v ?? '—' },
    {
      title: t('admin.productsList.colPrice'),
      key: 'price',
      width: 140,
      search: false,
      render: (_, r) =>
        r.price == null ? '—' : `${r.currency ?? ''} ${Number(r.price).toFixed(2)}`,
    },
    { title: t('admin.productsList.colMoq'), dataIndex: 'moq', width: 80 },
    {
      title: t('admin.productsList.colStatus'),
      dataIndex: 'isActive',
      width: 88,
      render: (_, r) => (r.isActive ? t('admin.productsList.statusOn') : t('admin.productsList.statusOff')),
    },
    {
      title: t('admin.productsList.colActions'),
      key: 'actions',
      width: 180,
      search: false,
      fixed: 'right',
      render: (_, r) => (
        <Space>
          <Link to={`/admin/products/${r.id}/edit`}>{t('admin.productsList.edit')}</Link>
          <Link to={`/admin/products/${r.id}/sku-matrix`}>{t('admin.productsList.skuMatrix')}</Link>
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
      message.warning(t('admin.productsList.csvEmpty'))
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
        errors.push({ line: lineNo, reason: t('admin.productsList.errTitleEmpty') })
        continue
      }
      if (payload.price <= 0) {
        errors.push({ line: lineNo, reason: t('admin.productsList.errPrice') })
        continue
      }
      if (payload.moq < 1) {
        errors.push({ line: lineNo, reason: t('admin.productsList.errMoq') })
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
        errors.push({ line: lineNo, reason: t('admin.productsList.errApi') })
      }
    }
    setImportErrors(errors)
    setImportSummary({ ok, total: body.length })
    message.success(i18nTpl(t('admin.productsList.importDone'), { ok, fail: errors.length }))
    setSelectedIds([])
    return false
  }

  return (
    <PageContainer
      title={t('admin.productsList.title')}
      subTitle={t('admin.productsList.subtitle')}
      extra={[
        <Button key="quick" onClick={() => setQuickOpen(true)}>
          {t('admin.products.quickCreate')}
        </Button>,
        <Link key="new" to="/admin/products/new">
          <Button type="primary">{t('admin.products.fullCreate')}</Button>
        </Link>,
      ]}
    >
      <Space wrap style={{ marginBottom: 12 }}>
        <Input.Search
          allowClear
          placeholder={t('admin.productsList.searchPh')}
          value={qInput}
          onChange={(e) => setQInput(e.target.value)}
          style={{ width: 320 }}
        />
        <Select<StatusFilter>
          value={statusFilter}
          onChange={setStatusFilter}
          style={{ width: 160 }}
          options={[
            { value: 'all', label: t('admin.productsList.filterAll') },
            { value: 'active', label: t('admin.productsList.filterActive') },
            { value: 'inactive', label: t('admin.productsList.filterInactive') },
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
          {t('admin.productsList.reset')}
        </Button>
        <Button onClick={exportCsv}>{t('admin.productsList.exportCsv')}</Button>
        <Button onClick={downloadTemplate}>{t('admin.productsList.downloadTpl')}</Button>
        <Upload
          accept=".csv"
          showUploadList={false}
          beforeUpload={(file) => {
            void importCsv(file)
            return false
          }}
        >
          <Button>{t('admin.productsList.importCsv')}</Button>
        </Upload>
        <Popconfirm
          title={i18nTpl(t('admin.productsList.bulkOnConfirm'), { n: selectedIds.length })}
          disabled={selectedIds.length === 0}
          onConfirm={async () => {
            await bulkStatusMut.mutateAsync({ ids: selectedIds, isActive: true })
            message.success(i18nTpl(t('admin.productsList.bulkOnOk'), { n: selectedIds.length }))
            setSelectedIds([])
          }}
        >
          <Button disabled={selectedIds.length === 0} loading={bulkStatusMut.isPending}>
            {t('admin.productsList.bulkOn')}
          </Button>
        </Popconfirm>
        <Popconfirm
          title={i18nTpl(t('admin.productsList.bulkOffConfirm'), { n: selectedIds.length })}
          disabled={selectedIds.length === 0}
          onConfirm={async () => {
            await bulkStatusMut.mutateAsync({ ids: selectedIds, isActive: false })
            message.success(i18nTpl(t('admin.productsList.bulkOffOk'), { n: selectedIds.length }))
            setSelectedIds([])
          }}
        >
          <Button danger disabled={selectedIds.length === 0} loading={bulkStatusMut.isPending}>
            {t('admin.productsList.bulkOff')}
          </Button>
        </Popconfirm>
      </Space>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {i18nTpl(t('admin.productsList.pageSummary'), {
          total,
          page: page + 1,
          size: pageSize,
        })}
      </Typography.Text>
      <ProTable<ProductDto>
        rowKey="id"
        style={{ marginTop: 12 }}
        loading={listLoading}
        search={false}
        options={false}
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
          showTotal: (n) => i18nTpl(t('admin.productsList.showTotal'), { n }),
          onChange: (p, ps) => {
            setPage(p - 1)
            setPageSize(ps)
          },
        }}
      />
      <AdminProductQuickCreateModal open={quickOpen} onClose={() => setQuickOpen(false)} />
      <StandardModal
        title={t('admin.productsList.reportTitle')}
        open={Boolean(importSummary)}
        onCancel={() => setImportSummary(null)}
        footer={null}
        destroyOnClose
      >
        <Typography.Paragraph>
          {i18nTpl(t('admin.productsList.reportSummary'), {
            total: importSummary?.total ?? 0,
            ok: importSummary?.ok ?? 0,
            fail: importErrors.length,
          })}
        </Typography.Paragraph>
        <Table
          rowKey={(r) => `${r.line}-${r.reason}`}
          dataSource={importErrors}
          pagination={{ pageSize: 8 }}
          columns={[
            { title: t('admin.productsList.colLine'), dataIndex: 'line', width: 90 },
            { title: t('admin.productsList.colReason'), dataIndex: 'reason' },
          ]}
        />
      </StandardModal>
    </PageContainer>
  )
}
