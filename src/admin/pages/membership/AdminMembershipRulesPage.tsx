/**
 * 会员档位规则：累计已支付金额门槛 + 商品小计折扣百分比（与后端 [MembershipService] 一致）。
 */
import { App, Button, Card, Form, Input, InputNumber, Space, Switch, Typography } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { useMemo, useState } from 'react'
import {
  useAdminCreateMembershipTierRule,
  useAdminMembershipTierRules,
  useAdminPatchMembershipTierRuleActive,
  useAdminUpdateMembershipTierRule,
} from '../../../hooks/apiHooks'
import { useI18n } from '../../../i18n/I18nProvider'
import { i18nTpl } from '../../../lib/i18nTpl'
import type { components } from '../../../generated/voyage-paths'
import { StandardModal } from '../../components/shared/StandardModal'

type Row = components['schemas']['MembershipTierRuleAdminView']

export function AdminMembershipRulesPage() {
  const { t } = useI18n()
  const { message } = App.useApp()
  const { data: rawList = [], isLoading } = useAdminMembershipTierRules()
  const createMut = useAdminCreateMembershipTierRule()
  const updateMut = useAdminUpdateMembershipTierRule()
  const patchMut = useAdminPatchMembershipTierRuleActive()
  const [form] = Form.useForm<components['schemas']['MembershipTierRuleUpsertRequest']>()
  const [editForm] = Form.useForm<components['schemas']['MembershipTierRuleUpsertRequest']>()
  const [editing, setEditing] = useState<Row | null>(null)

  const rows = useMemo(() => [...rawList].sort((a, b) => a.sortNo - b.sortNo), [rawList])

  const columns: ProColumns<Row>[] = [
    { title: 'ID', dataIndex: 'id', width: 72, search: false },
    { title: t('admin.membershipRules.colTierCode'), dataIndex: 'tierCode', width: 120, search: false },
    {
      title: t('admin.membershipRules.colMinLifetime'),
      dataIndex: 'minLifetimePaidUsd',
      width: 140,
      search: false,
    },
    {
      title: t('admin.membershipRules.colDiscount'),
      dataIndex: 'discountPercent',
      width: 100,
      search: false,
      render: (_, r) => `${r.discountPercent}%`,
    },
    { title: t('admin.membershipRules.colSort'), dataIndex: 'sortNo', width: 72, search: false },
    {
      title: t('admin.membershipRules.colActive'),
      dataIndex: 'isActive',
      width: 88,
      search: false,
      render: (_, r) => (
        <Switch
          checked={r.isActive}
          onChange={(v) => {
            void patchMut
              .mutateAsync({ id: r.id, isActive: v })
              .then(() => message.success(t('admin.membershipRules.statusOk')))
              .catch(() => message.error(t('admin.membershipRules.statusFail')))
          }}
        />
      ),
    },
    {
      title: t('admin.membershipRules.colActions'),
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
              tierCode: row.tierCode,
              minLifetimePaidUsd: Number(row.minLifetimePaidUsd),
              discountPercent: row.discountPercent,
              sortNo: row.sortNo,
              isActive: row.isActive,
            })
          }}
        >
          {t('admin.membershipRules.editBtn')}
        </Button>
      ),
    },
  ]

  return (
    <PageContainer title={t('admin.membershipRules.title')} subTitle={t('admin.membershipRules.subtitle')}>
      <Card title={t('admin.membershipRules.createCard')} style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="inline"
          initialValues={{ sortNo: 10, isActive: true, discountPercent: 2, minLifetimePaidUsd: 1000 }}
          onFinish={async (v) => {
            try {
              await createMut.mutateAsync({
                tierCode: v.tierCode,
                minLifetimePaidUsd: Number(v.minLifetimePaidUsd),
                discountPercent: Number(v.discountPercent),
                sortNo: v.sortNo ?? 0,
                isActive: v.isActive ?? true,
              })
              message.success(t('admin.membershipRules.created'))
              form.resetFields()
              form.setFieldsValue({ sortNo: 10, isActive: true, discountPercent: 2, minLifetimePaidUsd: 1000 })
            } catch {
              message.error(t('admin.membershipRules.createFail'))
            }
          }}
        >
          <Form.Item name="tierCode" label={t('admin.membershipRules.colTierCode')} rules={[{ required: true }]}>
            <Input style={{ width: 120 }} placeholder="BRONZE" />
          </Form.Item>
          <Form.Item
            name="minLifetimePaidUsd"
            label={t('admin.membershipRules.colMinLifetime')}
            rules={[{ required: true, type: 'number', min: 0 }]}
          >
            <InputNumber style={{ width: 140 }} min={0} step={100} />
          </Form.Item>
          <Form.Item
            name="discountPercent"
            label={t('admin.membershipRules.colDiscount')}
            rules={[{ required: true, type: 'number', min: 0, max: 100 }]}
          >
            <InputNumber style={{ width: 100 }} min={0} max={100} />
          </Form.Item>
          <Form.Item name="sortNo" label={t('admin.membershipRules.colSort')}>
            <InputNumber style={{ width: 88 }} min={0} />
          </Form.Item>
          <Form.Item name="isActive" label={t('admin.membershipRules.colActive')} valuePropName="checked">
            <Switch />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={createMut.isPending}>
              {t('admin.membershipRules.createBtn')}
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <ProTable<Row>
        rowKey="id"
        loading={isLoading}
        search={false}
        options={false}
        columns={columns}
        dataSource={rows}
        pagination={false}
        footer={() => (
          <Typography.Text type="secondary">{i18nTpl(t('admin.membershipRules.footer'), { n: String(rows.length) })}</Typography.Text>
        )}
      />
      <StandardModal
        title={t('admin.membershipRules.editTitle')}
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
              await updateMut.mutateAsync({
                id: editing.id,
                body: {
                  tierCode: v.tierCode,
                  minLifetimePaidUsd: Number(v.minLifetimePaidUsd),
                  discountPercent: Number(v.discountPercent),
                  sortNo: v.sortNo ?? 0,
                  isActive: v.isActive ?? true,
                },
              })
              message.success(t('admin.membershipRules.updated'))
              setEditing(null)
            } catch {
              message.error(t('admin.membershipRules.updateFail'))
            }
          }}
        >
          <Form.Item name="tierCode" label={t('admin.membershipRules.colTierCode')} rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item
            name="minLifetimePaidUsd"
            label={t('admin.membershipRules.colMinLifetime')}
            rules={[{ required: true, type: 'number', min: 0 }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} step={100} />
          </Form.Item>
          <Form.Item
            name="discountPercent"
            label={t('admin.membershipRules.colDiscount')}
            rules={[{ required: true, type: 'number', min: 0, max: 100 }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} max={100} />
          </Form.Item>
          <Form.Item name="sortNo" label={t('admin.membershipRules.colSort')}>
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item name="isActive" label={t('admin.membershipRules.colActive')} valuePropName="checked">
            <Switch />
          </Form.Item>
        </Form>
      </StandardModal>
    </PageContainer>
  )
}
