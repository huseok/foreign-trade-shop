/**
 * 用户注册页；提交走 `useRegister`（与登录一致经防重复合并），成功后引导至商城 `/login`。
 */
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRegister } from '../../hooks/apiHooks'
import { toErrorMessage } from '../../lib/http/error'
import './Auth.scss'

export function Register() {
  const [msg, setMsg] = useState<string | null>(null)
  const registerMutation = useRegister()
  const navigate = useNavigate()

  /**
   * 注册提交：
   * 先在后端创建账号，成功后引导用户去登录。
   */
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const payload = {
      name: String(fd.get('name') ?? '').trim(),
      email: String(fd.get('email') ?? '').trim(),
      password: String(fd.get('password') ?? ''),
      phone: String(fd.get('phone') ?? '').trim() || undefined,
      country: String(fd.get('country') ?? '').trim() || undefined,
    }
    try {
      await registerMutation.mutateAsync(payload)
      setMsg('Register successful. Redirecting to sign in...')
      setTimeout(() => navigate('/login'), 800)
    } catch (err) {
      setMsg(toErrorMessage(err, 'Registration failed'))
    }
  }

  return (
    <div className="auth page-pad">
      <div className="container auth__box">
        <div className="auth__card">
          <h1 className="auth__title">Create account</h1>
          <p className="auth__subtitle">
            Procurement teams — use your company email (UI placeholder).
          </p>
          <form className="auth__form" onSubmit={onSubmit}>
            <label className="field">
              <span className="field__label">Full name</span>
              <input className="input" name="name" required autoComplete="name" />
            </label>
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
              <span className="field__label">Phone (optional)</span>
              <input className="input" name="phone" autoComplete="tel" />
            </label>
            <label className="field">
              <span className="field__label">Country (optional)</span>
              <input className="input" name="country" autoComplete="country-name" />
            </label>
            <label className="field">
              <span className="field__label">Password</span>
              <input
                className="input"
                type="password"
                name="password"
                required
                autoComplete="new-password"
                minLength={6}
              />
            </label>
            <label className="field field--checkbox">
              <input type="checkbox" name="terms" required />
              <span>
                I agree to the Terms and Privacy Policy (placeholder).
              </span>
            </label>
            <button
              type="submit"
              className="btn btn--primary btn--block"
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? 'Registering...' : 'Register'}
            </button>
          </form>
          {msg && <p className="auth__msg">{msg}</p>}
          <p className="auth__footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
