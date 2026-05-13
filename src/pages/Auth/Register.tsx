/**
 * 用户注册页：图形验证码 + `useRegister`；须填写称呼（与后端 [RegisterRequest.salutation] 一致）；成功后跳转 `/login`。
 */
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRegister } from '../../hooks/apiHooks'
import { useI18n } from '../../i18n/useI18n'
import type { RegisterRequest } from '../../types/api'
import { toErrorMessage } from '../../lib/http/error'
import { voyage } from '../../openapi/voyageSdk'
import './Auth.scss'

function registerErrorMessage(err: unknown, t: (key: string) => string): string {
  const raw = toErrorMessage(err, '')
  if (raw === 'invalid captcha') return t('auth.failCaptcha')
  if (raw.trim()) return raw
  return t('auth.failRegister')
}

export function Register() {
  const { t } = useI18n()
  const [msg, setMsg] = useState<string | null>(null)
  const [captchaId, setCaptchaId] = useState('')
  const [captchaImg, setCaptchaImg] = useState('')
  const registerMutation = useRegister()
  const navigate = useNavigate()

  const loadCaptcha = useCallback(async () => {
    try {
      const r = await voyage.auth.getCaptcha()
      setCaptchaId(r.captchaId)
      setCaptchaImg(r.imageBase64)
      setMsg(null)
    } catch {
      setCaptchaId('')
      setCaptchaImg('')
      setMsg(t('auth.captchaLoadFail'))
    }
  }, [t])

  useEffect(() => {
    queueMicrotask(() => void loadCaptcha())
  }, [loadCaptcha])

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    const captchaCode = String(fd.get('captchaCode') ?? '').trim()
    if (!captchaId || !captchaCode) {
      setMsg(t('auth.captchaRequired'))
      return
    }
    const salutation = String(fd.get('salutation') ?? '').trim()
    if (!salutation) {
      setMsg(t('auth.salutationRequired'))
      return
    }
    const payload: RegisterRequest = {
      name: String(fd.get('name') ?? '').trim(),
      email: String(fd.get('email') ?? '').trim(),
      password: String(fd.get('password') ?? ''),
      salutation,
      phone: String(fd.get('phone') ?? '').trim() || undefined,
      country: String(fd.get('country') ?? '').trim() || undefined,
      captchaId,
      captchaCode,
    }
    try {
      await registerMutation.mutateAsync(payload)
      setMsg(t('auth.redirecting'))
      setTimeout(() => navigate('/login'), 800)
    } catch (err) {
      void loadCaptcha()
      setMsg(registerErrorMessage(err, t))
    }
  }

  return (
    <div className="auth page-pad">
      <div className="container auth__box">
        <div className="auth__card">
          <h1 className="auth__title">{t('auth.registerTitle')}</h1>
          <p className="auth__subtitle">{t('auth.registerSubtitle')}</p>
          <form className="auth__form" onSubmit={onSubmit}>
            <label className="field">
              <span className="field__label">{t('auth.fullName')}</span>
              <input className="input" name="name" required autoComplete="name" />
            </label>
            <label className="field">
              <span className="field__label">{t('auth.salutation')}</span>
              <input className="input" name="salutation" required autoComplete="honorific-prefix" maxLength={64} />
              <p className="auth__captcha-hint" style={{ marginTop: 4 }}>
                {t('auth.salutationHint')}
              </p>
            </label>
            <label className="field">
              <span className="field__label">{t('auth.email')}</span>
              <input className="input" type="email" name="email" required autoComplete="email" />
            </label>
            <label className="field">
              <span className="field__label">{t('auth.phoneOpt')}</span>
              <input className="input" name="phone" autoComplete="tel" />
            </label>
            <label className="field">
              <span className="field__label">{t('auth.countryOpt')}</span>
              <input className="input" name="country" autoComplete="country-name" />
            </label>
            <label className="field">
              <span className="field__label">{t('auth.password')}</span>
              <input
                className="input"
                type="password"
                name="password"
                required
                autoComplete="new-password"
                minLength={6}
              />
            </label>
            <div className="field auth__captcha">
              <span className="field__label">{t('auth.captchaLabel')}</span>
              <div className="auth__captcha-row">
                {captchaImg ? (
                  <button
                    type="button"
                    className="auth__captcha-img-btn"
                    onClick={() => void loadCaptcha()}
                    aria-label={t('auth.refreshCaptcha')}
                  >
                    <img src={captchaImg} alt="" className="auth__captcha-img" width={120} height={40} />
                  </button>
                ) : (
                  <div className="auth__captcha-placeholder" aria-hidden />
                )}
                <button
                  type="button"
                  className="btn btn--ghost auth__captcha-refresh"
                  onClick={() => void loadCaptcha()}
                  disabled={registerMutation.isPending}
                >
                  {t('auth.refreshCaptcha')}
                </button>
              </div>
              <p className="auth__captcha-hint">{t('auth.captchaClickHint')}</p>
              <input
                className="input"
                name="captchaCode"
                required
                autoComplete="off"
                placeholder={t('auth.captchaPlaceholder')}
                maxLength={12}
              />
            </div>
            <label className="field field--checkbox">
              <input type="checkbox" name="terms" required />
              <span>{t('auth.termsCheckbox')}</span>
            </label>
            <button type="submit" className="btn btn--primary btn--block" disabled={registerMutation.isPending}>
              {registerMutation.isPending ? t('auth.registering') : t('auth.register')}
            </button>
          </form>
          {msg && <p className="auth__msg">{msg}</p>}
          <p className="auth__footer">
            {t('auth.hasAccount')} <Link to="/login">{t('auth.signIn')}</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
