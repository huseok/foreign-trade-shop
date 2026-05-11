/**
 * 管理后台登录页（路径 `/admin/login`）。
 *
 * 与商城共用登录接口；登录成功后再调 `auth/me`，仅当 `role === 'ADMIN'` 时进入后台，
 * 否则清除 token 并提示无权限。
 */
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { App, Button, Card, Form, Input, Typography } from 'antd'
import { useLogin } from '../../../hooks/apiHooks'
import { authStore } from '../../../lib/auth/authStore'
import { scheduleAccessTokenRefresh } from '../../../lib/http/apiClient'
import { voyage } from '../../../openapi/voyageSdk'
import { toErrorMessage } from '../../../lib/http/error'
import { useI18n } from '../../../i18n/I18nProvider'

type FormValues = { email: string; password: string }

export function AdminLogin() {
  const { t } = useI18n()
  const [msg, setMsg] = useState<string | null>(null)
  const loginMutation = useLogin()
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = App.useApp()

  const onFinish = async (values: FormValues) => {
    try {
      setMsg(null)
      const loginResp = await loginMutation.mutateAsync({
        email: values.email.trim(),
        password: values.password,
      })
      authStore.setSession(loginResp.accessToken, loginResp.refreshToken, loginResp.expiresIn)
      scheduleAccessTokenRefresh(loginResp.expiresIn)
      const me = await voyage.auth.me()
      if (me.role !== 'ADMIN') {
        authStore.clearToken()
        const text = t('admin.login.noAdminRole')
        setMsg(text)
        message.warning(text)
        return
      }
      const redirectTo =
        (location.state as { from?: string } | undefined)?.from ?? '/admin/orders'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const text = toErrorMessage(err, t('admin.login.fail'))
      setMsg(text)
      message.error(text)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #0f172a 0%, #134e4a 45%, #0f766e 100%)',
        padding: 24,
      }}
    >
      <Card style={{ width: 400, maxWidth: '100%' }} title={t('admin.login.title')}>
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          {t('admin.login.subtitle')}
        </Typography.Paragraph>
        <Form<FormValues> layout="vertical" requiredMark="optional" onFinish={onFinish}>
          <Form.Item
            label={t('admin.login.email')}
            name="email"
            rules={[{ required: true, type: 'email', message: t('admin.login.emailInvalid') }]}
          >
            <Input autoComplete="email" />
          </Form.Item>
          <Form.Item
            label={t('admin.login.password')}
            name="password"
            rules={[{ required: true, message: t('admin.login.passwordRequired') }]}
          >
            <Input.Password autoComplete="current-password" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              block
              loading={loginMutation.isPending}
              disabled={loginMutation.isPending}
            >
              {t('admin.login.submit')}
            </Button>
          </Form.Item>
        </Form>
        {msg && (
          <Typography.Paragraph type="danger" style={{ marginBottom: 0 }}>
            {msg}
          </Typography.Paragraph>
        )}
        <Typography.Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
          <Link to="/">{t('admin.login.backStore')}</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  )
}
