/**
 * 管理端简易数据看板：用户/商品/订单/售后与已支付流水汇总。
 */
import { Card, Col, Row, Spin, Statistic, Typography } from 'antd'
import { PageContainer } from '@ant-design/pro-components'
import { useAdminStatsSummary } from '../../../hooks/apiHooks'
import { useI18n } from '../../../i18n/useI18n'

export function AdminStatsPage() {
  const { t } = useI18n()
  const { data, isLoading } = useAdminStatsSummary()

  if (isLoading && !data) {
    return (
      <PageContainer title={t('admin.stats.title')}>
        <Spin />
      </PageContainer>
    )
  }

  const s = data!

  return (
    <PageContainer title={t('admin.stats.title')} subTitle={t('admin.stats.subtitle')}>
      <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
        {t('admin.stats.revenueNote')}
      </Typography.Paragraph>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title={t('admin.stats.users')} value={s.totalUsers} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title={t('admin.stats.newUsers7d')} value={s.newUsersLast7Days} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title={t('admin.stats.products')} value={s.totalProducts} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title={t('admin.stats.activeProducts')} value={s.activeProducts} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title={t('admin.stats.orders')} value={s.totalOrders} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title={t('admin.stats.orders7d')} value={s.ordersLast7Days} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title={t('admin.stats.pendingPayment')} value={s.pendingPaymentOrders} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title={t('admin.stats.paidOrders')} value={s.paidOrders} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title={t('admin.stats.paidRevenue')} value={s.paidRevenueTotal} prefix="USD " />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={8}>
          <Card>
            <Statistic title={t('admin.stats.afterSales')} value={s.totalAfterSales} />
          </Card>
        </Col>
      </Row>
    </PageContainer>
  )
}
