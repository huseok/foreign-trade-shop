import { QuestionCircleOutlined } from '@ant-design/icons'
import { App, Button, Card, Form, Input, Space, Tooltip, Typography } from 'antd'
import { PageContainer, ProTable } from '@ant-design/pro-components'
import type { ProColumns } from '@ant-design/pro-components'
import { useAdminCreateDictItem, useAdminCreateDictType, useDictTypes } from '../../../hooks/apiHooks'
import { useI18n } from '../../../i18n/useI18n'

type DictTypeRow = { dictCode: string; dictName: string }

/**
 * 字典管理页：字典类型与字典项的新增入口。
 */
export function AdminDictsPage() {
  const { t } = useI18n()
  const { message } = App.useApp()
  const { data = [], isLoading } = useDictTypes()
  const createType = useAdminCreateDictType()
  const createItem = useAdminCreateDictItem()

  const columns: ProColumns<DictTypeRow>[] = [
    { title: t('admin.dicts.colCode'), dataIndex: 'dictCode', search: false },
    { title: t('admin.dicts.colName'), dataIndex: 'dictName', search: false },
  ]

  const helpParagraphs = t('admin.dicts.helpBody').split(/\n\n+/).filter(Boolean)

  return (
    <PageContainer
      title={
        <Space align="center" size={8}>
          <span>{t('admin.dicts.title')}</span>
          <Tooltip
            title={
              <div style={{ maxWidth: 380 }}>
                {helpParagraphs.map((para, i) => (
                  <p key={i} style={{ margin: i === 0 ? 0 : '10px 0 0', lineHeight: 1.55 }}>
                    {para}
                  </p>
                ))}
              </div>
            }
            placement="bottomLeft"
            mouseEnterDelay={0.05}
            overlayStyle={{ maxWidth: 400 }}
          >
            <QuestionCircleOutlined
              tabIndex={0}
              aria-label={t('admin.dicts.helpAria')}
              style={{ cursor: 'help', color: 'rgba(0,0,0,0.45)', fontSize: 16 }}
            />
          </Tooltip>
        </Space>
      }
      subTitle={t('admin.dicts.subtitle')}
    >
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Card title={t('admin.dicts.cardNewType')}>
          <Form
            layout="inline"
            onFinish={async (v: { dictCode: string; dictName: string }) => {
              try {
                await createType.mutateAsync(v)
                message.success(t('admin.dicts.typeCreated'))
              } catch {
                message.error(t('admin.dicts.typeCreateFail'))
              }
            }}
          >
            <Form.Item
              name="dictCode"
              rules={[{ required: true }, { pattern: /^[A-Z0-9_]+$/, message: t('admin.dicts.codePattern') }]}
            >
              <Input placeholder={t('admin.dicts.codePh')} />
            </Form.Item>
            <Form.Item name="dictName" rules={[{ required: true }]}>
              <Input placeholder={t('admin.dicts.namePh')} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={createType.isPending}>
              {t('admin.dicts.create')}
            </Button>
          </Form>
        </Card>
        <Card title={t('admin.dicts.cardNewItem')}>
          <Form
            layout="inline"
            onFinish={async (v: { dictCode: string; itemCode: string; itemLabel: string; sortNo?: number }) => {
              try {
                await createItem.mutateAsync(v)
                message.success(t('admin.dicts.itemCreated'))
              } catch {
                message.error(t('admin.dicts.itemCreateFail'))
              }
            }}
          >
            <Form.Item name="dictCode" rules={[{ required: true }]}>
              <Input placeholder={t('admin.dicts.dictCodePh')} />
            </Form.Item>
            <Form.Item name="itemCode" rules={[{ required: true }]}>
              <Input placeholder={t('admin.dicts.itemCodePh')} />
            </Form.Item>
            <Form.Item name="itemLabel" rules={[{ required: true }]}>
              <Input placeholder={t('admin.dicts.itemLabelPh')} />
            </Form.Item>
            <Button type="primary" htmlType="submit" loading={createItem.isPending}>
              {t('admin.dicts.create')}
            </Button>
          </Form>
        </Card>
        <Card title={t('admin.dicts.cardList')}>
          <ProTable<DictTypeRow>
            rowKey="dictCode"
            loading={isLoading}
            search={false}
            options={false}
            columns={columns}
            dataSource={data}
            pagination={false}
            footer={() => (
              <Typography.Text type="secondary">{t('admin.dicts.footerApiHint')}</Typography.Text>
            )}
          />
        </Card>
      </Space>
    </PageContainer>
  )
}
