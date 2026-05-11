/**
 * 管理后台商品列表：分页、筛选、CSV 导入导出与快捷新建。
 */
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { App, Button, Drawer, Input, Popconfirm, Select, Space, Switch, Table, Typography, Upload } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { Link, useNavigate } from 'react-router-dom'
import { queryKeys, useAdminBulkProductStatus, useAdminProductsPage, useMe } from '../../../hooks/apiHooks'
import { useI18n } from '../../../i18n/I18nProvider'
import { i18nTpl } from '../../../lib/i18nTpl'
import { productThumbUrl, resolveMediaUrl } from '../../../lib/media/resolveMediaUrl'
import type { ProductDto } from '../../../types/api'
import { voyage } from '../../../openapi/voyageSdk'
import { AdminProductQuickCreateModal } from '../../components/product/AdminProductQuickCreateModal'
import { StandardModal } from '../../components/shared/StandardModal'
import {
  applyProductCsvRow,
  defaultProductImportBase,
  parseCsvFile,
  productDtoToCsvLine,
  productDtoToImportBase,
  PRODUCT_CSV_HEADERS,
  rowCellsToRecord,
} from '../../lib/productCsv'

/** 展开行内默认预览的图片张数 */
const EXPAND_IMAGE_PREVIEW_COUNT = 6

function ProductExpandContent({ product }: { product: ProductDto }) {
  const { t } = useI18n()
  const [showAllImages, setShowAllImages] = useState(false)
  const imgs = product.images ?? []
  const visible = showAllImages ? imgs : imgs.slice(0, EXPAND_IMAGE_PREVIEW_COUNT)
  const restCount = Math.max(0, imgs.length - EXPAND_IMAGE_PREVIEW_COUNT)

  return (
    <div style={{ padding: '4px 0 12px', maxWidth: 960 }}>
      <div style={{ marginBottom: 8 }}>
        <Typography.Text strong>{t('admin.productsList.expandImagesSection')}</Typography.Text>
        {imgs.length === 0 ? (
          <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
            {t('admin.productsList.noImages')}
          </Typography.Text>
        ) : null}
      </div>
      {imgs.length > 0 ? (
        <>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {visible.map((img, idx) => {
              const src = resolveMediaUrl(img.fullUrl || img.thumbUrl)
              if (!src) return null
              return (
                <a key={`${src}-${idx}`} href={src} target="_blank" rel="noreferrer" title={src}>
                  <img
                    src={src}
                    alt=""
                    width={112}
                    height={112}
                    style={{
                      objectFit: 'cover',
                      borderRadius: 8,
                      border: '1px solid var(--adm-border, #f0f0f0)',
                      display: 'block',
                    }}
                  />
                </a>
              )
            })}
          </div>
          {restCount > 0 ? (
            <Button type="link" size="small" style={{ paddingLeft: 0, marginTop: 4 }} onClick={() => setShowAllImages(!showAllImages)}>
              {showAllImages ? t('admin.productsList.collapseImages') : i18nTpl(t('admin.productsList.expandMoreImages'), { n: restCount })}
            </Button>
          ) : null}
        </>
      ) : null}
      {product.description ? (
        <Typography.Paragraph style={{ marginTop: 12, marginBottom: 0 }} type="secondary">
          <Typography.Text strong style={{ color: 'rgba(0,0,0,0.88)' }}>
            {t('admin.productsList.expandDescriptionLabel')}
          </Typography.Text>
          <span style={{ display: 'block', marginTop: 6, whiteSpace: 'pre-wrap' }}>{product.description}</span>
        </Typography.Paragraph>
      ) : null}
    </div>
  )
}

type StatusFilter = 'all' | 'active' | 'inactive'

export function AdminProductListPage() {
  const { message } = App.useApp()
  const { t } = useI18n()
  const navigate = useNavigate()
  const qc = useQueryClient()
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
  const [previewProduct, setPreviewProduct] = useState<ProductDto | null>(null)
  const [switchBusyId, setSwitchBusyId] = useState<number | null>(null)
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

  const setProductActive = async (id: number, isActive: boolean) => {
    setSwitchBusyId(id)
    try {
      await bulkStatusMut.mutateAsync({ ids: [id], isActive })
      message.success(isActive ? t('admin.productsList.toggleEnabled') : t('admin.productsList.toggleDisabled'))
    } catch {
      message.error(t('admin.productsList.toggleFail'))
    } finally {
      setSwitchBusyId(null)
    }
  }

  const columns: ProColumns<ProductDto>[] = [
    { title: 'ID', dataIndex: 'id', width: 72, fixed: 'left' },
    {
      title: t('admin.productsList.colThumb'),
      key: 'thumb',
      width: 76,
      search: false,
      render: (_, r) => {
        const src = productThumbUrl(r)
        return (
          <Button
            type="text"
            aria-label={t('admin.productsList.thumbPreviewAria')}
            onClick={(e) => {
              e.stopPropagation()
              setPreviewProduct(r)
            }}
            style={{ height: 'auto', padding: 0 }}
          >
            {src ? (
              <img src={src} alt="" width={48} height={48} style={{ objectFit: 'cover', borderRadius: 4, display: 'block' }} />
            ) : (
              <Typography.Text type="secondary" style={{ display: 'flex', width: 48, height: 48, alignItems: 'center', justifyContent: 'center', borderRadius: 4, border: '1px solid #f0f0f0', background: '#fafafa' }}>
                —
              </Typography.Text>
            )}
          </Button>
        )
      },
    },
    { title: t('admin.productsList.colTitle'), dataIndex: 'title', ellipsis: true },
    { title: t('admin.productsList.colSku'), dataIndex: 'skuCode', width: 120, render: (v) => v ?? '?' },
    {
      title: t('admin.productsList.colPrice'),
      key: 'price',
      width: 140,
      search: false,
      render: (_, r) =>
        r.price == null ? '?' : `${r.currency ?? ''} ${Number(r.price).toFixed(2)}`,
    },
    { title: t('admin.productsList.colMoq'), dataIndex: 'moq', width: 80 },
    {
      title: t('admin.productsList.colStatus'),
      dataIndex: 'isActive',
      width: 120,
      search: false,
      render: (_, r) => (
        <div onClick={(e) => e.stopPropagation()} role="presentation">
          <Space size={8} align="center">
            <Switch
              checked={r.isActive}
              loading={switchBusyId === r.id && bulkStatusMut.isPending}
              onChange={(checked) => void setProductActive(r.id, checked)}
            />
            <Typography.Text>{r.isActive ? t('admin.productsList.statusOn') : t('admin.productsList.statusOff')}</Typography.Text>
          </Space>
        </div>
      ),
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
    const header = PRODUCT_CSV_HEADERS.join(',')
    const lines = rows.map(productDtoToCsvLine)
    const csv = `\ufeff${[header, ...lines].join('\n')}`
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'products-export.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const downloadTemplate = () => {
    const header = PRODUCT_CSV_HEADERS.join(',')
    const sample = [
      '',
      'Sample Product',
      '19.99',
      '',
      'USD',
      '2',
      'true',
      'short description',
      'SKU-001',
      '',
      'pcs',
      '',
      '',
      '',
      '',
      '',
      '',
    ].join(',')
    const csv = `\ufeff${[header, sample].join('\n')}`
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
    const parsed = parseCsvFile(text)
    if (!parsed) {
      message.warning(t('admin.productsList.csvEmpty'))
      return false
    }
    const { headers, rows: body } = parsed
    if (!headers.includes('title') || !headers.includes('price')) {
      message.warning(t('admin.productsList.errImportHeader'))
      return false
    }
    let ok = 0
    const errors: Array<{ line: number; reason: string }> = []
    for (let i = 0; i < body.length; i += 1) {
      const lineNo = i + 2
      const record = rowCellsToRecord(headers, body[i])
      const idRaw = (record.id ?? '').trim()
      const idNum = idRaw === '' ? NaN : Number(idRaw)

      if (Number.isFinite(idNum) && idNum > 0) {
        let existing
        try {
          existing = await voyage.products.adminGetById(idNum)
        } catch {
          errors.push({ line: lineNo, reason: t('admin.productsList.errImportIdNotFound') })
          continue
        }
        const base = productDtoToImportBase(existing)
        const merged = applyProductCsvRow(base, record, { isUpdate: true })
        if (!merged.ok) {
          errors.push({ line: lineNo, reason: `${t('admin.productsList.errImportMerge')}: ${merged.reason}` })
          continue
        }
        try {
          await voyage.products.adminUpdate(idNum, merged.payload)
          ok += 1
        } catch {
          errors.push({ line: lineNo, reason: t('admin.productsList.errApi') })
        }
      } else {
        const base = defaultProductImportBase()
        const merged = applyProductCsvRow(base, record, { isUpdate: false })
        if (!merged.ok) {
          errors.push({ line: lineNo, reason: `${t('admin.productsList.errImportMerge')}: ${merged.reason}` })
          continue
        }
        try {
          await voyage.products.adminCreate(merged.payload)
          ok += 1
        } catch {
          errors.push({ line: lineNo, reason: t('admin.productsList.errApi') })
        }
      }
    }
    setImportErrors(errors)
    setImportSummary({ ok, total: body.length })
    message.success(i18nTpl(t('admin.productsList.importDone'), { ok, fail: errors.length }))
    setSelectedIds([])
    void qc.invalidateQueries({ queryKey: queryKeys.productsRoot })
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
        <Button key="new" type="primary" onClick={() => navigate('/admin/products/new')}>
          {t('admin.products.fullCreate')}
        </Button>,
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
        onRow={(record) => ({
          onClick: (ev) => {
            const el = ev.target as HTMLElement
            if (el.closest('a, button, input, textarea, label, .ant-switch')) return
            const id = record.id
            setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
          },
        })}
        scroll={{ x: 720 }}
        pagination={{
          current: page + 1,
          pageSize,
          total,
          showSizeChanger: true,
          showTotal: (n) => i18nTpl(t('admin.productsList.showTotal'), { n }),
          className: 'admin-table-pagination',
          onChange: (p, ps) => {
            setPage(p - 1)
            setPageSize(ps)
          },
        }}
      />
      <Drawer
        title={previewProduct?.title ?? ''}
        placement="right"
        width={560}
        open={previewProduct != null}
        onClose={() => setPreviewProduct(null)}
        destroyOnClose
      >
        {previewProduct ? <ProductExpandContent product={previewProduct} /> : null}
      </Drawer>
      <AdminProductQuickCreateModal open={quickOpen} onClose={() => setQuickOpen(false)} />
      <StandardModal
        title={t('admin.productsList.reportTitle')}
        open={Boolean(importSummary)}
        onCancel={() => setImportSummary(null)}
        footer={null}
        destroyOnClose
        width={640}
        styles={{ body: { maxHeight: 'min(70vh, 480px)', overflowY: 'auto', paddingTop: 12 } }}
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
          size="small"
          dataSource={importErrors}
          pagination={{
            pageSize: 8,
            showSizeChanger: true,
            pageSizeOptions: ['8', '16', '32'],
            showTotal: (n) => i18nTpl(t('admin.productsList.showTotal'), { n }),
            className: 'admin-table-pagination',
          }}
          columns={[
            { title: t('admin.productsList.colLine'), dataIndex: 'line', width: 90 },
            { title: t('admin.productsList.colReason'), dataIndex: 'reason', ellipsis: true },
          ]}
        />
      </StandardModal>
    </PageContainer>
  )
}
