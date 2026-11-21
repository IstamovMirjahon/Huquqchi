import { useRef, useState } from 'react'
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { api, apiMode, envMode, isMock, switchMode } from '../api'
import type { CodeRequestResult } from '../api/types'
import { useAuth } from '../auth'
import { Icon } from '../components/Icon'
import { ThemeToggle } from '../components/ThemeToggle'
import { errText } from '../components/ui'

export default function Login() {
  const { me, signIn } = useAuth()
  const nav = useNavigate()
  const [sp] = useSearchParams()
  const [step, setStep] = useState<'phone' | 'code' | 'profile'>('phone')
  const [phone, setPhone] = useState('')
  const [info, setInfo] = useState<CodeRequestResult | null>(null)
  const [code, setCode] = useState(['', '', '', '', '', ''])
  const [name, setName] = useState('')
  const [role, setRole] = useState<'client' | 'lawyer'>(sp.get('role') === 'lawyer' ? 'lawyer' : 'client')
  const [terms, setTerms] = useState(false)
  const [busy, setBusy] = useState(false)
  const [err, setErr] = useState('')
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const [reason] = useState(() => { const r = sessionStorage.getItem('hq-logout-reason'); sessionStorage.removeItem('hq-logout-reason'); return r })

  if (me) return <Navigate to={sp.get('next') || (me.role === 'lawyer' ? '/pro' : '/')} replace />

  const normalized = () => '+998' + phone.replace(/\D/g, '').replace(/^998/, '').slice(0, 9)

  const requestCode = async () => {
    setErr(''); setBusy(true)
    try { setInfo(await api.auth.requestCode(normalized())); setStep('code'); setTimeout(() => refs.current[0]?.focus(), 50) } catch (e) { setErr(errText(e)) } finally { setBusy(false) }
  }
  const verify = async () => {
    setErr('')
    if (info?.isNewUser && step === 'code') { setStep('profile'); return }
    setBusy(true)
    try {
      const u = await signIn({ phone: normalized(), code: code.join(''), ...(info?.isNewUser ? { name, role, acceptTerms: terms, workspaceKind: 'Personal' } : {}) })
      nav(sp.get('next') || (u.role === 'lawyer' ? (u.lawyerStatus === 'verified' ? '/pro' : '/pro/profile') : '/'), { replace: true })
    } catch (e) { setErr(errText(e)) } finally { setBusy(false) }
  }
  const setDigit = (i: number, v: string) => {
    const d = v.replace(/\D/g, '')
    if (d.length > 1) { const arr = d.slice(0, 6).split(''); setCode([...arr, ...Array(6 - arr.length).fill('')]); refs.current[Math.min(arr.length, 5)]?.focus(); return }
    const next = [...code]; next[i] = d; setCode(next)
    if (d && i < 5) refs.current[i + 1]?.focus()
  }

  return (
    <div className="auth">
      <div className="ambient"><i /><i /><i /></div>
      <section className="auth-art">
        <div className="row" style={{ gap: 12, position: 'relative', zIndex: 1 }}>
          <div className="brand-logo"><img src="/logo.png" alt="" /></div>
          <b style={{ fontSize: 20 }}>Huquqchi AI</b>
        </div>
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 520 }}>
          <h1 style={{ fontSize: 40, lineHeight: 1.1, letterSpacing: '-.03em', fontWeight: 750 }}>Huquqingizni tushuning.<br /><span style={{ color: 'var(--gold-bright)' }}>Keyingi qadamni biling.</span></h1>
          <p style={{ marginTop: 16, opacity: .8, fontSize: 16 }}>AI manbali javob beradi, hujjat tayyorlaydi va tekshiradi. Kerak bo‘lsa, tasdiqlangan yurist bilan bir tugmada bog‘lanasiz. To‘lov ish bajarilguncha himoyalangan.</p>
          <div className="grid g3" style={{ marginTop: 32, gap: 12 }}>
            {[['sparkles', 'AI huquqshunos', 'Qonun moddalariga havola bilan'], ['shieldCheck', 'Tasdiqlangan yuristlar', 'Litsenziyasi tekshirilgan'], ['lock', 'Kafolatlangan to‘lov', 'Ish bajarilgach o‘tkaziladi']].map(([i, t, s]) => (
              <div key={t} style={{ padding: 14, borderRadius: 16, background: 'rgba(255,255,255,.08)', border: '1px solid rgba(255,255,255,.14)' }}>
                <Icon name={i} size={20} /><div className="small strong" style={{ marginTop: 8 }}>{t}</div><div className="xs" style={{ opacity: .7 }}>{s}</div>
              </div>
            ))}
          </div>
        </div>
        <p className="xs" style={{ opacity: .55, position: 'relative', zIndex: 1 }}>AI javobi yuridik maslahat o‘rnini bosmaydi. Muhim qaror oldidan mutaxassis bilan tekshiring.</p>
      </section>

      <section className="auth-form">
        <div className="auth-theme"><ThemeToggle /></div>
        <div className="auth-card card pad-lg">
          {step === 'phone' && (
            <form className="stack-lg" onSubmit={(e) => { e.preventDefault(); requestCode() }}>
              <a href="/" className="btn-text btn small"><Icon name="arrowLeft" size={16} />Bosh sahifa</a>
              <div><h2 className="h1" style={{ fontSize: 26 }}>Kirish</h2><p className="sub">Telefon raqamingizni kiriting. Kodni Telegram bot yuboradi.</p></div>
              <label className="field">
                <span>Telefon raqam</span>
                <div className="input-icon"><span style={{ position: 'absolute', left: 14, top: 11, fontWeight: 600, color: 'var(--ink-2)' }}>+998</span>
                  <input className="input" style={{ paddingLeft: 62 }} inputMode="tel" autoFocus placeholder="90 123 45 67" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
              </label>
              {reason && <div className="banner warn xs"><Icon name="alert" size={16} /><div><b>Sessiya yakunlandi.</b> {reason}</div></div>}
              {err && <p className="form-error">{err}</p>}
              <button className="btn btn-primary btn-lg btn-block" disabled={busy || phone.replace(/\D/g, '').replace(/^998/, '').length < 9}>{busy ? <span className="spinner" /> : 'Kod olish'}</button>
              {!isMock && <button type="button" className="btn btn-ghost btn-block" onClick={() => switchMode('mock')}><Icon name="eye" size={16} />Demo rejimda ko‘rish (backendsiz)</button>}
              {isMock && envMode !== 'mock' && <button type="button" className="btn btn-ghost btn-block" onClick={() => switchMode(null)}><Icon name="refresh" size={16} />Real backend bilan kirish</button>}
              {apiMode === 'hybrid' && <p className="xs faint" style={{ textAlign: 'center' }}>Kod Telegram botda keladi: botni oching, telefon raqamingizni yuboring, keyin kodni shu yerga kiriting.</p>}
              {isMock && <div className="banner info xs"><Icon name="info" size={16} /><div>Demo: mijoz <b>90 111 22 33</b>, yurist <b>90 777 88 99</b>, yoki yangi raqam bilan ro‘yxatdan o‘ting.</div></div>}
            </form>
          )}

          {step === 'code' && (
            <form className="stack-lg" onSubmit={(e) => { e.preventDefault(); verify() }}>
              <button type="button" className="btn-text btn small" onClick={() => setStep('phone')}><Icon name="arrowLeft" size={16} />Raqamni o‘zgartirish</button>
              <div><h2 className="h1" style={{ fontSize: 26 }}>Kodni kiriting</h2><p className="sub">{info?.message}</p></div>
              {info?.telegramBotUrl && <a href={info.telegramBotUrl} target="_blank" rel="noreferrer" className="btn btn-soft btn-block"><Icon name="send" size={17} />Telegram botni ochish</a>}
              <div className="otp">
                {code.map((d, i) => (
                  <input key={i} ref={(el) => { refs.current[i] = el }} value={d} inputMode="numeric" maxLength={6}
                    onChange={(e) => setDigit(i, e.target.value)} onKeyDown={(e) => e.key === 'Backspace' && !d && i > 0 && refs.current[i - 1]?.focus()} />
                ))}
              </div>
              {err && <p className="form-error">{err}</p>}
              <button className="btn btn-primary btn-lg btn-block" disabled={busy || code.join('').length < 6}>{busy ? <span className="spinner" /> : info?.isNewUser ? 'Davom etish' : 'Kirish'}</button>
            </form>
          )}

          {step === 'profile' && (
            <form className="stack-lg" onSubmit={(e) => { e.preventDefault(); verify() }}>
              <div><h2 className="h1" style={{ fontSize: 26 }}>Ro‘yxatdan o‘tish</h2><p className="sub">Platformadan qanday foydalanasiz?</p></div>
              <div className="role-pick">
                <button type="button" className={role === 'client' ? 'on' : ''} onClick={() => setRole('client')}>
                  <Icon name="user" size={22} style={{ color: 'var(--lapis)' }} /><div className="strong" style={{ marginTop: 8 }}>Mijozman</div><div className="xs muted">Savol, hujjat, yurist kerak</div>
                </button>
                <button type="button" className={role === 'lawyer' ? 'on' : ''} onClick={() => setRole('lawyer')}>
                  <Icon name="scale" size={22} style={{ color: 'var(--gold)' }} /><div className="strong" style={{ marginTop: 8 }}>Yuristman</div><div className="xs muted">Mijozlar va AI vositalari</div>
                </button>
              </div>
              <label className="field"><span>Ism va familiya</span><input className="input" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="Aziza Karimova" /></label>
              {role === 'lawyer' && <div className="banner gold xs"><Icon name="shield" size={16} /><div>Ro‘yxatdan o‘tgach, diplom va litsenziyangizni yuklaysiz. Tekshiruvdan o‘tgach katalogda ko‘rinasiz.</div></div>}
              <label className="check"><input type="checkbox" checked={terms} onChange={(e) => setTerms(e.target.checked)} /><span className="small">Foydalanish shartlari va maxfiylik siyosatiga roziman</span></label>
              {err && <p className="form-error">{err}</p>}
              <button className="btn btn-primary btn-lg btn-block" disabled={busy || name.trim().length < 2 || !terms}>{busy ? <span className="spinner" /> : 'Ro‘yxatdan o‘tish'}</button>
            </form>
          )}
        </div>
      </section>
    </div>
  )
}
