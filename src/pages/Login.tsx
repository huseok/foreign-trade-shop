import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import './Auth.css'

export function Login() {
  const [msg, setMsg] = useState<string | null>(null)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMsg('Demo only — no server request was made.')
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
              Sign in
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
