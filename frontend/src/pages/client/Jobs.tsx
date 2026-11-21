import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api'
import type { CategoryCode, ServiceType } from '../../api/types'
import { Icon } from '../../components/Icon'
import { LawyerCardView } from '../../components/LawyerCard'
import { Badge, Empty, ErrorBox, Field, Loading, PageHead, useAction, useAsync } from '../../components/ui'
import { ago, dateFull, money, SERVICE_TYPE } from '../../lib/format'
import type { HandoffCtx } from './LawyerProfile'

const JOB_STATUS = { open: ['Ochiq', 'success'], in_progress: ['Yurist tanlandi', 'lapis'], closed: ['Yopilgan', ''], cancelled: ['Bekor qilingan', ''] } as const

export function MyJobs() {
  const r = useAsync(() => api.jobs.mine(), [])
  return (
    <>
      <PageHead eyebrow="Ochiq e’lonlar" title="E’lonlarim" sub="Vaziyatingizni yozing, tasdiqlangan yuristlar narx va muddat taklif qiladi. Siz eng mosini tanlaysiz."
        actions={<Link to="/jobs/new" className="btn btn-primary"><Icon name="plus" size={17} />E’lon joylash</Link>} />
      {r.loading ? <Loading /> : r.data?.items.length ? (
        <div className="stack">{r.data.items.map((j) => (
          <Link key={j.id} to={`/jobs/${j.id}`} className="card row" style={{ gap: 16 }}>
            <div className="grow">
              <div className="row wrap" style={{ gap: 8 }}><b>{j.title}</b><Badge tone={JOB_STATUS[j.status][1]}>{JOB_STATUS[j.status][0]}</Badge></div>
              <div className="small muted" style={{ marginTop: 2 }}>{j.category.name} · {ago(j.createdAt)}{j.budgetMax ? ` · ${money(j.budgetMin)}–${money(j.budgetMax)}` : ''}</div>
            </div>
            <div style={{ textAlign: 'right' }}><div style={{ fontSize: 24, fontWeight: 750 }}>{j.offersCount}</div><div className="xs muted">taklif</div></div>
          </Link>
        ))}</div>
      ) : <div className="card"><Empty icon="megaphone" title="E’lonlar yo‘q" text="Qaysi yuristni tanlashni bilmasangiz, e’lon joylang: bir necha taklif kelib, narxlarni solishtirasiz." action={<Link to="/jobs/new" className="btn btn-primary">E’lon joylash</Link>} /></div>}
    </>
  )
}

export function NewJob() {
  const loc = useLocation()
  const st = loc.state as { handoff?: HandoffCtx; budget?: { min: number; max: number } } | null
  const h = st?.handoff
  const nav = useNavigate()
  const cats = useAsync(() => api.reference.categories(), [])
  const regions = useAsync(() => api.reference.regions(), [])
  const [f, setF] = useState({
    title: h?.title ?? '', description: h?.summary ?? '', category: (h?.category ?? 'labor') as CategoryCode, serviceType: '' as ServiceType | '',
    budgetMin: st?.budget?.min ? String(st.budget.min) : '', budgetMax: st?.budget?.max ? String(st.budget.max) : '', deadline: '', region: '', format: 'online' as 'online' | 'office' | 'any',
  })
  const [share, setShare] = useState(!!h)
  const { busy, run } = useAction()
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value })
  const submit = async () => {
    const j = await run(() => api.jobs.create({
      title: f.title, description: f.description, category: f.category, serviceType: f.serviceType || null,
      budgetMin: f.budgetMin ? Number(f.budgetMin) : null, budgetMax: f.budgetMax ? Number(f.budgetMax) : null,
      deadline: f.deadline || null, region: f.region || null, format: f.format,
      sourceConversationId: h?.conversationId || null, shareConversation: share && !!h?.conversationId, sharedDocumentIds: share ? h?.documentIds ?? [] : [], caseId: h?.caseId ?? null,
    }), 'E’lon joylandi. Takliflar kelganda xabar beramiz.')
    if (j) nav(`/jobs/${j.id}`, { replace: true })
  }
  return (
    <div style={{ maxWidth: 780 }}>
      <PageHead title="E’lon joylash" sub="E’lon tasdiqlangan yuristlarga ko‘rinadi. Ismingiz qisqartiriladi, telefon raqamlar avtomatik yashiriladi." />
      <div className="card pad-lg stack-lg">
        {h && <div className="banner info small"><Icon name="sparkles" size={18} /><div>Matn AI suhbatingizdan tayyorlandi. Tahrirlashingiz mumkin.</div></div>}
        <Field label="Sarlavha"><input className="input" value={f.title} onChange={set('title')} placeholder="Masalan: Ishga tiklash bo‘yicha da’vo arizasi kerak" /></Field>
        <Field label="Vaziyat" hint="Nima bo‘ldi, qachon, qanday hujjatlar bor, nima natija kutyapsiz. Kontakt ma’lumot yozmang."><textarea className="textarea" rows={6} value={f.description} onChange={set('description')} /></Field>
        <div className="grid g2">
          <Field label="Yo‘nalish"><select className="select" value={f.category} onChange={set('category')}>{cats.data?.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select></Field>
          <Field label="Xizmat turi"><select className="select" value={f.serviceType} onChange={set('serviceType')}><option value="">Bilmayman</option>{Object.entries(SERVICE_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
          <Field label="Byudjet, dan (so‘m)"><input className="input" inputMode="numeric" value={f.budgetMin} onChange={set('budgetMin')} placeholder="100000" /></Field>
          <Field label="Byudjet, gacha (so‘m)"><input className="input" inputMode="numeric" value={f.budgetMax} onChange={set('budgetMax')} placeholder="300000" /></Field>
          <Field label="Qachongacha kerak"><input className="input" type="date" value={f.deadline} onChange={set('deadline')} /></Field>
          <Field label="Hudud"><select className="select" value={f.region} onChange={set('region')}><option value="">Farqi yo‘q</option>{regions.data?.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}</select></Field>
        </div>
        <Field label="Ish formati">
          <div className="row wrap" style={{ gap: 6 }}>{([['online', 'Onlayn'], ['office', 'Uchrashib'], ['any', 'Farqi yo‘q']] as const).map(([k, l]) => <button key={k} type="button" className={`chip ${f.format === k ? 'on' : ''}`} onClick={() => setF({ ...f, format: k })}>{l}</button>)}</div>
        </Field>
        {h && <label className="check"><input type="checkbox" checked={share} onChange={(e) => setShare(e.target.checked)} /><span className="small">AI suhbati va tanlangan hujjatlarni men tanlagan yuristga to‘lovdan keyin ochish</span></label>}
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8 }}>
          <button className="btn btn-ghost" onClick={() => nav(-1)}>Bekor qilish</button>
          <button className="btn btn-primary" disabled={busy || f.title.trim().length < 8 || f.description.trim().length < 30} onClick={submit}>{busy ? <span className="spinner" /> : 'E’lonni joylash'}</button>
        </div>
      </div>
    </div>
  )
}

export function JobDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const j = useAsync(() => api.jobs.get(id!), [id])
  const offers = useAsync(() => api.jobs.offers(id!), [id])
  const { busy, run } = useAction()
  if (j.loading) return <Loading />
  if (j.error || !j.data) return <ErrorBox error={j.error} />
  const job = j.data
  const accept = async (offerId: string) => { const o = await run(() => api.jobs.acceptOffer(job.id, offerId)); if (o) nav(`/checkout/${o.id}`) }
  return (
    <div className="stack-lg">
      <Link to="/jobs" className="btn-text btn small"><Icon name="arrowLeft" size={16} />E’lonlarim</Link>
      <div className="split">
        <div className="stack-lg">
          <section className="card pad-lg">
            <div className="row wrap" style={{ gap: 8 }}><Badge tone={JOB_STATUS[job.status][1]}>{JOB_STATUS[job.status][0]}</Badge><Badge tone="lapis">{job.category.name}</Badge>{job.serviceType && <Badge>{SERVICE_TYPE[job.serviceType]}</Badge>}</div>
            <h1 className="h2" style={{ marginTop: 10 }}>{job.title}</h1>
            <p className="pre" style={{ marginTop: 10, color: 'var(--ink-body)' }}>{job.description}</p>
          </section>
          <section>
            <h2 className="h2" style={{ marginBottom: 12 }}>Takliflar {offers.data ? `(${offers.data.length})` : ''}</h2>
            {offers.data?.length ? <div className="stack">{offers.data.map((of) => (
              <div key={of.id}>
                <LawyerCardView l={of.lawyer} compact action={
                  of.status === 'pending' && job.status === 'open'
                    ? <><button className="btn btn-sm btn-ghost" disabled={busy} onClick={async () => { await run(() => api.jobs.rejectOffer(job.id, of.id)); offers.reload(true) }}>Rad etish</button><button className="btn btn-sm btn-primary" disabled={busy} onClick={() => accept(of.id)}>Tanlash · {money(of.price)}</button></>
                    : <Badge tone={of.status === 'accepted' ? 'success' : ''}>{of.status === 'accepted' ? 'Tanlangan' : 'Rad etilgan'}</Badge>
                } />
                <div className="sunken small" style={{ margin: '-8px 12px 0', borderRadius: '0 0 14px 14px', paddingTop: 18 }}>
                  <div className="row between"><b>{money(of.price)} · {of.deliveryDays} kunda</b><span className="xs faint">{ago(of.createdAt)}</span></div>
                  <p style={{ marginTop: 6 }}>{of.message}</p>
                </div>
              </div>
            ))}</div> : <div className="card"><Empty icon="clock" title="Takliflar kutilmoqda" text="Odatda birinchi taklif bir necha soat ichida keladi. Kelganda bildirishnoma yuboramiz." /></div>}
          </section>
        </div>
        <aside className="card stack sticky">
          {job.budgetMax && <div className="row between small"><span className="muted">Byudjet</span><b>{money(job.budgetMin)}–{money(job.budgetMax)}</b></div>}
          {job.deadline && <div className="row between small"><span className="muted">Muddat</span><b>{dateFull(job.deadline)}</b></div>}
          <div className="row between small"><span className="muted">Joylangan</span><b>{ago(job.createdAt)}</b></div>
          <div className="row between small"><span className="muted">Avtomatik yopiladi</span><b>{dateFull(job.expiresAt)}</b></div>
          {job.orderId && <Link to={`/orders/${job.orderId}`} className="btn btn-primary btn-block">Buyurtmaga o‘tish</Link>}
          {job.status === 'open' && <button className="btn btn-ghost btn-block" disabled={busy} onClick={async () => { const r = await run(() => api.jobs.close(job.id), 'E’lon yopildi'); if (r) j.setData({ ...job, ...r }) }}>E’lonni yopish</button>}
          <div className="banner info xs"><Icon name="lock" size={16} /><div>Taklifni tanlaganingizdan keyin to‘lov qilasiz. Pul ish bajarilguncha platformada turadi.</div></div>
        </aside>
      </div>
    </div>
  )
}
