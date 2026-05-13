/**
 * 后台营销：优惠券（券码）与满减活动；与结账试算逻辑共用实体。
 */
import { App, Button, Card, Form, Input, InputNumber, Select, Space, Switch, Tabs, Typography } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import dayjs, { type Dayjs } from 'dayjs'
import { useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
import {
  useAdminCoupons,
  useAdminCreateCoupon,
  useAdminCreatePromotion,
  useAdminPatchCouponActive,
  useAdminPatchPromotionActive,
  useAdminPromotions,
  useAdminUpdateCoupon,
  useAdminUpdatePromotion,
} from '../../../hooks/apiHooks'
import { useI18n } from '../../../i18n/useI18n'
import { i18nTpl } from '../../../lib/i18nTpl'
import type { components } from '../../../generated/voyage-paths'
import { StandardModal } from '../../components/shared/StandardModal'

type S = components['schemas']
type CouponRow = S['CouponAdminView']
type PromotionRow = S['PromotionAdminView']

type CouponFormValues = Omit<S['CouponAdminUpsertRequest'], 'validFrom' | 'validTo'> & {
  validFrom: Dayjs
  validTo: Dayjs
}

type PromotionFormValues = Omit<S['PromotionAdminUpsertRequest'], 'validFrom' | 'validTo'> & {
  validFrom: Dayjs
  validTo: Dayjs
}

function toCouponPayload(v: CouponFormValues): S['CouponAdminUpsertRequest'] {
  return {
    code: v.code.trim(),
    name: v.name.trim(),
    discountType: v.discountType,
    discountValue: Number(v.discountValue),
    minOrderAmount: v.minOrderAmount != null ? Number(v.minOrderAmount) : 0,
    tagFilter: v.tagFilter?.trim() || undefined,
    validFrom: v.validFrom.toISOString(),
    validTo: v.validTo.toISOString(),
    isActive: v.isActive ?? true,
  }
}

function toPromotionPayload(v: PromotionFormValues): S['PromotionAdminUpsertRequest'] {
  return {
    name: v.name.trim(),
    thresholdAmount: Number(v.thresholdAmount),
    amountOff: Number(v.amountOff),
    tagFilter: v.tagFilter?.trim() || undefined,
    validFrom: v.validFrom.toISOString(),
    validTo: v.validTo.toISOString(),
    isActive: v.isActive ?? true,
  }
}

export function AdminMarketingPage() {
  const { t } = useI18n()
  const [tab, setTab] = useState('coupons')

  return (
    <PageContainer title={t('admin.marketing.title')} subTitle={t('admin.marketing.subtitle')}>
      <Tabs
        activeKey={tab}
        onChange={setTab}
        items={[
          { key: 'coupons', label: t('admin.marketing.tabCoupons'), children: <CouponsPanel /> },
          { key: 'promotions', label: t('admin.marketing.tabPromotions'), children: <PromotionsPanel /> },
        ]}
      />
    </PageContainer>
  )
}

function CouponsPanel() {
  const { t } = useI18n()
  const { message } = App.useApp()
  const { data: list = [], isLoading } = useAdminCoupons()
  const createMut = useAdminCreateCoupon()
  const updateMut = useAdminUpdateCoupon()
  const patchMut = useAdminPatchCouponActive()
  const [form] = Form.useForm<CouponFormValues>()
  const [editForm] = Form.useForm<CouponFormValues>()
  const [editing, setEditing] = useState<CouponRow | null>(null)
  const [keyword, setKeyword] = useState('')

  const filtered = useMemo(
    () =>
      list.filter((x) =>
        `${x.code} ${x.name} ${x.discountType}`.toLowerCase().includes(keyword.trim().toLowerCase()),
      ),
    [list, keyword],
  )

  const columns: ProColumns<CouponRow>[] = [
    { title: 'ID', dataIndex: 'id', width: 72, search: false },
    { title: t('admin.marketing.colCode'), dataIndex: 'code', width: 120, search: false },
    { title: t('admin.marketing.colName'), dataIndex: 'name', ellipsis: true, search: false },
    {
      title: t('admin.marketing.colDiscountType'),
      dataIndex: 'discountType',
      width: 88,
      search: false,
    },
    {
      title: t('admin.marketing.colDiscountValue'),
      dataIndex: 'discountValue',
      width: 100,
      search: false,
      render: (_, r) => (r.discountType.toUpperCase() === 'PERCENT' ? `${r.discountValue}%` : r.discountValue),
    },
    { title: t('admin.marketing.colMinOrder'), dataIndex: 'minOrderAmount', width: 100, search: false },
    {
      title: t('admin.marketing.colTagFilter'),
      dataIndex: 'tagFilter',
      ellipsis: true,
      search: false,
      render: (_, r) => r.tagFilter ?? '—',
    },
    {
      title: t('admin.marketing.colValid'),
      key: 'valid',
      width: 200,
      search: false,
      render: (_, r) => (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(r.validFrom).format('YYYY-MM-DD HH:mm')} ~ {dayjs(r.validTo).format('YYYY-MM-DD HH:mm')}
        </Typography.Text>
      ),
    },
    {
      title: t('admin.marketing.colActive'),
      dataIndex: 'isActive',
      width: 88,
      search: false,
      render: (_, r) => (
        <Switch
          checked={r.isActive}
          onChange={(v) => {
            void patchMut
              .mutateAsync({ id: r.id, isActive: v })
              .then(() => message.success(t('admin.marketing.statusUpdated')))
              .catch(() => message.error(t('admin.marketing.statusUpdateFail')))
          }}
        />
      ),
    },
    {
      title: t('admin.marketing.colActions'),
      key: 'actions',
      width: 88,
      search: false,
      render: (_, row) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setEditing(row)
            editForm.setFieldsValue({
              code: row.code,
              name: row.name,
              discountType: row.discountType.toUpperCase(),
              discountValue: Number(row.discountValue),
              minOrderAmount: Number(row.minOrderAmount),
              tagFilter: row.tagFilter ?? undefined,
              validFrom: dayjs(row.validFrom),
              validTo: dayjs(row.validTo),
              isActive: row.isActive,
            })
          }}
        >
          {t('admin.marketing.editBtn')}
        </Button>
      ),
    },
  ]

  return (
    <>
      <Card title={t('admin.marketing.couponCreateCard')} style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            discountType: 'PERCENT',
            minOrderAmount: 0,
            isActive: true,
            validFrom: dayjs(),
            validTo: dayjs().add(30, 'day'),
          }}
          onFinish={async (v) => {
            try {
              await createMut.mutateAsync(toCouponPayload(v))
              message.success(t('admin.marketing.couponCreated'))
              form.resetFields()
              form.setFieldsValue({
                discountType: 'PERCENT',
                minOrderAmount: 0,
                isActive: true,
                validFrom: dayjs(),
                validTo: dayjs().add(30, 'day'),
              })
            } catch {
              message.error(t('admin.marketing.couponCreateFail'))
            }
          }}
        >
          <Space wrap size="middle" align="start">
            <Form.Item name="code" label={t('admin.marketing.colCode')} rules={[{ required: true }]}>
              <Input style={{ width: 140 }} placeholder="SAVE10" />
            </Form.Item>
            <Form.Item name="name" label={t('admin.marketing.colName')} rules={[{ required: true }]}>
              <Input style={{ width: 180 }} />
            </Form.Item>
            <Form.Item name="discountType" label={t('admin.marketing.colDiscountType')} rules={[{ required: true }]}>
              <Select
                style={{ width: 120 }}
                options={[
                  { value: 'PERCENT', label: t('admin.marketing.typePercent') },
                  { value: 'FIXED', label: t('admin.marketing.typeFixed') },
                ]}
              />
            </Form.Item>
            <Form.Item
              noStyle
              shouldUpdate={(p, c) => p.discountType !== c.discountType}
            >
              {() => {
                const dt = form.getFieldValue('discountType') as string | undefined
                return (
                  <Form.Item
                    name="discountValue"
                    label={t('admin.marketing.colDiscountValue')}
                    rules={[
                      { required: true },
                      ...(dt === 'PERCENT'
                        ? [{ type: 'number' as const, max: 100, min: 0.01, message: t('admin.marketing.percentRange') }]
                        : [{ type: 'number' as const, min: 0.01, message: t('admin.marketing.fixedMin') }]),
                    ]}
                  >
                    <InputNumber style={{ width: 120 }} min={0.01} max={dt === 'PERCENT' ? 100 : undefined} step={0.01} />
                  </Form.Item>
                )
              }}
            </Form.Item>
            <Form.Item name="minOrderAmount" label={t('admin.marketing.colMinOrder')}>
              <InputNumber style={{ width: 120 }} min={0} step={0.01} />
            </Form.Item>
            <Form.Item name="tagFilter" label={t('admin.marketing.colTagFilter')}>
              <Input style={{ width: 200 }} placeholder={t('admin.marketing.tagFilterPh')} />
            </Form.Item>
            <Form.Item name="validFrom" label={t('admin.marketing.validFrom')} rules={[{ required: true }]}>
              <DateTimePicker style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="validTo" label={t('admin.marketing.validTo')} rules={[{ required: true }]}>
              <DateTimePicker style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="isActive" label={t('admin.marketing.colActive')} valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label=" ">
              <Button type="primary" htmlType="submit" loading={createMut.isPending}>
                {t('admin.marketing.createBtn')}
              </Button>
            </Form.Item>
          </Space>
        </Form>
      </Card>
      <Input
        allowClear
        placeholder={t('admin.marketing.keywordPh')}
        style={{ maxWidth: 320, marginBottom: 12 }}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <ProTable<CouponRow>
        rowKey="id"
        loading={isLoading}
        search={false}
        options={false}
        columns={columns}
        dataSource={filtered}
        pagination={false}
        footer={() => (
          <Typography.Text type="secondary">
            {i18nTpl(t('admin.marketing.footerCoupons'), { n: String(filtered.length) })}
          </Typography.Text>
        )}
      />
      <StandardModal
        title={t('admin.marketing.couponEditTitle')}
        open={Boolean(editing)}
        onCancel={() => setEditing(null)}
        onOk={() => void editForm.submit()}
        confirmLoading={updateMut.isPending}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={async (v) => {
            if (!editing) return
            try {
              await updateMut.mutateAsync({ id: editing.id, body: toCouponPayload(v) })
              message.success(t('admin.marketing.couponUpdated'))
              setEditing(null)
            } catch {
              message.error(t('admin.marketing.couponUpdateFail'))
            }
          }}
        >
          <Form.Item name="code" label={t('admin.marketing.colCode')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="name" label={t('admin.marketing.colName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="discountType" label={t('admin.marketing.colDiscountType')} rules={[{ required: true }]}>
            <Select
              options={[
                { value: 'PERCENT', label: t('admin.marketing.typePercent') },
                { value: 'FIXED', label: t('admin.marketing.typeFixed') },
              ]}
            />
          </Form.Item>
          <Form.Item
            noStyle
            shouldUpdate={(p, c) => p.discountType !== c.discountType}
          >
            {() => {
              const dt = editForm.getFieldValue('discountType') as string | undefined
              return (
                <Form.Item
                  name="discountValue"
                  label={t('admin.marketing.colDiscountValue')}
                  rules={[
                    { required: true },
                    ...(dt === 'PERCENT'
                      ? [{ type: 'number' as const, max: 100, min: 0.01, message: t('admin.marketing.percentRange') }]
                      : [{ type: 'number' as const, min: 0.01, message: t('admin.marketing.fixedMin') }]),
                  ]}
                >
                  <InputNumber style={{ width: '100%' }} min={0.01} max={dt === 'PERCENT' ? 100 : undefined} step={0.01} />
                </Form.Item>
              )
            }}
          </Form.Item>
          <Form.Item name="minOrderAmount" label={t('admin.marketing.colMinOrder')}>
            <InputNumber style={{ width: '100%' }} min={0} step={0.01} />
          </Form.Item>
          <Form.Item name="tagFilter" label={t('admin.marketing.colTagFilter')}>
            <Input placeholder={t('admin.marketing.tagFilterPh')} />
          </Form.Item>
          <Form.Item name="validFrom" label={t('admin.marketing.validFrom')} rules={[{ required: true }]}>
            <DateTimePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="validTo" label={t('admin.marketing.validTo')} rules={[{ required: true }]}>
            <DateTimePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isActive" label={t('admin.marketing.colActive')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </StandardModal>
    </>
  )
}

/** 本地时间与 ISO 互转，避免引入额外 dayjs 插件。 */
function DateTimePicker(props: { style?: CSSProperties; value?: Dayjs; onChange?: (v: Dayjs | null) => void }) {
  const { style, value, onChange } = props
  const str = value ? value.format('YYYY-MM-DDTHH:mm') : ''
  return (
    <input
      type="datetime-local"
      style={{ ...style, height: 32, padding: '4px 8px', borderRadius: 6, border: '1px solid #d9d9d9' }}
      value={str}
      onChange={(e) => {
        const v = e.target.value
        if (!v) {
          onChange?.(null)
          return
        }
        const d = dayjs(v)
        onChange?.(d.isValid() ? d : null)
      }}
    />
  )
}

function PromotionsPanel() {
  const { t } = useI18n()
  const { message } = App.useApp()
  const { data: list = [], isLoading } = useAdminPromotions()
  const createMut = useAdminCreatePromotion()
  const updateMut = useAdminUpdatePromotion()
  const patchMut = useAdminPatchPromotionActive()
  const [form] = Form.useForm<PromotionFormValues>()
  const [editForm] = Form.useForm<PromotionFormValues>()
  const [editing, setEditing] = useState<PromotionRow | null>(null)
  const [keyword, setKeyword] = useState('')

  const filtered = useMemo(
    () => list.filter((x) => x.name.toLowerCase().includes(keyword.trim().toLowerCase())),
    [list, keyword],
  )

  const columns: ProColumns<PromotionRow>[] = [
    { title: 'ID', dataIndex: 'id', width: 72, search: false },
    { title: t('admin.marketing.colName'), dataIndex: 'name', ellipsis: true, search: false },
    { title: t('admin.marketing.colThreshold'), dataIndex: 'thresholdAmount', width: 100, search: false },
    { title: t('admin.marketing.colAmountOff'), dataIndex: 'amountOff', width: 100, search: false },
    {
      title: t('admin.marketing.colTagFilter'),
      dataIndex: 'tagFilter',
      ellipsis: true,
      search: false,
      render: (_, r) => r.tagFilter ?? '—',
    },
    {
      title: t('admin.marketing.colValid'),
      key: 'valid',
      width: 200,
      search: false,
      render: (_, r) => (
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {dayjs(r.validFrom).format('YYYY-MM-DD HH:mm')} ~ {dayjs(r.validTo).format('YYYY-MM-DD HH:mm')}
        </Typography.Text>
      ),
    },
    {
      title: t('admin.marketing.colActive'),
      dataIndex: 'isActive',
      width: 88,
      search: false,
      render: (_, r) => (
        <Switch
          checked={r.isActive}
          onChange={(v) => {
            void patchMut
              .mutateAsync({ id: r.id, isActive: v })
              .then(() => message.success(t('admin.marketing.statusUpdated')))
              .catch(() => message.error(t('admin.marketing.statusUpdateFail')))
          }}
        />
      ),
    },
    {
      title: t('admin.marketing.colActions'),
      key: 'actions',
      width: 88,
      search: false,
      render: (_, row) => (
        <Button
          type="link"
          size="small"
          onClick={() => {
            setEditing(row)
            editForm.setFieldsValue({
              name: row.name,
              thresholdAmount: Number(row.thresholdAmount),
              amountOff: Number(row.amountOff),
              tagFilter: row.tagFilter ?? undefined,
              validFrom: dayjs(row.validFrom),
              validTo: dayjs(row.validTo),
              isActive: row.isActive,
            })
          }}
        >
          {t('admin.marketing.editBtn')}
        </Button>
      ),
    },
  ]

  return (
    <>
      <Card title={t('admin.marketing.promoCreateCard')} style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            isActive: true,
            validFrom: dayjs(),
            validTo: dayjs().add(30, 'day'),
          }}
          onFinish={async (v) => {
            if (Number(v.amountOff) > Number(v.thresholdAmount)) {
              message.error(t('admin.marketing.promoAmountExceed'))
              return
            }
            try {
              await createMut.mutateAsync(toPromotionPayload(v))
              message.success(t('admin.marketing.promoCreated'))
              form.resetFields()
              form.setFieldsValue({
                isActive: true,
                validFrom: dayjs(),
                validTo: dayjs().add(30, 'day'),
              })
            } catch {
              message.error(t('admin.marketing.promoCreateFail'))
            }
          }}
        >
          <Space wrap size="middle" align="start">
            <Form.Item name="name" label={t('admin.marketing.colName')} rules={[{ required: true }]}>
              <Input style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="thresholdAmount" label={t('admin.marketing.colThreshold')} rules={[{ required: true }]}>
              <InputNumber style={{ width: 140 }} min={0.01} step={0.01} />
            </Form.Item>
            <Form.Item name="amountOff" label={t('admin.marketing.colAmountOff')} rules={[{ required: true }]}>
              <InputNumber style={{ width: 140 }} min={0.01} step={0.01} />
            </Form.Item>
            <Form.Item name="tagFilter" label={t('admin.marketing.colTagFilter')}>
              <Input style={{ width: 200 }} placeholder={t('admin.marketing.tagFilterPh')} />
            </Form.Item>
            <Form.Item name="validFrom" label={t('admin.marketing.validFrom')} rules={[{ required: true }]}>
              <DateTimePicker style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="validTo" label={t('admin.marketing.validTo')} rules={[{ required: true }]}>
              <DateTimePicker style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="isActive" label={t('admin.marketing.colActive')} valuePropName="checked">
              <Switch />
            </Form.Item>
            <Form.Item label=" ">
              <Button type="primary" htmlType="submit" loading={createMut.isPending}>
                {t('admin.marketing.createBtn')}
              </Button>
            </Form.Item>
          </Space>
        </Form>
      </Card>
      <Input
        allowClear
        placeholder={t('admin.marketing.promoKeywordPh')}
        style={{ maxWidth: 320, marginBottom: 12 }}
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
      />
      <ProTable<PromotionRow>
        rowKey="id"
        loading={isLoading}
        search={false}
        options={false}
        columns={columns}
        dataSource={filtered}
        pagination={false}
        footer={() => (
          <Typography.Text type="secondary">
            {i18nTpl(t('admin.marketing.footerPromos'), { n: String(filtered.length) })}
          </Typography.Text>
        )}
      />
      <StandardModal
        title={t('admin.marketing.promoEditTitle')}
        open={Boolean(editing)}
        onCancel={() => setEditing(null)}
        onOk={() => void editForm.submit()}
        confirmLoading={updateMut.isPending}
        destroyOnClose
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={async (v) => {
            if (!editing) return
            if (Number(v.amountOff) > Number(v.thresholdAmount)) {
              message.error(t('admin.marketing.promoAmountExceed'))
              return
            }
            try {
              await updateMut.mutateAsync({ id: editing.id, body: toPromotionPayload(v) })
              message.success(t('admin.marketing.promoUpdated'))
              setEditing(null)
            } catch {
              message.error(t('admin.marketing.promoUpdateFail'))
            }
          }}
        >
          <Form.Item name="name" label={t('admin.marketing.colName')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="thresholdAmount" label={t('admin.marketing.colThreshold')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0.01} step={0.01} />
          </Form.Item>
          <Form.Item name="amountOff" label={t('admin.marketing.colAmountOff')} rules={[{ required: true }]}>
            <InputNumber style={{ width: '100%' }} min={0.01} step={0.01} />
          </Form.Item>
          <Form.Item name="tagFilter" label={t('admin.marketing.colTagFilter')}>
            <Input placeholder={t('admin.marketing.tagFilterPh')} />
          </Form.Item>
          <Form.Item name="validFrom" label={t('admin.marketing.validFrom')} rules={[{ required: true }]}>
            <DateTimePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="validTo" label={t('admin.marketing.validTo')} rules={[{ required: true }]}>
            <DateTimePicker style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="isActive" label={t('admin.marketing.colActive')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </StandardModal>
    </>
  )
}
