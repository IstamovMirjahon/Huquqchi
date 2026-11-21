import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { api } from '../../api'
import type { Job } from '../../api/types'
import { useAuth } from '../../auth'
import { Icon } from '../../components/Icon'
import { Avatar, Badge, Empty, ErrorBox, Field, Loading, Modal, PageHead, Stat, StatusBadge, useAction, useAsync } from '../../components/ui'
import { ago, dateFull, dateTime, FORMAT, money, moneyShort, ORDER_TYPE, SERVICE_TYPE, until } from '../../lib/format'

export function ProDashboard() {
  const { me } = useAuth()
  const d = useAsync(() => api.lawyer.dashboard(), [])
  if (d.loading) return <Loading />
  if (d.error || !d.data) return <ErrorBox error={d.error} retry={d.reload} />
  const { stats: s, actionRequired, upcomingConsultations, matchingJobs, verificationStatus } = d.data
  const growth = s.earningsLastMonth ? Math.round(((s.earningsThisMonth - s.earningsLastMonth) / s.earningsLastMonth) * 100) : 0
  return (
    <div className="stack-lg">
      <PageHead eyebrow="Yurist kabineti" title={`Salom, ${me!.name.split(' ')[0]}`} sub="Bugungi ishlaringiz va yangi imkoniyatlar"
        actions={<><Link to="/pro/schedule" className="btn btn-ghost"><Icon name="calendar" size={17} />Jadval</Link><Link to="/pro/jobs" className="btn btn-primary"><Icon name="megaphone" size={17} />Ish e’lonlari</Link></>} />
      {verificationStatus !== 'verified' && (
        <div className="banner warn"><Icon name="shield" /><div className="grow"><b>{verificationStatus === 'pending' ? 'Profilingiz tekshiruvda.' : 'Profilingiz hali tasdiqlanmagan.'}</b> Tasdiqlangunga qadar katalogda ko‘rinmaysiz va buyurtma ololmaysiz. AI vositalari esa hozir ham ochiq.</div><Link to="/pro/profile" className="btn btn-sm btn-primary">Tekshiruvga</Link></div>
      )}
      <div className="grid g4">
        <Stat icon="trending" tone="success" label="Shu oy daromad" value={moneyShort(s.earningsThisMonth)} hint={growth ? `${growth > 0 ? '+' : ''}${growth}% o‘tgan oyga nisbatan` : undefined} />
        <Stat icon="wallet" tone="lapis" label="Yechish mumkin" value={moneyShort(s.walletAvailable)} hint={`Kutilmoqda: ${money(s.walletPending)}`} />
        <Stat icon="briefcase" tone="gold" label="Faol buyurtmalar" value={s.activeOrders} hint={`Shu oy bajarildi: ${s.completedThisMonth}`} />
        <Stat icon="star" tone="gold" label="Reyting" value={s.rating ? s.rating.toFixed(1) : '—'} hint={`${s.reviewCount} sharh · javob berish ${Math.round(s.responseRate * 100)}%`} />
      </div>
      <div className="split">
        <div className="stack-lg">
          <section className="card">
            <div className="card-head"><h2 className="h3">Harakat kutilmoqda</h2><Link to="/orders" className="btn-text btn small">Barcha buyurtmalar</Link></div>
            {actionRequired.length ? actionRequired.map((o) => (
              <Link key={o.id} to={`/orders/${o.id}`} className="list-item">
                <Avatar name={o.client.name} size={40} />
                <div className="grow"><div className="strong">{o.title}</div><div className="small muted">{o.client.name} · {ORDER_TYPE[o.type]} · {money(o.price.lawyerPayout)}</div>
                  {o.status === 'awaiting_acceptance' && o.acceptDueAt && <div className="xs" style={{ color: 'var(--warning)', fontWeight: 600 }}>Qabul qilish uchun {until(o.acceptDueAt)} qoldi</div>}
                  {o.deliveryDueAt && o.status === 'in_progress' && <div className="xs faint">Topshirish: {dateTime(o.deliveryDueAt)}</div>}
                </div>
                <StatusBadge status={o.status} />
              </Link>
            )) : <p className="small muted">Hammasi joyida. Yangi buyurtma kelganda shu yerda ko‘rinadi.</p>}
          </section>
          <section className="card">
            <div className="card-head"><h2 className="h3">Sizga mos e’lonlar</h2><Link to="/pro/jobs" className="btn-text btn small">Hammasi</Link></div>
            {matchingJobs.length ? matchingJobs.map((j) => <JobRow key={j.id} j={j} />) : <p className="small muted">Yo‘nalishlaringiz bo‘yicha yangi e’lon yo‘q.</p>}
          </section>
        </div>
        <div className="stack-lg">
          <section className="card">
            <div className="card-head"><h2 className="h3">Yaqin konsultatsiyalar</h2></div>
            {upcomingConsultations.length ? upcomingConsultations.map((o) => (
              <Link key={o.id} to={`/orders/${o.id}`} className="list-item">
                <div className="sunken" style={{ padding: '6px 10px', textAlign: 'center', minWidth: 58 }}><div className="xs faint">{dateFull(o.consultation!.start).split(' ').slice(0, 1)}</div><b>{dateTime(o.consultation!.start).split(', ')[1]}</b></div>
                <div className="grow"><div className="small strong">{o.client.name}</div><div className="xs muted">{FORMAT[o.consultation!.format]} · {o.title}</div></div>
              </Link>
            )) : <p className="small muted">Rejalashtirilgan konsultatsiya yo‘q.</p>}
          </section>
          <section className="card" style={{ background: 'linear-gradient(135deg, rgba(247,241,230,.95), rgba(255,255,255,.75))' }}>
            <Icon name="sparkles" size={24} style={{ color: 'var(--gold)' }} />
            <h3 className="h3" style={{ marginTop: 10 }}>AI vositalari</h3>
            <p className="small muted" style={{ margin: '4px 0 12px' }}>Mijoz hujjatini tahlil qiling, javob qoralamasini oling, shartnoma tuzing: professional rejimda.</p>
            <div className="row wrap" style={{ gap: 6 }}>
              <Link to="/chat" className="btn btn-sm btn-ghost">AI yordamchi</Link><Link to="/documents" className="btn btn-sm btn-ghost">Tahlil</Link><Link to="/create" className="btn btn-sm btn-ghost">Hujjat tuzish</Link>
            </div>
          </section>
          <section className="card stack small">
            <div className="row between"><span className="muted">Profil ko‘rishlar (30 kun)</span><b>{s.profileViews30d}</b></div>
            <Link to={`/lawyers/${me!.lawyerProfileId}`} className="btn btn-sm btn-ghost btn-block"><Icon name="eye" size={15} />Ochiq profilni ko‘rish</Link>
          </section>
        </div>
      </div>
    </div>
  )
}

function JobRow({ j }: { j: Job }) {
  return (
    <Link to={`/pro/jobs/${j.id}`} className="list-item" style={{ alignItems: 'flex-start' }}>
      <div className="grow">
        <div className="row wrap" style={{ gap: 6 }}><b>{j.title}</b>{j.myOffer && <Badge tone="success">Taklif yuborilgan</Badge>}</div>
        <p className="small muted clamp2" style={{ marginTop: 2 }}>{j.description}</p>
        <div className="row wrap xs faint" style={{ gap: 10, marginTop: 6 }}><span>{j.category.name}</span>{j.region && <span>{j.region.name}</span>}<span>{ago(j.createdAt)}</span><span>{j.offersCount} taklif</span></div>
      </div>
      {j.budgetMax && <div style={{ textAlign: 'right', minWidth: 120 }}><div className="xs faint">byudjet</div><b className="small">{moneyShort(j.budgetMin ?? 0)}–{moneyShort(j.budgetMax)}</b></div>}
    </Link>
  )
}

export function JobBoard() {
  const { me } = useAuth()
  const cats = useAsync(() => api.reference.categories(), [])
  const [cat, setCat] = useState('')
  const [matching, setMatching] = useState(true)
  const [search, setSearch] = useState('')
  const r = useAsync(() => (me?.lawyerStatus === 'verified' ? api.lawyer.jobs({ category: cat, matching: matching || undefined, search }) : Promise.resolve(null)), [cat, matching, search, me?.lawyerStatus])
  return (
    <>
      <PageHead title="Ish e’lonlari" sub="Mijozlar joylagan ochiq ishlar. Narx va muddat taklif qiling: mijoz tanlasa, to‘lovdan keyin ish boshlanadi." />
      {me?.lawyerStatus !== 'verified' ? (
        <div className="card"><Empty icon="lock" title="E’lonlar tasdiqlangan yuristlar uchun" text="Profilingiz tasdiqlangach mijozlar e’lonlarini ko‘rib, taklif yubora olasiz." action={<Link to="/pro/profile" className="btn btn-primary">Tekshiruvga yuborish</Link>} /></div>
      ) : (
        <>
          <div className="row wrap" style={{ gap: 8, marginBottom: 14 }}>
            <div className="input-icon" style={{ width: 260 }}><Icon name="search" size={17} /><input className="input" placeholder="Qidirish" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
            <select className="select" style={{ width: 220 }} value={cat} onChange={(e) => setCat(e.target.value)}><option value="">Barcha yo‘nalishlar</option>{cats.data?.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select>
            <label className="check"><input type="checkbox" checked={matching} onChange={(e) => setMatching(e.target.checked)} /><span className="small">Faqat mening yo‘nalishlarim</span></label>
          </div>
          <div className="card">{r.loading ? <Loading /> : r.data?.items.length ? <div className="list">{r.data.items.map((j) => <JobRow key={j.id} j={j} />)}</div> : <Empty icon="megaphone" title="Mos e’lon yo‘q" text="Filtrni o‘zgartiring yoki keyinroq qayting. Yangi mos e’lon chiqsa, bildirishnoma yuboramiz." />}</div>
        </>
      )}
    </>
  )
}

export function ProJobView() {
  const { id } = useParams()
  const j = useAsync(() => api.lawyer.job(id!), [id])
  const [open, setOpen] = useState(false)
  const [price, setPrice] = useState('')
  const [days, setDays] = useState('3')
  const [msg, setMsg] = useState('')
  const { busy, run } = useAction()
  if (j.loading) return <Loading />
  if (j.error || !j.data) return <ErrorBox error={j.error} />
  const job = j.data
  const send = async () => { const o = await run(() => api.lawyer.sendOffer(job.id, { price: Number(price), deliveryDays: Number(days), message: msg }), 'Taklif yuborildi'); if (o) { setOpen(false); j.reload(true) } }
  return (
    <div className="stack-lg">
      <Link to="/pro/jobs" className="btn-text btn small"><Icon name="arrowLeft" size={16} />Ish e’lonlari</Link>
      <div className="split">
        <section className="card pad-lg">
          <div className="row wrap" style={{ gap: 8 }}><Badge tone="lapis">{job.category.name}</Badge>{job.serviceType && <Badge>{SERVICE_TYPE[job.serviceType]}</Badge>}<span className="xs faint">{ago(job.createdAt)}</span></div>
          <h1 className="h2" style={{ marginTop: 10 }}>{job.title}</h1>
          <p className="pre" style={{ marginTop: 12, color: 'var(--ink-body)' }}>{job.description}</p>
          {job.aiSummary && <div className="banner info small" style={{ marginTop: 14 }}><Icon name="sparkles" size={17} /><div>{job.aiSummary}</div></div>}
          <div className="banner gold xs" style={{ marginTop: 16 }}><Icon name="lock" size={16} /><div>Mijoz hujjatlari va AI suhbati faqat taklifingiz qabul qilinib, to‘lov o‘tgandan keyin ochiladi.</div></div>
        </section>
        <aside className="stack sticky">
          <div className="card stack">
            {job.budgetMax && <div className="row between small"><span className="muted">Byudjet</span><b>{money(job.budgetMin)}–{money(job.budgetMax)}</b></div>}
            {job.deadline && <div className="row between small"><span className="muted">Muddat</span><b>{dateFull(job.deadline)}</b></div>}
            <div className="row between small"><span className="muted">Format</span><b>{{ online: 'Onlayn', office: 'Uchrashib', any: 'Farqi yo‘q' }[job.format]}</b></div>
            {job.region && <div className="row between small"><span className="muted">Hudud</span><b>{job.region.name}</b></div>}
            <div className="row between small"><span className="muted">Takliflar</span><b>{job.offersCount}</b></div>
            <hr className="divider" style={{ margin: '4px 0' }} />
            <div className="row" style={{ gap: 10 }}><Avatar name={job.client.name} size={36} /><div><div className="small strong">{job.client.name}</div><div className="xs faint">{job.client.ordersCount} ta buyurtma</div></div></div>
            {job.myOffer ? (
              <div className="sunken small"><b>Sizning taklifingiz:</b> {money(job.myOffer.price)}, {job.myOffer.deliveryDays} kun<br /><Badge tone={job.myOffer.status === 'accepted' ? 'success' : job.myOffer.status === 'pending' ? 'lapis' : ''}>{{ pending: 'Ko‘rib chiqilmoqda', accepted: 'Qabul qilindi', rejected: 'Rad etildi', withdrawn: 'Qaytarib olindi' }[job.myOffer.status]}</Badge>
                {job.myOffer.status === 'pending' && <button className="btn btn-sm btn-text" style={{ marginTop: 8, display: 'block' }} onClick={async () => { await run(() => api.lawyer.withdrawOffer(job.myOffer!.id), 'Qaytarib olindi'); j.reload(true) }}>Qaytarib olish</button>}
              </div>
            ) : job.status === 'open' && <button className="btn btn-primary btn-block" onClick={() => { setPrice(String(job.budgetMax ?? '')); setOpen(true) }}>Taklif yuborish</button>}
          </div>
        </aside>
      </div>
      <Modal open={open} onClose={() => setOpen(false)} title="Taklif yuborish" sub="Kontakt ma’lumotlar avtomatik yashiriladi. Aloqa to‘lovdan keyin platforma chatida."
        footer={<><button className="btn btn-ghost" onClick={() => setOpen(false)}>Bekor qilish</button><button className="btn btn-primary" disabled={busy || !price || msg.trim().length < 20} onClick={send}>{busy ? <span className="spinner" /> : 'Yuborish'}</button></>}>
        <div className="stack">
          <div className="grid g2"><Field label="Narx (so‘m)" hint="Komissiya shu summadan ushlanadi"><input className="input" inputMode="numeric" value={price} onChange={(e) => setPrice(e.target.value.replace(/\D/g, ''))} /></Field><Field label="Muddat (kun)"><input className="input" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ''))} /></Field></div>
          <Field label="Mijozga xabar" hint="Tajribangiz, ishni qanday bajarasiz, nima kerak bo‘ladi"><textarea className="textarea" rows={5} value={msg} onChange={(e) => setMsg(e.target.value)} /></Field>
        </div>
      </Modal>
    </div>
  )
}
