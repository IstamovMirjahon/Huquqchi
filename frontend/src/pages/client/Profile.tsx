import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { api } from '../../api'
import type { PaymentProvider, Plan } from '../../api/types'
import { useAuth } from '../../auth'
import { Icon } from '../../components/Icon'
import { Badge, Field, PageHead, useAction, useAsync } from '../../components/ui'
import { ago, dateFull, LANG, money, PROVIDERS } from '../../lib/format'

const METRIC: Record<string, string> = { ai_questions: 'AI savollar', analyses: 'Hujjat tahlili', drafts: 'Hujjat yaratish', services: 'Faol xizmatlar', offers: 'Takliflar', ai_pro_questions: 'AI savollar' }

export default function Profile() {
  const { me, refresh, isLawyer } = useAuth()
  const loc = useLocation()
  const [name, setName] = useState(me!.name)
  const [email, setEmail] = useState(me!.email ?? '')
  const [lang, setLang] = useState(me!.language)
  const sessions = useAsync(() => api.auth.sessions(), [])
  const { busy, run } = useAction()
  useEffect(() => { if (loc.hash === '#plans') setTimeout(() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' }), 100) }, [loc.hash])

  return (
    <div className="stack-lg">
      <PageHead title="Profil va tarif" />
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <section className="card stack">
          <h2 className="h3">Shaxsiy ma’lumotlar</h2>
          <Field label="Ism"><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field label="Telefon" hint="Telefon raqamni o‘zgartirish uchun yordam xizmatiga yozing"><input className="input" value={me!.phone} disabled /></Field>
          <Field label="Email (ixtiyoriy)"><input className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="cheklar uchun" /></Field>
          <Field label="Interfeys tili"><select className="select" value={lang} onChange={(e) => setLang(e.target.value as typeof lang)}>{Object.entries(LANG).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <button className="btn btn-primary" disabled={busy} onClick={async () => { await run(() => api.me.update({ name, email: email || null, language: lang }), 'Saqlandi'); refresh() }}>Saqlash</button>
        </section>
        <section className="card stack">
          <div className="row between"><h2 className="h3">Joriy tarif</h2><Badge tone="gold">{me!.subscription.planName}</Badge></div>
          {me!.subscription.currentPeriodEnd && <p className="small muted">Keyingi to‘lov: {dateFull(me!.subscription.currentPeriodEnd)}</p>}
          {me!.usage.map((u) => (
            <div key={u.metric}>
              <div className="row between small"><span>{METRIC[u.metric] ?? u.metric}</span><b>{u.limit === null ? 'Cheksiz' : `${u.used} / ${u.limit}`}<span className="faint xs"> {u.period === 'day' ? 'kuniga' : 'oyiga'}</span></b></div>
              {u.limit !== null && <div className="progress" style={{ marginTop: 6 }}><i style={{ width: `${Math.min(100, (u.used / u.limit) * 100)}%` }} /></div>}
            </div>
          ))}
          <hr className="divider" />
          <h3 className="h3">Faol sessiyalar</h3>
          {sessions.data?.map((s) => <div key={s.id} className="row between small"><span><Icon name="globe" size={15} style={{ display: 'inline', verticalAlign: -3 }} /> {s.device} · {s.city}</span><span className="faint">{s.isCurrent ? 'Joriy' : ago(s.lastActiveAt)}</span></div>)}
          <button className="btn btn-sm btn-ghost" onClick={() => run(() => api.auth.logoutAll(), 'Boshqa qurilmalardan chiqildi')}>Boshqa qurilmalardan chiqish</button>
        </section>
      </div>
      <Plans audience={isLawyer ? 'lawyer' : 'client'} />
      <section className="card small muted stack">
        <b style={{ color: 'var(--ink)' }}>Maxfiylik</b>
        <p>Hujjatlaringiz va suhbatlaringiz AI modelni o‘qitish uchun ishlatilmaydi. Yuristga faqat siz tanlagan materiallar ochiladi.</p>
        <div className="row wrap" style={{ gap: 8 }}>
          <button className="btn btn-sm btn-ghost" onClick={() => run(async () => {}, 'So‘rov qabul qilindi. Tayyor bo‘lganda xabar beramiz.')}>Ma’lumotlarimni yuklab olish</button>
          <button className="btn btn-sm btn-danger" onClick={() => confirm('Hisob va barcha ma’lumotlar o‘chiriladi. Davom etasizmi?') && run(() => api.me.deleteAccount())}>Hisobni o‘chirish</button>
        </div>
      </section>
    </div>
  )
}

export function Plans({ audience }: { audience: 'client' | 'lawyer' }) {
  const { me } = useAuth()
  const plans = useAsync(() => api.plans.list(audience), [audience])
  const [period, setPeriod] = useState<'month' | 'year'>('month')
  const [provider] = useState<PaymentProvider>('payme')
  const { busy, run } = useAction()
  const choose = async (p: Plan) => {
    const pay = await run(() => api.plans.subscribe({ planCode: p.code, period, provider, returnUrl: `${location.origin}/payments/return` }))
    if (pay?.checkoutUrl) { if (pay.checkoutUrl.startsWith('/')) location.assign(pay.checkoutUrl); else location.href = pay.checkoutUrl }
  }
  return (
    <section id="plans">
      <div className="row between wrap" style={{ marginBottom: 14, gap: 10 }}>
        <div><h2 className="h2">Tariflar</h2><p className="sub small">To‘lov {PROVIDERS.map((p) => p.name).join(', ')} orqali. Istalgan vaqt bekor qilish mumkin, mavjud materiallaringiz saqlanib qoladi.</p></div>
        <div className="seg"><button className={period === 'month' ? 'on' : ''} onClick={() => setPeriod('month')}>Oylik</button><button className={period === 'year' ? 'on' : ''} onClick={() => setPeriod('year')}>Yillik −20%</button></div>
      </div>
      <div className={`grid ${plans.data && plans.data.length > 2 ? 'g3' : 'g2'}`}>
        {plans.data?.map((p) => {
          const price = p.prices.find((x) => x.period === period) ?? p.prices[0]
          const current = me?.subscription.planCode === p.code
          return (
            <div key={p.code} className="card pad-lg" style={p.isPopular ? { boxShadow: '0 0 0 2px var(--lapis-bright), var(--shadow-lg)' } : undefined}>
              <div className="row between"><h3 className="h2">{p.name}</h3>{p.isPopular && <Badge tone="lapis">Mashhur</Badge>}</div>
              <p className="small muted">{p.description}</p>
              <div style={{ margin: '16px 0' }}><span style={{ fontSize: 30, fontWeight: 750, letterSpacing: '-.03em' }}>{price.amount ? money(price.amount) : 'Bepul'}</span>{price.amount > 0 && <span className="muted small"> / {price.period === 'month' ? 'oy' : 'yil'}</span>}</div>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0 }} className="stack">{p.features.map((f) => <li key={f} className="row small" style={{ gap: 8 }}><Icon name="check" size={16} style={{ color: 'var(--success)' }} />{f}</li>)}</ul>
              <button className={`btn btn-block ${current ? 'btn-ghost' : p.isPopular ? 'btn-lapis' : 'btn-primary'}`} style={{ marginTop: 20 }} disabled={current || busy || price.amount === 0} onClick={() => choose(p)}>{current ? 'Joriy tarif' : price.amount === 0 ? 'Bepul' : 'Tanlash'}</button>
            </div>
          )
        })}
      </div>
    </section>
  )
}
