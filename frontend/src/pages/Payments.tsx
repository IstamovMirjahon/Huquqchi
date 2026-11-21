import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import type { Payment, PaymentProvider } from '../api/types'
import { useAuth } from '../auth'
import { Icon } from '../components/Icon'
import { Avatar, Badge, Empty, ErrorBox, Loading, PageHead, useAction, useAsync } from '../components/ui'
import { dateFull, dateTime, FORMAT, money, ORDER_TYPE, PAYMENT_STATUS, PROVIDERS } from '../lib/format'

/** Step 2 of ordering: pick a provider and go to its checkout (§12.1). */
export function Checkout() {
  const { orderId } = useParams()
  const nav = useNavigate()
  const o = useAsync(() => api.orders.get(orderId!), [orderId])
  const [provider, setProvider] = useState<PaymentProvider>('payme')
  const { busy, run } = useAction()

  if (o.loading) return <Loading />
  if (o.error || !o.data) return <ErrorBox error={o.error} />
  const order = o.data
  if (order.status !== 'pending_payment') { nav(`/orders/${order.id}`, { replace: true }); return null }

  const pay = async () => {
    const p = await run(() => api.payments.create({ purpose: 'order', orderId: order.id, provider, returnUrl: `${location.origin}/payments/return` }))
    if (p?.checkoutUrl) { if (p.checkoutUrl.startsWith('/')) nav(p.checkoutUrl); else location.href = p.checkoutUrl }
  }

  return (
    <div style={{ maxWidth: 760, margin: '0 auto' }}>
      <PageHead title="To‘lov" sub={`Buyurtma ${order.number}`} />
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div className="card stack">
          <div className="row" style={{ gap: 12 }}><Avatar name={order.lawyer.name} size={44} /><div><b>{order.lawyer.name}</b><div className="xs muted">{ORDER_TYPE[order.type]}</div></div></div>
          <hr className="divider" style={{ margin: '4px 0' }} />
          <div className="strong">{order.title}</div>
          {order.consultation && <div className="row small" style={{ gap: 8 }}><Icon name="calendar" size={16} />{dateTime(order.consultation.start)} · {FORMAT[order.consultation.format]}</div>}
          {order.deliveryDays && <div className="row small" style={{ gap: 8 }}><Icon name="clock" size={16} />Bajarish muddati: {order.deliveryDays} kun</div>}
          {(order.shared.documents.length > 0 || order.shared.conversation) && <div className="row small" style={{ gap: 8 }}><Icon name="paperclip" size={16} />Ulashiladi: {[order.shared.conversation && 'AI suhbati', ...order.shared.documents.map((d) => d.name)].filter(Boolean).join(', ')}</div>}
          <hr className="divider" style={{ margin: '4px 0' }} />
          <div className="row between"><span className="muted">Jami</span><b style={{ fontSize: 22 }}>{money(order.price.amount)}</b></div>
        </div>
        <div className="card stack">
          <div className="field"><span>To‘lov usuli</span></div>
          {PROVIDERS.map((p) => (
            <button key={p.code} onClick={() => setProvider(p.code)} className="row" style={{ padding: 14, borderRadius: 14, border: `1.5px solid ${provider === p.code ? 'var(--lapis)' : 'var(--border)'}`, background: '#fff', cursor: 'pointer', gap: 12 }}>
              <span style={{ width: 36, height: 36, borderRadius: 10, background: p.color, color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13 }}>{p.name[0]}</span>
              <b className="grow" style={{ textAlign: 'left' }}>{p.name}</b>
              {provider === p.code && <Icon name="checkCircle" style={{ color: 'var(--lapis)' }} />}
            </button>
          ))}
          <button className="btn btn-primary btn-lg btn-block" disabled={busy} onClick={pay}>{busy ? <span className="spinner" /> : <>To‘lash · {money(order.price.amount)}</>}</button>
          <div className="banner info xs"><Icon name="lock" size={16} /><div>Pul yuristga darhol o‘tmaydi. Ish bajarilib, siz tasdiqlaganingizdan keyin o‘tkaziladi. Bekor qilish shartlari buyurtma sahifasida.</div></div>
          <p className="xs faint" style={{ textAlign: 'center' }}>Slot 30 daqiqa band qilib turiladi</p>
        </div>
      </div>
    </div>
  )
}

/** Stand-in for the provider's hosted checkout page (mock mode only). */
export function MockProviderPage() {
  const [sp] = useSearchParams()
  const id = sp.get('paymentId')!
  const ret = sp.get('return')!
  const [p, setP] = useState<Payment | null>(null)
  const [busy, setBusy] = useState(false)
  useEffect(() => { import('../api/mock/api').then((m) => setP(m.mockPayment(id))) }, [id])
  const finish = async (ok: boolean) => {
    setBusy(true)
    const m = await import('../api/mock/api')
    await new Promise((r) => setTimeout(r, 900))
    m.mockCompletePayment(id, ok)
    const u = new URL(ret); location.href = u.pathname + u.search
  }
  const prov = PROVIDERS.find((x) => x.code === p?.provider)
  return (
    <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#eef1f5', padding: 20 }}>
      <div style={{ width: '100%', maxWidth: 400, background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 20px 60px -20px rgba(0,0,0,.25)' }}>
        <div className="row between"><b style={{ color: prov?.color, fontSize: 22 }}>{prov?.name}</b><Badge tone="warning">Test to‘lov</Badge></div>
        <p className="small muted" style={{ marginTop: 6 }}>Bu provayder sahifasining demo nusxasi. Haqiqiy pul yechilmaydi.</p>
        <div className="sunken" style={{ marginTop: 18 }}>
          <div className="xs muted">Huquqchi</div><div className="strong">{p?.title}</div>
          <div style={{ fontSize: 26, fontWeight: 750, marginTop: 6 }}>{money(p?.amount)}</div>
        </div>
        <label className="field" style={{ marginTop: 16 }}><span>Karta raqami</span><input className="input" defaultValue="8600 1234 5678 9012" /></label>
        <div className="grid g2" style={{ marginTop: 10 }}><label className="field"><span>Amal qilish</span><input className="input" defaultValue="12/29" /></label><label className="field"><span>SMS kod</span><input className="input" defaultValue="111111" /></label></div>
        <button className="btn btn-block btn-lg" style={{ marginTop: 18, background: prov?.color, color: '#fff' }} disabled={busy || !p} onClick={() => finish(true)}>{busy ? <span className="spinner" /> : 'To‘lash'}</button>
        <button className="btn btn-block btn-text" style={{ marginTop: 12 }} disabled={busy} onClick={() => finish(false)}>Bekor qilish</button>
      </div>
    </div>
  )
}

/** returnUrl: poll the payment until it leaves `pending` (§12.2). */
export function PaymentReturn() {
  const [sp] = useSearchParams()
  const id = sp.get('paymentId')
  const nav = useNavigate()
  const { refresh } = useAuth()
  const [p, setP] = useState<Payment | null>(null)
  const [timedOut, setTimedOut] = useState(false)
  useEffect(() => {
    if (!id) return
    let n = 0
    let stop = false
    const tick = async () => {
      const x = await api.payments.get(id).catch(() => null)
      if (stop) return
      setP(x)
      if (x && x.status !== 'pending') {
        refresh()
        if (x.status === 'paid') setTimeout(() => nav(x.orderId ? `/orders/${x.orderId}` : '/profile', { replace: true }), 1400)
        return
      }
      if (++n > 30) { setTimedOut(true); return }
      setTimeout(tick, 2000)
    }
    tick()
    return () => { stop = true }
  }, [id, nav, refresh])

  const ok = p?.status === 'paid'
  const failed = p && ['failed', 'cancelled'].includes(p.status)
  return (
    <div style={{ maxWidth: 460, margin: '60px auto', textAlign: 'center' }} className="card pad-lg">
      <div className="tile-ico" style={{ margin: '0 auto', width: 64, height: 64, borderRadius: 20, background: ok ? 'var(--grad-teal)' : failed ? 'var(--danger)' : 'var(--grad-lapis)' }}>
        {ok ? <Icon name="check" size={30} /> : failed ? <Icon name="x" size={30} /> : <span className="spinner" style={{ width: 26, height: 26 }} />}
      </div>
      <h1 className="h2" style={{ marginTop: 18 }}>{ok ? 'To‘lov qabul qilindi' : failed ? 'To‘lov amalga oshmadi' : timedOut ? 'To‘lov hali tasdiqlanmadi' : 'To‘lov tekshirilmoqda…'}</h1>
      <p className="sub">{ok ? (p?.orderId ? 'Yurist 24 soat ichida buyurtmani qabul qiladi. Buyurtma sahifasiga o‘tyapmiz.' : 'Tarif faollashtirildi.') : failed ? 'Kartadan pul yechilmadi. Qayta urinib ko‘ring yoki boshqa usulni tanlang.' : timedOut ? 'Provayder javobi kechikmoqda. Bir necha daqiqadan keyin «To‘lovlar» bo‘limini tekshiring.' : 'Provayderdan javob kutilmoqda.'}</p>
      {failed && p?.orderId && <Link to={`/checkout/${p.orderId}`} className="btn btn-primary" style={{ marginTop: 18 }}>Qayta to‘lash</Link>}
      {timedOut && <Link to="/payments" className="btn btn-ghost" style={{ marginTop: 18 }}>To‘lovlar</Link>}
    </div>
  )
}

export function PaymentsHistory() {
  const r = useAsync(() => api.payments.list(), [])
  return (
    <>
      <PageHead title="To‘lovlar" sub="Barcha to‘lovlar va qaytarishlar. Fiskal chek har bir to‘lovda." />
      <div className="card">
        {r.loading ? <Loading /> : r.data?.items.length ? (
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Sana</th><th>Tavsif</th><th>Usul</th><th>Holat</th><th style={{ textAlign: 'right' }}>Summa</th></tr></thead>
            <tbody>{r.data.items.map((p) => (
              <tr key={p.id}>
                <td className="small">{dateFull(p.createdAt)}</td>
                <td>{p.orderId ? <Link to={`/orders/${p.orderId}`} className="strong">{p.title}</Link> : <span className="strong">{p.title}</span>}</td>
                <td className="small">{PROVIDERS.find((x) => x.code === p.provider)?.name}</td>
                <td><Badge tone={PAYMENT_STATUS[p.status][1]}>{PAYMENT_STATUS[p.status][0]}</Badge>{!!p.refundedAmount && <div className="xs faint">qaytarildi {money(p.refundedAmount)}</div>}</td>
                <td style={{ textAlign: 'right' }} className="strong mono">{money(p.amount)}</td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <Empty icon="receipt" title="To‘lovlar yo‘q" />}
      </div>
    </>
  )
}
