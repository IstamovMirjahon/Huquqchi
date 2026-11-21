import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api'
import type { ConsultationFormat, DocumentItem, Service, Slot } from '../../api/types'
import { useAuth } from '../../auth'
import { Icon } from '../../components/Icon'
import { nextLabel } from '../../components/LawyerCard'
import { Avatar, Badge, Empty, ErrorBox, Loading, Modal, Rating, Stars, Verified, useAction, useAsync } from '../../components/ui'
import { addDays, ago, dateFull, dayNum, FORMAT, LANG, LAWYER_TYPE, money, SERVICE_TYPE, time, todayTashkent, weekday, WORK_FORMAT } from '../../lib/format'

export interface HandoffCtx { conversationId: string; shareConversation: boolean; documentIds: string[]; summary: string; title: string; category?: string; caseId?: string }

export default function LawyerProfile() {
  const { id } = useParams()
  const loc = useLocation()
  const handoff = (loc.state as { handoff?: HandoffCtx } | null)?.handoff ?? null
  const { me } = useAuth()
  const p = useAsync(() => api.lawyers.get(id!), [id])
  const reviews = useAsync(() => api.lawyers.reviews(id!), [id])
  const [svc, setSvc] = useState<Service | null>(null)
  const nav = useNavigate()

  if (p.loading) return <Loading />
  if (p.error || !p.data) return <ErrorBox error={p.error} retry={p.reload} />
  const l = p.data
  const own = me?.lawyerProfileId === l.id
  const order = (s: Service) => { if (!me) { nav(`/login?next=/lawyers/${l.id}`); return } setSvc(s) }
  const total = Object.values(l.ratingBreakdown).reduce((a, b) => a + b, 0) || 1

  return (
    <div className="stack-lg">
      <Link to="/lawyers" className="btn-text btn small"><Icon name="arrowLeft" size={16} />Yuristlar</Link>
      {handoff && <div className="banner info"><Icon name="sparkles" /><div className="grow small">{handoff.caseId ? 'Ishingiz' : 'AI suhbatingiz'} «<b>{handoff.title}</b>» bu yuristga biriktiriladi (to‘lovdan keyin). Quyidan xizmat turini tanlang.</div></div>}
      {own && <div className="banner gold small"><Icon name="eye" size={18} />Bu sizning ochiq profilingiz: mijozlar uni shunday ko‘radi.</div>}

      <div className="split">
        <div className="stack-lg">
          <section className="card pad-lg">
            <div className="row top" style={{ gap: 20 }}>
              <Avatar name={l.name} size={88} online={l.isOnline} />
              <div className="grow">
                <div className="row wrap" style={{ gap: 10 }}><h1 className="h1">{l.name}</h1>{l.isVerified && <Verified label={LAWYER_TYPE[l.type]} />}</div>
                <p className="muted" style={{ marginTop: 4 }}>{l.headline}</p>
                <div className="row wrap small" style={{ gap: 16, marginTop: 12, color: 'var(--ink-2)' }}>
                  <Rating value={l.rating} count={l.reviewCount} />
                  <span className="row" style={{ gap: 5 }}><Icon name="briefcase" size={15} />{l.experienceYears} yil tajriba</span>
                  <span className="row" style={{ gap: 5 }}><Icon name="checkCircle" size={15} />{l.completedOrders} ta bajarilgan ish</span>
                  <span className="row" style={{ gap: 5 }}><Icon name="mapPin" size={15} />{l.city}</span>
                  <span className="row" style={{ gap: 5 }}><Icon name="globe" size={15} />{l.languages.map((x) => LANG[x]).join(', ')}</span>
                </div>
                <div className="row wrap" style={{ gap: 6, marginTop: 12 }}>
                  {l.categories.map((c) => <Badge key={c.code} tone="lapis">{c.name}</Badge>)}
                  {l.workFormats.map((f) => <Badge key={f}>{WORK_FORMAT[f]}</Badge>)}
                </div>
              </div>
            </div>
            <hr className="divider" />
            <p className="pre" style={{ color: 'var(--ink-body)' }}>{l.bio}</p>
            {l.education.length > 0 && (
              <div className="row wrap small" style={{ gap: 16, marginTop: 14 }}>
                {l.education.map((e) => <span key={e.institution} className="row" style={{ gap: 6 }}><Icon name="book" size={15} className="faint" />{e.institution}, {e.degree} ({e.year})</span>)}
                {l.licenseNumber && <span className="row" style={{ gap: 6 }}><Icon name="shieldCheck" size={15} className="faint" />Litsenziya {l.licenseNumber}{l.verifiedAt && `, ${dateFull(l.verifiedAt)} da tekshirilgan`}</span>}
              </div>
            )}
          </section>

          <section>
            <h2 className="h2" style={{ marginBottom: 12 }}>Xizmatlar</h2>
            <div className="grid g2">
              {l.services.map((s) => (
                <div key={s.id} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div className="row between"><Badge tone={s.type === 'consultation' ? 'teal' : s.type === 'question' ? 'lapis' : 'gold'}>{SERVICE_TYPE[s.type]}</Badge><span className="xs faint">{s.ordersCount} buyurtma</span></div>
                  <h3 className="h3" style={{ marginTop: 10 }}>{s.title}</h3>
                  <p className="small muted" style={{ marginTop: 4, flex: 1 }}>{s.description}</p>
                  <div className="row wrap xs muted" style={{ gap: 10, marginTop: 10 }}>
                    {s.durationMinutes && <span className="row" style={{ gap: 4 }}><Icon name="clock" size={14} />{s.durationMinutes} daqiqa</span>}
                    {s.deliveryDays && <span className="row" style={{ gap: 4 }}><Icon name="calendar" size={14} />{s.deliveryDays} kunda</span>}
                    <span>{s.formats.map((f) => FORMAT[f]).join(' · ')}</span>
                  </div>
                  <div className="row between" style={{ marginTop: 14 }}>
                    <b style={{ fontSize: 17 }}>{s.priceType === 'from' && <span className="xs faint">dan </span>}{money(s.price)}</b>
                    {!own && <button className="btn btn-sm btn-primary" onClick={() => order(s)}>{s.type === 'consultation' ? 'Vaqt tanlash' : 'Buyurtma berish'}</button>}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-head"><h2 className="h3">Sharhlar</h2><span className="small muted">Faqat bajarilgan buyurtmalardan</span></div>
            {reviews.data?.items.length ? reviews.data.items.map((r) => (
              <div key={r.id} className="list-item" style={{ alignItems: 'flex-start' }}>
                <Avatar name={r.client.name} size={36} />
                <div className="grow">
                  <div className="row between"><b className="small">{r.client.name}</b><span className="xs faint">{ago(r.createdAt)}</span></div>
                  <div className="row" style={{ gap: 8 }}><Stars value={r.rating} size={13} /><span className="xs faint">{r.serviceTitle}</span></div>
                  <p className="small" style={{ marginTop: 6 }}>{r.text}</p>
                  {r.lawyerReply && <div className="sunken small" style={{ marginTop: 8, padding: 10 }}><b className="xs">Yurist javobi:</b> {r.lawyerReply.text}</div>}
                </div>
              </div>
            )) : <Empty icon="star" title="Hali sharh yo‘q" />}
          </section>
        </div>

        <aside className="stack sticky">
          <div className="card">
            <div className="row between"><span className="muted small">Narx</span><b>{money(l.priceFrom)} dan</b></div>
            {l.nextAvailableAt && <div className="row between" style={{ marginTop: 8 }}><span className="muted small">Eng yaqin vaqt</span><b className="small" style={{ color: 'var(--success)' }}>{nextLabel(l.nextAvailableAt)}</b></div>}
            <div className="row between" style={{ marginTop: 8 }}><span className="muted small">Javob vaqti</span><b className="small">~{l.responseTimeMinutes} daqiqa</b></div>
            {!own && l.services[0] && <button className="btn btn-primary btn-block" style={{ marginTop: 16 }} onClick={() => order(l.services.find((s) => s.type === 'consultation') ?? l.services[0])}>Konsultatsiya bron qilish</button>}
          </div>
          <div className="card">
            <div className="row" style={{ gap: 12 }}><div style={{ fontSize: 36, fontWeight: 750 }}>{l.rating.toFixed(1)}</div><div><Stars value={l.rating} /><div className="xs faint">{l.reviewCount} ta sharh</div></div></div>
            {(['5', '4', '3', '2', '1'] as const).map((k) => (
              <div key={k} className="row" style={{ gap: 8, marginTop: 6 }}><span className="xs" style={{ width: 10 }}>{k}</span><div className="progress grow"><i style={{ width: `${(l.ratingBreakdown[k] / total) * 100}%` }} /></div></div>
            ))}
          </div>
          <div className="card small">
            <div className="row" style={{ gap: 8 }}><Icon name="shieldCheck" style={{ color: 'var(--lapis)' }} /><b>Xavfsiz buyurtma</b></div>
            <ul className="muted" style={{ margin: '8px 0 0', paddingLeft: 18, lineHeight: 1.7 }}>
              <li>Pul ish bajarilguncha platformada saqlanadi</li><li>Yurist 24 soatda qabul qilmasa, pul qaytadi</li><li>Barcha yozishmalar platforma ichida</li>
            </ul>
          </div>
        </aside>
      </div>

      {svc && <OrderModal service={svc} lawyerName={l.name} lawyerId={l.id} handoff={handoff} onClose={() => setSvc(null)} />}
    </div>
  )
}

function OrderModal({ service: s, lawyerName, lawyerId, handoff, onClose }: { service: Service; lawyerName: string; lawyerId: string; handoff: HandoffCtx | null; onClose: () => void }) {
  const nav = useNavigate()
  const { busy, run } = useAction()
  const isConsult = s.type === 'consultation'
  const [from] = useState(todayTashkent())
  const slots = useAsync(() => (isConsult ? api.lawyers.slots(lawyerId, { from, to: addDays(from, 13), serviceId: s.id }) : Promise.resolve(null)), [s.id])
  const [day, setDay] = useState<string | null>(null)
  const [slot, setSlot] = useState<Slot | null>(null)
  const [format, setFormat] = useState<ConsultationFormat>(s.formats[0])
  const [desc, setDesc] = useState(handoff?.summary ?? '')
  const [shareConv, setShareConv] = useState(!!handoff?.shareConversation)
  const [docIds, setDocIds] = useState<string[]>(handoff?.documentIds ?? [])
  const [consent, setConsent] = useState(!!handoff)
  const docs = useAsync<DocumentItem[]>(() => api.documents.list(), [])
  const firstDay = useMemo(() => slots.data?.days.find((d) => d.slots.length)?.date ?? null, [slots.data])
  useEffect(() => { if (!day && firstDay) setDay(firstDay) }, [firstDay, day])
  const daySlots = slots.data?.days.find((d) => d.date === day)?.slots ?? []
  const sharing = shareConv || docIds.length > 0

  const submit = async () => {
    const o = await run(() => api.orders.create({
      serviceId: s.id, slotStart: slot?.start, format: isConsult ? format : undefined, description: desc,
      sourceConversationId: handoff?.conversationId || null, shareConversation: shareConv && !!handoff?.conversationId, sharedDocumentIds: docIds, shareConsent: consent, caseId: handoff?.caseId ?? null,
    }))
    if (o) nav(`/checkout/${o.id}`)
  }

  return (
    <Modal open onClose={onClose} wide title={s.title} sub={`${lawyerName} · ${money(s.price)}${s.durationMinutes ? ` · ${s.durationMinutes} daqiqa` : ''}${s.deliveryDays ? ` · ${s.deliveryDays} kunda` : ''}`}
      footer={<>
        <button className="btn btn-ghost" onClick={onClose}>Bekor qilish</button>
        <button className="btn btn-primary" disabled={busy || (isConsult && !slot) || desc.trim().length < 10 || (sharing && !consent)} onClick={submit}>{busy ? <span className="spinner" /> : <>To‘lovga o‘tish · {money(s.price)}</>}</button>
      </>}>
      <div className="stack-lg">
        {isConsult && (
          <div className="stack">
            <div className="field"><span>Kun va vaqt (Toshkent vaqti)</span></div>
            {slots.loading ? <div className="skel" style={{ height: 76 }} /> : (
              <div className="days">
                {slots.data?.days.map((d) => (
                  <button key={d.date} className={`day ${day === d.date ? 'on' : ''} ${d.slots.length ? '' : 'none'}`} disabled={!d.slots.length} onClick={() => { setDay(d.date); setSlot(null) }}>
                    <small>{weekday(d.date)}</small><b>{dayNum(d.date)}</b><small>{d.slots.length ? `${d.slots.length} ta` : '—'}</small>
                  </button>
                ))}
              </div>
            )}
            {day && (daySlots.length ? (
              <div className="slots">{daySlots.map((x) => <button key={x.start} className={`slot ${slot?.start === x.start ? 'on' : ''}`} onClick={() => setSlot(x)}>{time(x.start)}</button>)}</div>
            ) : <p className="small muted">Bu kunda bo‘sh vaqt yo‘q.</p>)}
            {s.formats.length > 1 && (
              <div className="row wrap" style={{ gap: 6 }}>{s.formats.map((f) => <button key={f} className={`chip ${format === f ? 'on' : ''}`} onClick={() => setFormat(f)}>{FORMAT[f]}</button>)}</div>
            )}
          </div>
        )}
        <label className="field">
          <span>{s.type === 'question' ? 'Savolingiz' : 'Vaziyatni qisqacha yozing'}</span>
          <textarea className="textarea" rows={5} value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Nima bo‘ldi, qachon, qanday hujjatlar bor, nima natija kutyapsiz…" />
          <small>Telefon raqam yoki manzil yozmang: aloqa to‘lovdan keyin platforma chatida bo‘ladi.</small>
        </label>
        <div className="stack">
          <div className="field"><span>Yuristga ulashish (ixtiyoriy)</span></div>
          {handoff?.conversationId && <label className="check"><input type="checkbox" checked={shareConv} onChange={(e) => setShareConv(e.target.checked)} /><span className="small">AI suhbati: «{handoff.title}»</span></label>}
          <div className="row wrap" style={{ gap: 6 }}>
            {docs.data?.map((d) => (
              <button key={d.id} className={`chip ${docIds.includes(d.id) ? 'on' : ''}`} onClick={() => setDocIds(docIds.includes(d.id) ? docIds.filter((x) => x !== d.id) : [...docIds, d.id])}><Icon name="file" size={14} />{d.name}</button>
            ))}
            {docs.data?.length === 0 && <span className="xs faint">Hujjatlaringiz yo‘q</span>}
          </div>
          {sharing && <label className="check"><input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} /><span className="small">Tanlangan materiallarni faqat shu yurist ko‘rishiga roziman</span></label>}
        </div>
        <div className="banner info xs"><Icon name="lock" size={16} /><div>To‘lov kafolatlangan: yurist {isConsult ? 'konsultatsiyani o‘tkazib' : 'ishni topshirib'}, siz tasdiqlaguningizcha pul platformada turadi. Yurist 24 soatda qabul qilmasa, pul to‘liq qaytariladi.</div></div>
      </div>
    </Modal>
  )
}
