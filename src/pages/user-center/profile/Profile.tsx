/**
 * 用户中心-账户资料：`useMe` 展示邮箱、姓名与角色。
 */
import { Card, Descriptions } from 'antd'
import { UserCenterShell } from '../../../components/UserCenterShell'
import { useMe } from '../../../hooks/apiHooks'
import { useI18n } from '../../../i18n/I18nProvider'

export function UserProfilePage() {
  const { t } = useI18n()
  const { data: me, isLoading } = useMe(true)

  return (
    <UserCenterShell>
      <h2 className="page-header__title" style={{ fontSize: '1.35rem', marginBottom: 8 }}>
        {t('user.profileTitle')}
      </h2>
      <p className="page-header__desc">{t('user.profileDesc')}</p>
      <Card loading={isLoading} style={{ marginTop: 16 }}>
        {me && (
          <Descriptions column={1} size="small">
            <Descriptions.Item label={t('user.profileUserId')}>{me.id}</Descriptions.Item>
            <Descriptions.Item label={t('user.profileEmail')}>{me.email}</Descriptions.Item>
            <Descriptions.Item label={t('user.profileName')}>{me.name}</Descriptions.Item>
            <Descriptions.Item label={t('user.profileRole')}>{me.role}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>
    </UserCenterShell>
  )
}
