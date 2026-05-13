import { App, Alert, Button, Card, Form, Input, InputNumber, Space, Switch, Typography } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAdminProductSkuMatrix, useAdminUpsertProductSkuMatrix } from '../../../hooks/apiHooks'
import { useI18n } from '../../../i18n/useI18n'

type AttrInput = { name: string; values: string }
type MatrixRow = {
  key: string
  attrs: Record<string, string>
  skuCode: string
  salePrice: number
  stockQty: number
  weightKg?: number
  isActive: boolean
}

type BatchValues = {
  price?: number
  stock?: number
  weight?: number
  isActive?: boolean
}

function attrsKey(attrs: Record<string, string>): string {
  return Object.keys(attrs)
    .sort()
    .map((k) => `${k}:${attrs[k]}`)
    .join('|')
}

function cartesian(input: AttrInput[]): Array<Record<string, string>> {
  const valid = input
    .map((x) => ({
      name: x.name.trim(),
      values: x.values.split(',').map((v) => v.trim()).filter(Boolean),
    }))
    .filter((x) => x.name && x.values.length > 0)
  if (valid.length === 0) return []
  return valid.reduce<Array<Record<string, string>>>((acc, cur) => {
    const out: Array<Record<string, string>> = []
    for (const left of acc) {
      for (const v of cur.values) {
        out.push({ ...left, [cur.name]: v })
      }
    }
    return out
  }, [{}])
}

/**
 * SKU 规格矩阵页：
 * - 录入属性（建议 3 维）并自动生成笛卡尔积组合
 * - 按组合维护 SKU 价格/库存/重量/启用状态
 */
export function AdminProductSkuMatrixPage() {
  const { message } = App.useApp()
  const { t } = useI18n()
  const navigate = useNavigate()
  const { productId } = useParams<{ productId: string }>()
  const clientKey = productId?.trim() ?? ''
  const { data, isLoading } = useAdminProductSkuMatrix(clientKey || undefined)
  const upsertMut = useAdminUpsertProductSkuMatrix()
  const [attrs, setAttrs] = useState<AttrInput[]>([
    { name: 'Color', values: 'Black,White' },
    { name: 'Size', values: 'S,M,L' },
    { name: 'Pack', values: '1pc,2pc' },
  ])
  const [rows, setRows] = useState<MatrixRow[]>([])
  const [batch, setBatch] = useState<BatchValues>({})
  const validAttrCount = attrs.filter((x) => x.name.trim() && x.values.trim()).length
  const duplicatedSkuCodes = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of rows) {
      const key = r.skuCode.trim().toUpperCase()
      if (!key) continue
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .filter(([, count]) => count > 1)
      .map(([key]) => key)
  }, [rows])
  const duplicatedAttrCombos = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of rows) {
      const key = attrsKey(r.attrs)
      map.set(key, (map.get(key) ?? 0) + 1)
    }
    return Array.from(map.entries())
      .filter(([, count]) => count > 1)
      .map(([key]) => key)
  }, [rows])
  const canSave =
    rows.length > 0 &&
    validAttrCount >= 3 &&
    duplicatedSkuCodes.length === 0 &&
    duplicatedAttrCombos.length === 0

  useEffect(() => {
    if (!data) return
    queueMicrotask(() => {
      const grouped = new Map<string, Set<string>>()
      for (const opt of data.options) {
        if (!grouped.has(opt.optionName)) grouped.set(opt.optionName, new Set())
        grouped.get(opt.optionName)!.add(opt.optionValue)
      }
      if (grouped.size > 0) {
        setAttrs(
          Array.from(grouped.entries()).map(([name, values]) => ({
            name,
            values: Array.from(values).join(','),
          })),
        )
      }
      setRows(
        data.skus.map((x) => ({
          key: String(x.id),
          attrs: JSON.parse(x.attrJson) as Record<string, string>,
          skuCode: x.skuCode,
          salePrice: Number(x.salePrice),
          stockQty: x.stockQty,
          weightKg: x.weightKg ? Number(x.weightKg) : undefined,
          isActive: x.isActive,
        })),
      )
    })
  }, [data])

  const generateRows = () => {
    const combos = cartesian(attrs)
    if (combos.length === 0) {
      message.warning('请先配置规格属性与取值')
      return
    }
    const existedMap = new Map(rows.map((r) => [attrsKey(r.attrs), r]))
    const next = combos.map((combo, idx) => {
      const existed = existedMap.get(attrsKey(combo))
      return (
        existed ?? {
          key: `new-${idx}-${Date.now()}`,
          attrs: combo,
          skuCode: `SKU-${clientKey}-${idx + 1}`,
          salePrice: 0,
          stockQty: 0,
          weightKg: undefined,
          isActive: true,
        }
      )
    })
    setRows(next)
    message.success(`已生成 ${next.length} 个 SKU 组合`)
  }

  const applyBatch = () => {
    setRows((prev) =>
      prev.map((r) => ({
        ...r,
        salePrice: batch.price != null ? Number(batch.price) : r.salePrice,
        stockQty: batch.stock != null ? Number(batch.stock) : r.stockQty,
        weightKg: batch.weight != null ? Number(batch.weight) : r.weightKg,
        isActive: batch.isActive != null ? batch.isActive : r.isActive,
      }))
    )
    message.success('已应用批量设置')
  }

  const save = async () => {
    if (!clientKey) return
    if (validAttrCount < 3) {
      message.warning('至少配置 3 个属性维度')
      return
    }
    if (rows.length === 0) {
      message.warning('请先生成 SKU 组合')
      return
    }
    if (duplicatedSkuCodes.length > 0) {
      message.warning(`存在重复 SKU 编码：${duplicatedSkuCodes.join(', ')}`)
      return
    }
    if (duplicatedAttrCombos.length > 0) {
      message.warning('存在重复属性组合，请检查后再保存')
      return
    }
    try {
      await upsertMut.mutateAsync({
        id: clientKey,
        body: {
          options: attrs.flatMap((a, i) =>
            a.values
              .split(',')
              .map((v) => v.trim())
              .filter(Boolean)
              .map((v) => ({ optionName: a.name.trim(), optionValue: v, sortNo: i }))
          ),
          skus: rows.map((r) => ({
            skuCode: r.skuCode,
            attrJson: JSON.stringify(r.attrs),
            salePrice: Number(r.salePrice),
            stockQty: Number(r.stockQty),
            weightKg: r.weightKg,
            isActive: r.isActive,
          })),
        },
      })
      message.success('规格矩阵已保存')
      navigate('/admin/products')
    } catch {
      message.error('保存失败')
    }
  }

  const skuColumns: ProColumns<MatrixRow>[] = [
    {
      title: '属性组合',
      key: 'attrs',
      search: false,
      render: (_, r) => Object.entries(r.attrs).map(([k, v]) => `${k}:${v}`).join(' / '),
    },
    {
      title: 'SKU',
      key: 'skuCode',
      search: false,
      render: (_, r, idx) => (
        <Input
          status={duplicatedSkuCodes.includes(r.skuCode.trim().toUpperCase()) ? 'error' : undefined}
          value={r.skuCode}
          onChange={(e) =>
            setRows((prev) =>
              prev.map((x, i) => (i === idx ? { ...x, skuCode: e.target.value.toUpperCase() } : x))
            )
          }
        />
      ),
    },
    {
      title: '价格',
      key: 'salePrice',
      search: false,
      render: (_, r, idx) => (
        <InputNumber
          min={0.01}
          value={r.salePrice}
          onChange={(v) => setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, salePrice: Number(v ?? 0) } : x)))}
        />
      ),
    },
    {
      title: '库存',
      key: 'stockQty',
      search: false,
      render: (_, r, idx) => (
        <InputNumber
          min={0}
          value={r.stockQty}
          onChange={(v) => setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, stockQty: Number(v ?? 0) } : x)))}
        />
      ),
    },
    {
      title: '重量(kg)',
      key: 'weightKg',
      search: false,
      render: (_, r, idx) => (
        <InputNumber
          min={0}
          value={r.weightKg}
          onChange={(v) => setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, weightKg: v == null ? undefined : Number(v) } : x)))}
        />
      ),
    },
    {
      title: '启用',
      key: 'isActive',
      search: false,
      render: (_, r, idx) => (
        <Switch checked={r.isActive} onChange={(v) => setRows((prev) => prev.map((x, i) => (i === idx ? { ...x, isActive: v } : x)))} />
      ),
    },
  ]

  return (
    <PageContainer title={`SKU 规格矩阵（商品 ${clientKey}）`} subTitle="至少 3 个属性维度，生成笛卡尔积后维护价格/库存/重量">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {validAttrCount < 3 && (
        <Alert type="warning" showIcon message={t('admin.products.attrDimensionsWarning')} />
      )}
      <Card title="属性与生成" loading={isLoading}>
        <Typography.Paragraph type="secondary">建议至少 3 个属性，例如 Color / Size / Pack。</Typography.Paragraph>
        <Form layout="vertical">
          {attrs.map((a, i) => (
            <Space key={i} align="start">
              <Form.Item label={`属性${i + 1}名`}>
                <Input value={a.name} onChange={(e) => setAttrs((prev) => prev.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)))} />
              </Form.Item>
              <Form.Item label="属性值（逗号分隔）">
                <Input
                  style={{ width: 360 }}
                  value={a.values}
                  onChange={(e) => setAttrs((prev) => prev.map((x, idx) => (idx === i ? { ...x, values: e.target.value } : x)))}
                />
              </Form.Item>
            </Space>
          ))}
        </Form>
        <Space>
          <Button onClick={generateRows}>生成笛卡尔积组合</Button>
          <Button type="primary" onClick={() => void save()} loading={upsertMut.isPending} disabled={!canSave}>
            保存矩阵
          </Button>
        </Space>
      </Card>
      <Card title="批量设置（对全部已生成 SKU 生效）">
        <Space wrap>
          <InputNumber
            min={0.01}
            placeholder="统一价格"
            value={batch.price}
            onChange={(v) => setBatch((p) => ({ ...p, price: v == null ? undefined : Number(v) }))}
          />
          <InputNumber
            min={0}
            placeholder="统一库存"
            value={batch.stock}
            onChange={(v) => setBatch((p) => ({ ...p, stock: v == null ? undefined : Number(v) }))}
          />
          <InputNumber
            min={0}
            placeholder="统一重量kg"
            value={batch.weight}
            onChange={(v) => setBatch((p) => ({ ...p, weight: v == null ? undefined : Number(v) }))}
          />
          <Switch
            checked={batch.isActive ?? true}
            checkedChildren="统一启用"
            unCheckedChildren="统一停用"
            onChange={(v) => setBatch((p) => ({ ...p, isActive: v }))}
          />
          <Button onClick={applyBatch} disabled={rows.length === 0}>
            应用批量设置
          </Button>
        </Space>
      </Card>
      {(duplicatedSkuCodes.length > 0 || duplicatedAttrCombos.length > 0) && (
        <Card>
          {duplicatedSkuCodes.length > 0 && (
            <Typography.Text type="danger">
              检测到重复 SKU 编码：{duplicatedSkuCodes.join(', ')}
            </Typography.Text>
          )}
          {duplicatedAttrCombos.length > 0 && (
            <Typography.Paragraph type="danger" style={{ marginTop: 8, marginBottom: 0 }}>
              检测到重复属性组合，请确保每个组合仅保留一条 SKU。
            </Typography.Paragraph>
          )}
        </Card>
      )}
      <Card title="SKU 组合列表">
        <ProTable<MatrixRow>
          rowKey="key"
          search={false}
          options={false}
          columns={skuColumns}
          dataSource={rows}
          pagination={{ pageSize: 20, showSizeChanger: true }}
        />
      </Card>
    </Space>
    </PageContainer>
  )
}
