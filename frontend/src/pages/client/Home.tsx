import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { api } from '../../api'
import { useAuth } from '../../auth'
import { Icon } from '../../components/Icon'
import { LawyerCardView } from '../../components/LawyerCard'
import { Badge, StatusBadge, useAsync } from '../../components/ui'
import { ago, dateFull, dateTime, DOC_STATUS, money } from '../../lib/format'

const QUICK = ['Ishdan ogohlantirishsiz bo‘shatishdi, nima qilaman?', 'Ijara shartnomasini muddatidan oldin bekor qilsa bo‘ladimi?', 'Aliment qanday undiriladi?', 'Sifatsiz tovarni qaytarish tartibi']

export default function Home() {
  const { me } = useAuth()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const orders = useAsync(() => api.orders.list({ group: 'active' }), [])
  const cases = useAsync(() => api.cases.list('active'), [])
  const convs = useAsync(() => api.chat.list(), [])
  const docs = useAsync(() => api.documents.list(), [])
  const lawyers = useAsync(() => api.lawyers.list({ sort: 'recommended', pageSize: 3 }), [])
  const ask = (text: string) => nav(`/chat?q=${encodeURIComponent(text)}`)
  const hour = new Date().getHours()
  const hello = hour < 11 ? 'Xayrli tong' : hour < 18 ? 'Xayrli kun' : 'Xayrli kech'
  const aiUsage = me?.usage.find((u) => u.metric === 'ai_questions')

  return (
    <div className="stack-lg">
      <section className="hero">
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 720 }}>
          <div className="eyebrow">{hello}, {me?.name.split(' ')[0]}</div>
          <h1 className="h1" style={{ fontSize: 38 }}>Sizga qanday <span className="grad-text">huquqiy yordam</span> kerak?</h1>
          <form className="ask" onSubmit={(e) => { e.preventDefault(); if (q.trim()) ask(q) }}>
            <Icon name="sparkles" style={{ color: 'var(--lapis)', alignSelf: 'center' }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Vaziyatingizni oddiy so‘zlar bilan yozing…" />
            <button className="btn btn-lapis" disabled={!q.trim()}>So‘rash <Icon name="arrowRight" size={16} /></button>
          </form>
          <div className="row wrap" style={{ gap: 8, marginTop: 14, position: 'relative', zIndex: 1 }}>
            {QUICK.map((x) => <button key={x} className="chip" onClick={() => ask(x)}>{x}</button>)}
          </div>
          {aiUsage && aiUsage.limit !== null && <p className="xs faint" style={{ marginTop: 12 }}>Bugun {aiUsage.limit - aiUsage.used} ta bepul savol qoldi</p>}
        </div>
      </section>

      <section className="grid g4">
        {[
          { to: '/lawyers', icon: 'users', grad: 'var(--grad-lapis)', t: 'Yurist topish', s: 'Konsultatsiya, savol, xizmat' },
          { to: '/documents?upload=1', icon: 'fileSearch', grad: 'var(--grad-teal)', t: 'Hujjat tekshirish', s: 'AI xavfli bandlarni topadi' },
          { to: '/create', icon: 'filePlus', grad: 'var(--grad-gold)', t: 'Hujjat yaratish', s: 'Shartnoma, ariza, talabnoma' },
          { to: '/jobs/new', icon: 'megaphone', grad: 'linear-gradient(135deg,#2a2e38,#14161b)', t: 'E’lon berish', s: 'Yuristlar narx taklif qiladi' },
        ].map((x) => (
          <Link key={x.to} to={x.to} className="card tile">
            <div className="tile-ico" style={{ background: x.grad }}><Icon name={x.icon} size={22} /></div>
            <div><div className="h3">{x.t}</div><div className="small muted">{x.s}</div></div>
          </Link>
        ))}
      </section>

      <div className="split">
        <div className="stack-lg">
          <section className="card" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,.92), rgba(237,240,251,.8))' }}>
            <div className="card-head"><div><h2 className="h3">Ishlarim</h2><p className="xs muted">Bitta muammo, bosqichma-bosqich reja va muddatlar</p></div><Link to="/cases/new" className="btn btn-sm btn-primary"><Icon name="plus" size={15} />Ish ochish</Link></div>
            {cases.data?.length ? cases.data.slice(0, 3).map((c) => (
              <Link key={c.id} to={`/cases/${c.id}`} className="list-item">
                <div className="grow">
                  <div className="strong">{c.title}</div>
                  <div className="small muted">{c.nextStep ? `Keyingi qadam: ${c.nextStep.title}` : 'Barcha qadamlar bajarildi'}</div>
                  <div className="progress" style={{ marginTop: 8, maxWidth: 320 }}><i style={{ width: `${(c.progress.done / Math.max(c.progress.total, 1)) * 100}%` }} /></div>
                </div>
                <div style={{ textAlign: 'right' }}><div className="small strong">{c.progress.done}/{c.progress.total}</div>{c.nearestDeadline && <div className="xs" style={{ color: 'var(--warning)', fontWeight: 600 }}>{dateFull(c.nearestDeadline.date)}</div>}</div>
              </Link>
            )) : <p className="small muted">Masalan: ish haqi berilmayapti yoki garov qaytarilmayapti. AI qadamma-qadam reja tuzadi: tahlil, hisob, talabnoma, keyingi murojaat.</p>}
          </section>
          <section className="card">
            <div className="card-head"><h2 className="h3">Faol murojaatlar</h2><Link to="/orders" className="btn-text btn small">Barchasi</Link></div>
            {orders.data?.items.length ? (
              <div className="list">
                {orders.data.items.slice(0, 4).map((o) => (
                  <Link key={o.id} to={`/orders/${o.id}`} className="list-item">
                    <div className="grow">
                      <div className="strong">{o.title}</div>
                      <div className="small muted">{o.lawyer.name} · {o.consultation ? dateTime(o.consultation.start) : money(o.price.amount)}</div>
                    </div>
                    <StatusBadge status={o.status} />
                  </Link>
                ))}
              </div>
            ) : <p className="muted small">Hali murojaat yo‘q. AI javobi yetmasa, <Link to="/lawyers" className="btn-text btn">yurist toping</Link>.</p>}
          </section>

          <section className="card">
            <div className="card-head"><h2 className="h3">Tavsiya etilgan yuristlar</h2><Link to="/lawyers" className="btn-text btn small">Hammasi</Link></div>
            <div className="stack">{lawyers.data?.items.map((l) => <LawyerCardView key={l.id} l={l} compact action={<Link to={`/lawyers/${l.id}`} className="btn btn-sm btn-ghost">Ko‘rish</Link>} />)}</div>
          </section>
        </div>

        <div className="stack-lg">
          <section className="card">
            <div className="card-head"><h2 className="h3">So‘nggi suhbatlar</h2><Link to="/chat" className="btn-text btn small">Yangi</Link></div>
            {convs.data?.length ? convs.data.slice(0, 4).map((c) => (
              <Link key={c.id} to={`/chat/${c.id}`} className="list-item"><Icon name="chat" size={18} className="faint" /><div className="grow"><div className="small strong clamp2">{c.title}</div><div className="xs faint">{ago(c.updatedAt)}</div></div></Link>
            )) : <p className="muted small">Birinchi savolingizni bering.</p>}
          </section>
          <section className="card">
            <div className="card-head"><h2 className="h3">So‘nggi hujjatlar</h2><Link to="/documents" className="btn-text btn small">Barchasi</Link></div>
            {docs.data?.length ? docs.data.slice(0, 3).map((d) => (
              <Link key={d.id} to={`/documents/${d.id}`} className="list-item"><Icon name="file" size={18} className="faint" /><div className="grow"><div className="small strong clamp2">{d.name}</div></div><Badge tone={DOC_STATUS[d.status][1]}>{DOC_STATUS[d.status][0]}</Badge></Link>
            )) : <p className="muted small">Birinchi hujjatingizni yuklang.</p>}
          </section>
          <section className="card" style={{ background: 'linear-gradient(135deg, rgba(18,41,74,.96), rgba(35,67,194,.92))', color: '#fff' }}>
            <Icon name="shieldCheck" size={26} />
            <h3 className="h3" style={{ marginTop: 10 }}>Kafolatlangan to‘lov</h3>
            <p className="small" style={{ opacity: .8, marginTop: 4 }}>Yuristga to‘lagan pulingiz ish bajarilib, siz tasdiqlaguningizcha platformada saqlanadi. Natija bo‘lmasa, pul qaytariladi.</p>
          </section>
        </div>
      </div>
    </div>
  )
}
