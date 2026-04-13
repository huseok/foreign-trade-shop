/**
 * 用户中心-浏览记录模块。
 */
import { Table } from 'antd'
import { useUserBrowseHistories } from '../../hooks/apiHooks'

export function UserHistoryPage() {
  const { data = [], isLoading } = useUserBrowseHistories(true)
  return (
    <section className="page-pad">
      <div className="container">
        <h1 className="page-header__title">浏览记录</h1>
        <p className="page-header__desc">回看你浏览过的商品，支持快速再次加购。</p>
        <Table
          style={{ marginTop: 16 }}
          rowKey="id"
          loading={isLoading}
          dataSource={data}
          columns={[
            { title: '记录ID', dataIndex: 'id', width: 100 },
            { title: '商品ID', dataIndex: 'productId' },
            { title: '浏览时间', dataIndex: 'viewedAt' },
          ]}
          pagination={false}
        />
      </div>
    </section>
  )
}
