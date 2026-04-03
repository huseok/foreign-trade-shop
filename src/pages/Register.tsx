import { useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import './Auth.css'

export function Register() {
  const [msg, setMsg] = useState<string | null>(null)

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setMsg('Demo only — registration is not connected to a backend.')
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
              <span className="field__label">Company name</span>
              <input className="input" name="company" required autoComplete="organization" />
            </label>
            <label className="field">
              <span className="field__label">Work email</span>
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
                autoComplete="new-password"
                minLength={8}
              />
            </label>
            <label className="field field--checkbox">
              <input type="checkbox" name="terms" required />
              <span>
                I agree to the Terms and Privacy Policy (placeholder).
              </span>
            </label>
            <button type="submit" className="btn btn--primary btn--block">
              Register
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
