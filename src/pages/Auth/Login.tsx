import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useLogin } from '../../hooks/apiHooks'
import { authStore } from '../../lib/auth/authStore'
import { toErrorMessage } from '../../lib/http/error'
import './Auth.scss'

export function Login() {
  const [msg, setMsg] = useState<string | null>(null)
  const loginMutation = useLogin()
  const navigate = useNavigate()
  const location = useLocation()

  /**
   * 登录提交：
   * 调用后端接口拿 token，保存后跳转到原访问页或首页。
   */
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const email = String(fd.get('email') ?? '').trim()
    const password = String(fd.get('password') ?? '')
    try {
      const resp = await loginMutation.mutateAsync({ email, password })
      authStore.setToken(resp.token)
      setMsg('Sign in successful.')
      const redirectTo =
        (location.state as { from?: string } | undefined)?.from ?? '/'
      navigate(redirectTo, { replace: true })
    } catch (err) {
      setMsg(toErrorMessage(err, 'Sign in failed'))
    }
  }

  return (
    <div className="auth page-pad">
      <div className="container auth__box">
        <div className="auth__card">
          <h1 className="auth__title">Sign in</h1>
          <p className="auth__subtitle">
            Access quotes, orders, and saved addresses (UI placeholder).
          </p>
          <form className="auth__form" onSubmit={onSubmit}>
            <label className="field">
              <span className="field__label">Email</span>
              <input
                className="input"
                type="email"
                name="email"
                required
                autoComplete="email"
              />
            </label>
            <label className="field">
              <span className="field__label">Password</span>
              <input
                className="input"
                type="password"
                name="password"
                required
                autoComplete="current-password"
              />
            </label>
            <button type="submit" className="btn btn--primary btn--block">
              {loginMutation.isPending ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
          {msg && <p className="auth__msg">{msg}</p>}
          <p className="auth__footer">
            No account? <Link to="/register">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
