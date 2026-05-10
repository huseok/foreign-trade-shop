/**
 * 管理端商品新建（`/admin/products/new`）或编辑（`/admin/products/:productId/edit`）。
 */
import { useEffect } from 'react'
import { App, Button, Card, Form, Result, Space, Spin, Typography } from 'antd'
import { PageContainer } from '@ant-design/pro-components'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { AdminProductUpsertFields } from '../components/AdminProductUpsertFields'
import {
  useCategories,
  useAdminProductDetail,
  useAdminTags,
  useCreateAdminProduct,
  useMe,
  useShippingTemplates,
  useUpdateAdminProduct,
} from '../../hooks/apiHooks'
import type { ProductDto } from '../../types/api'
import { toErrorMessage } from '../../lib/http/error'
import {
  adminProductFormValuesToPayload,
  type AdminProductFormValues,
} from '../lib/adminProductFormPayload'

type ProductFormOps = {
  setFieldsValue: (values: Partial<AdminProductFormValues>) => void
}

function productToFormValues(p: ProductDto): AdminProductFormValues {
  return {
    title: p.title,
    price: p.price != null ? Number(p.price) : 0,
    listPrice: p.listPrice != null ? Number(p.listPrice) : undefined,
    currency: p.currency ?? 'USD',
    moq: p.moq,
    description: p.description ?? undefined,
    skuCode: p.skuCode ?? undefined,
    hsCode: p.hsCode ?? undefined,
    unit: p.unit ?? undefined,
    incoterm: p.incoterm ?? undefined,
    originCountry: p.originCountry ?? undefined,
    leadTimeDays: p.leadTimeDays ?? undefined,
    weightKg: p.weightKg ?? undefined,
    categoryId: p.categoryId ?? undefined,
    shippingTemplateId: p.shippingTemplateId ?? undefined,
    tagIds: p.tags?.map((tg) => tg.id) ?? [],
    isActive: p.isActive,
    images: p.images?.map((i) => ({ thumbUrl: i.thumbUrl, fullUrl: i.fullUrl })) ?? [],
  }
}

export function AdminProductFormPage() {
  const { productId } = useParams<{ productId: string }>()
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [form] = Form.useForm<AdminProductFormValues>()

  const idNum = productId ? Number(productId) : NaN
  const isEdit = productId != null && productId !== 'new' && Number.isFinite(idNum)
  const productQueryId = isEdit ? idNum : undefined

  const { data: me, isLoading: meLoading } = useMe(true)
  const { data: product, isLoading: productLoading, isError } = useAdminProductDetail(productQueryId)
  const createMutation = useCreateAdminProduct()
  const updateMutation = useUpdateAdminProduct()
  const { data: categories = [] } = useCategories()
  const { data: shippingTemplates = [] } = useShippingTemplates()
  const { data: tagList = [] } = useAdminTags()

  useEffect(() => {
    if (product && isEdit) {
      ;(form as unknown as ProductFormOps).setFieldsValue(productToFormValues(product))
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
    <PageContainer
      style={{ maxWidth: 920, margin: '0 auto' }}
      title={isEdit ? `编辑商品：${product?.title ?? ''}` : '新建商品'}
      subTitle={isEdit ? `商品 ID #${idNum}` : '填写基础信息与分类、运费模板等'}
      breadcrumb={{
        items: [
          { title: <Link to="/admin/products">商品列表</Link> },
          { title: isEdit ? `编辑 #${idNum}` : '新建商品' },
        ],
      }}
    >
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card>
          <Form
            form={form}
            layout="vertical"
            onFinish={async (values: AdminProductFormValues) => {
              const payload = adminProductFormValuesToPayload(values)
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
            initialValues={{ currency: 'USD', moq: 1, isActive: true, images: [], tagIds: [] }}
          >
            <AdminProductUpsertFields
              categories={categories}
              shippingTemplates={shippingTemplates}
              tags={tagList.map((tg) => ({ id: tg.id, name: tg.name, code: tg.code, isActive: tg.isActive }))}
            />
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
    </PageContainer>
  )
}
