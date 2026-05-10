/**
 * 商城用户登录页（`/login`）。成功写入 token 后跳转 `location.state.from` 或首页。
 * 管理员请使用 **`/admin/login`**，以便 401 与路由守卫与后台一致。
 */
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLogin } from '../../hooks/apiHooks'
import { useI18n } from '../../i18n/I18nProvider'
import { authStore } from '../../lib/auth/authStore'
import { syncLocalCartToServer } from '../../lib/cart/localCart'
import { i18nTpl } from '../../lib/i18nTpl'
import { scheduleAccessTokenRefresh } from '../../lib/http/apiClient'
import { toErrorMessage } from '../../lib/http/error'
import { voyage } from '../../openapi/voyageSdk'
import './Auth.scss'

export function Login() {
  const { t } = useI18n()
  const [msg, setMsg] = useState<string | null>(null)
  const loginMutation = useLogin()
  const navigate = useNavigate()
  const location = useLocation()

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email') ?? '').trim()
    const password = String(fd.get('password') ?? '')
    try {
      const resp = await loginMutation.mutateAsync({ email, password })
      authStore.setSession(resp.accessToken, resp.refreshToken, resp.expiresIn)
      scheduleAccessTokenRefresh(resp.expiresIn)
      const syncResult = await syncLocalCartToServer(voyage.cart.addItem)
      if (syncResult.failedItems.length > 0) {
        setMsg(
          i18nTpl(t('auth.syncPartial'), {
            ok: String(syncResult.successCount),
            fail: String(syncResult.failedItems.length),
          }),
        )
      } else {
        setMsg(t('auth.syncOk'))
      }
      const redirectTo =
        (location.state as { from?: string } | undefined)?.from ?? '/'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setMsg(toErrorMessage(err, t('auth.failLogin')))
    }
  }

  return (
    <div className="auth page-pad">
      <div className="container auth__box">
        <div className="auth__card">
          <h1 className="auth__title">{t('auth.loginTitle')}</h1>
          <p className="auth__subtitle">{t('auth.loginSubtitle')}</p>
          <form className="auth__form" onSubmit={onSubmit}>
            <label className="field">
              <span className="field__label">{t('auth.email')}</span>
              <input
                className="input"
                type="email"
                name="email"
                required
                autoComplete="email"
              />
            </label>
            <label className="field">
              <span className="field__label">{t('auth.password')}</span>
              <input
                className="input"
                type="password"
                name="password"
                required
                autoComplete="current-password"
              />
            </label>
            <button
              type="submit"
              className="btn btn--primary btn--block"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? t('auth.signingIn') : t('auth.signIn')}
            </button>
          </form>
          {msg && <p className="auth__msg">{msg}</p>}
          <p className="auth__footer">
            {t('auth.noAccount')} <Link to="/register">{t('auth.createOne')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
