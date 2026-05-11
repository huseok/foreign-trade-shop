/**
 * 用户中心-浏览记录模块。
 */
import { Table } from 'antd'
import { Link } from 'react-router-dom'
import { UserCenterShell } from '../../../components/UserCenterShell'
import { useUserBrowseHistories } from '../../../hooks/apiHooks'
import { useI18n } from '../../../i18n/I18nProvider'

export function UserHistoryPage() {
  const { t } = useI18n()
  const { data = [], isLoading } = useUserBrowseHistories(true)
  return (
    <UserCenterShell>
      <h2 className="page-header__title" style={{ fontSize: '1.35rem', marginBottom: 8 }}>
        {t('user.historyTitle')}
      </h2>
      <p className="page-header__desc">{t('user.historyDesc')}</p>
      <Table
        style={{ marginTop: 16 }}
        rowKey="id"
        loading={isLoading}
        dataSource={data}
        columns={[
          { title: t('common.recordId'), dataIndex: 'id', width: 100 },
          {
            title: t('user.histColProductId'),
            dataIndex: 'productId',
            render: (id: number) => (
              <Link to={`/products/${id}`}>{id}</Link>
            ),
          },
          {
            title: t('common.viewedAt'),
            dataIndex: 'viewedAt',
          },
        ]}
        pagination={false}
      />
    </UserCenterShell>
  )
}
