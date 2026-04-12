/**
 * 管理后台登录页（路径 `/admin/login`）。
 *
 * 与商城共用登录接口；登录成功后再调 `auth/me`，仅当 `role === 'ADMIN'` 时进入后台，
 * 否则清除 token 并提示无权限。
 */
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { App, Button, Card, Form, Input, Typography } from 'antd'
import { useLogin } from '../../hooks/apiHooks'
import { authStore } from '../../lib/auth/authStore'
import { scheduleAccessTokenRefresh } from '../../lib/http/apiClient'
import { voyage } from '../../openapi/voyageSdk'
import { toErrorMessage } from '../../lib/http/error'

type FormValues = { email: string; password: string }

export function AdminLogin() {
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
        const text = '该账号无管理员权限。'
        setMsg(text)
        message.warning(text)
        return
      }
      const redirectTo =
        (location.state as { from?: string } | undefined)?.from ?? '/admin/orders'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      const text = toErrorMessage(err, '登录失败')
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
      <Card style={{ width: 400, maxWidth: '100%' }} title="管理后台登录">
        <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
          与前台账号体系相同，仅 ADMIN 角色可进入后台。
        </Typography.Paragraph>
        <Form<FormValues> layout="vertical" requiredMark="optional" onFinish={onFinish}>
          <Form.Item
            label="邮箱"
            name="email"
            rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}
          >
            <Input autoComplete="email" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}>
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
              登录
            </Button>
          </Form.Item>
        </Form>
        {msg && (
          <Typography.Paragraph type="danger" style={{ marginBottom: 0 }}>
            {msg}
          </Typography.Paragraph>
        )}
        <Typography.Paragraph style={{ marginTop: 16, marginBottom: 0 }}>
          <Link to="/">返回商城首页</Link>
        </Typography.Paragraph>
      </Card>
    </div>
  )
}
