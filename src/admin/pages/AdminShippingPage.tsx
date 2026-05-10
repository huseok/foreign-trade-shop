import { App, Button, Card, Form, Input, InputNumber, Popconfirm, Select, Space } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { useState } from 'react'
import {
  useAdminCreateShippingRule,
  useAdminCreateShippingTemplate,
  useAdminDeleteShippingRule,
  useShippingTemplateRules,
  useShippingTemplates,
} from '../../hooks/apiHooks'
import { useI18n } from '../../i18n/I18nProvider'

type TemplateRow = { id: number; templateName: string; billingMode: string; isActive: boolean }
type RuleRow = {
  id: number
  templateId: number
  regionCode: string
  firstWeightKg: number
  firstFee: number
  additionalWeightKg: number
  additionalFee: number
  sortNo: number
}

/**
 * 运费模板管理：模板创建 + 规则创建（按重量计费）。
 */
export function AdminShippingPage() {
  const { t } = useI18n()
  const { message } = App.useApp()
  const { data = [], isLoading } = useShippingTemplates()
  const createTpl = useAdminCreateShippingTemplate()
  const createRule = useAdminCreateShippingRule()
  const deleteRule = useAdminDeleteShippingRule()
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | undefined>(undefined)
  const { data: rules = [], refetch: refetchRules } = useShippingTemplateRules(selectedTemplateId)

  const templateColumns: ProColumns<TemplateRow>[] = [
    { title: t('admin.shipping.colId'), dataIndex: 'id', width: 80, search: false },
    { title: t('admin.shipping.colTplName'), dataIndex: 'templateName', search: false },
    { title: t('admin.shipping.colBilling'), dataIndex: 'billingMode', search: false },
    {
      title: t('admin.shipping.colStatus'),
      dataIndex: 'isActive',
      width: 90,
      search: false,
      render: (_, r) => (r.isActive ? t('admin.shipping.active') : t('admin.shipping.inactive')),
    },
  ]

  const ruleColumns: ProColumns<RuleRow>[] = [
    { title: t('admin.shipping.colRuleId'), dataIndex: 'id', width: 90, search: false },
    { title: t('admin.shipping.colRegion'), dataIndex: 'regionCode', search: false },
    { title: t('admin.shipping.colFirstKg'), dataIndex: 'firstWeightKg', search: false },
    { title: t('admin.shipping.colFirstFee'), dataIndex: 'firstFee', search: false },
    { title: t('admin.shipping.colAddKg'), dataIndex: 'additionalWeightKg', search: false },
    { title: t('admin.shipping.colAddFee'), dataIndex: 'additionalFee', search: false },
    {
      title: t('admin.shipping.colActions'),
      key: 'actions',
      width: 100,
      search: false,
      render: (_, row) => (
        <Popconfirm
          title={t('admin.shipping.deleteRuleConfirm')}
          onConfirm={async () => {
            try {
              await deleteRule.mutateAsync(row.id)
              message.success(t('admin.shipping.ruleDeleted'))
              void refetchRules()
            } catch {
              message.error(t('admin.shipping.ruleDeleteFail'))
            }
          }}
        >
          <Button type="link" danger>
            {t('admin.tags.deleteBtn')}
          </Button>
        </Popconfirm>
      ),
    },
  ]

  return (
    <PageContainer title={t('admin.shipping.title')} subTitle={t('admin.shipping.subtitle')}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title={t('admin.shipping.cardNewTpl')}>
          <Form
            layout="inline"
            onFinish={async (v: { templateName: string; billingMode: string }) => {
              try {
                await createTpl.mutateAsync(v)
                message.success(t('admin.shipping.tplCreated'))
              } catch {
                message.error(t('admin.shipping.tplCreateFail'))
              }
            }}
          >
            <Form.Item name="templateName" rules={[{ required: true, message: t('admin.shipping.tplNameRequired') }]}>
              <Input placeholder={t('admin.shipping.tplNamePh')} />
            </Form.Item>
            <Form.Item name="billingMode" initialValue="BY_WEIGHT">
              <Select style={{ width: 160 }} options={[{ value: 'BY_WEIGHT' }, { value: 'FLAT' }]} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={createTpl.isPending}>
              {t('admin.shipping.createTpl')}
            </Button>
          </Form>
        </Card>
        <Card title={t('admin.shipping.cardNewRule')}>
          <Form
            layout="inline"
            onFinish={async (v: {
              templateId: number
              firstWeightKg: number
              firstFee: number
              additionalWeightKg: number
              additionalFee: number
              regionCode?: string
            }) => {
              try {
                await createRule.mutateAsync(v)
                message.success(t('admin.shipping.ruleCreated'))
              } catch {
                message.error(t('admin.shipping.ruleCreateFail'))
              }
            }}
          >
            <Form.Item name="templateId" rules={[{ required: true }]}>
              <Select
                style={{ width: 220 }}
                placeholder={t('admin.shipping.selectTpl')}
                options={data.map((x) => ({ value: x.id, label: `${x.id} - ${x.templateName}` }))}
                onChange={(value) => setSelectedTemplateId(value)}
              />
            </Form.Item>
            <Form.Item name="firstWeightKg" rules={[{ required: true }]}>
              <InputNumber placeholder={t('admin.shipping.firstKgPh')} min={0} />
            </Form.Item>
            <Form.Item name="firstFee" rules={[{ required: true }]}>
              <InputNumber placeholder={t('admin.shipping.firstFeePh')} min={0} />
            </Form.Item>
            <Form.Item name="additionalWeightKg" rules={[{ required: true }]}>
              <InputNumber placeholder={t('admin.shipping.addKgPh')} min={0.001} step={0.1} />
            </Form.Item>
            <Form.Item name="additionalFee" rules={[{ required: true }]}>
              <InputNumber placeholder={t('admin.shipping.addFeePh')} min={0} />
            </Form.Item>
            <Form.Item name="regionCode" initialValue="GLOBAL">
              <Input placeholder={t('admin.shipping.regionPh')} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={createRule.isPending}>
              {t('admin.shipping.createRule')}
            </Button>
          </Form>
        </Card>
        <Card title={t('admin.shipping.cardTplList')}>
          <ProTable<TemplateRow>
            rowKey="id"
            loading={isLoading}
            search={false}
            options={false}
            columns={templateColumns}
            dataSource={data as TemplateRow[]}
            pagination={false}
          />
        </Card>
        <Card title={t('admin.shipping.cardRuleList')}>
          <ProTable<RuleRow>
            rowKey="id"
            search={false}
            options={false}
            columns={ruleColumns}
            dataSource={rules as RuleRow[]}
            pagination={false}
          />
        </Card>
      </Space>
    </PageContainer>
  )
}
