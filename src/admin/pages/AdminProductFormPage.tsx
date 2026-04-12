/**
 * 管理端商品新建（`/admin/products/new`）或编辑（`/admin/products/:productId/edit`）。
 */
import { useEffect } from 'react'
import { App, Breadcrumb, Button, Card, Form, Result, Space, Spin, Typography } from 'antd'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AdminProductUpsertFields } from '../components/AdminProductUpsertFields'
import {
  useAdminProductDetail,
  useCreateAdminProduct,
  useMe,
  useUpdateAdminProduct,
} from '../../hooks/apiHooks'
import type { AdminProductUpsertRequest, ProductDto } from '../../types/api'
import { toErrorMessage } from '../../lib/http/error'

function valuesToPayload(values: Record<string, unknown>): AdminProductUpsertRequest {
  return {
    title: String(values.title ?? '').trim(),
    price: Number(values.price),
    currency: String(values.currency ?? '').trim().toUpperCase(),
    moq: Number(values.moq),
    description: values.description ? String(values.description).trim() : undefined,
    skuCode: values.skuCode ? String(values.skuCode).trim() : undefined,
    hsCode: values.hsCode ? String(values.hsCode).trim() : undefined,
    unit: values.unit ? String(values.unit).trim() : undefined,
    incoterm: values.incoterm ? String(values.incoterm).trim().toUpperCase() : undefined,
    originCountry: values.originCountry ? String(values.originCountry).trim() : undefined,
    leadTimeDays:
      values.leadTimeDays === undefined || values.leadTimeDays === null || values.leadTimeDays === ''
        ? undefined
        : Number(values.leadTimeDays),
    isActive: Boolean(values.isActive),
  }
}

function productToFormValues(p: ProductDto) {
  return {
    title: p.title,
    price: p.price ?? undefined,
    currency: p.currency ?? 'USD',
    moq: p.moq,
    description: p.description ?? undefined,
    skuCode: p.skuCode ?? undefined,
    hsCode: p.hsCode ?? undefined,
    unit: p.unit ?? undefined,
    incoterm: p.incoterm ?? undefined,
    originCountry: p.originCountry ?? undefined,
    leadTimeDays: p.leadTimeDays ?? undefined,
    isActive: p.isActive,
  }
}

export function AdminProductFormPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm()

  const idNum = productId ? Number(productId) : NaN
  const isEdit = productId != null && productId !== 'new' && Number.isFinite(idNum)
  const productQueryId = isEdit ? idNum : undefined

  const { data: me, isLoading: meLoading } = useMe(true)
  const { data: product, isLoading: productLoading, isError } = useAdminProductDetail(productQueryId)
  const createMutation = useCreateAdminProduct()
  const updateMutation = useUpdateAdminProduct()

  useEffect(() => {
    if (product && isEdit) {
      form.setFieldsValue(productToFormValues(product))
    }
  }, [product, isEdit, form])

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

  if (isEdit && (Number.isNaN(idNum) || idNum <= 0)) {
    return (
      <Result
        status="404"
        title="无效的商品 ID"
        extra={
          <Button type="primary" onClick={() => navigate('/admin/products')}>
            返回商品列表
          </Button>
        }
      />
    )
  }

  if (isEdit && productLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <Spin size="large" tip="加载商品…" />
      </div>
    )
  }

  if (isEdit && (isError || !product)) {
    return (
      <Result
        status="warning"
        title="未找到该商品"
        extra={
          <Button type="primary" onClick={() => navigate('/admin/products')}>
            返回商品列表
          </Button>
        }
      />
    )
  }

  const submitting = createMutation.isPending || updateMutation.isPending

  return (
    <div style={{ maxWidth: 920, margin: '0 auto' }}>
      <Space orientation="vertical" size="large" style={{ width: '100%' }}>
        <Breadcrumb
          items={[
            { title: <Link to="/admin/products">商品列表</Link> },
            { title: isEdit ? `编辑 #${idNum}` : '新建商品' },
          ]}
        />

        <Typography.Title level={4} style={{ margin: 0 }}>
          {isEdit ? `编辑商品：${product?.title ?? ''}` : '新建商品'}
        </Typography.Title>

        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={async (values) => {
              const payload = valuesToPayload(values)
              try {
                if (isEdit && product) {
                  await updateMutation.mutateAsync({ id: product.id, payload })
                  message.success('已保存')
                  navigate('/admin/products')
                } else {
                  const resp = await createMutation.mutateAsync(payload)
                  message.success(`已创建，ID=${resp.id}`)
                  navigate('/admin/products')
                }
              } catch (err) {
                message.error(toErrorMessage(err, isEdit ? '保存失败' : '创建失败'))
              }
            }}
            initialValues={{ currency: 'USD', moq: 1, isActive: true }}
          >
            <AdminProductUpsertFields />
            <Form.Item style={{ marginBottom: 0 }}>
              <Space wrap>
                <Button type="primary" htmlType="submit" loading={submitting} disabled={submitting}>
                  {isEdit ? '保存' : '创建'}
                </Button>
                <Button onClick={() => navigate('/admin/products')} disabled={submitting}>
                  取消
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </div>
  )
}
