import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api'
import type { CategoryCode, ConsultationFormat, Schedule, Service, ServiceInput, ServiceType } from '../../api/types'
import { useAuth } from '../../auth'
import { Icon } from '../../components/Icon'
import { Badge, Empty, Field, Loading, Modal, PageHead, useAction, useAsync } from '../../components/ui'
import { addDays, dayNum, FORMAT, money, SERVICE_TYPE, time, todayTashkent, weekday } from '../../lib/format'

const WEEK = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba']

export function SchedulePage() {
  const s = useAsync(() => api.lawyer.schedule(), [])
  const [from, setFrom] = useState(todayTashkent())
  const cal = useAsync(() => api.lawyer.calendar(from, addDays(from, 6)), [from])
  const [draft, setDraft] = useState<Schedule | null>(null)
  const [exDate, setExDate] = useState('')
  const [exNote, setExNote] = useState('')
  const { busy, run } = useAction()
  useEffect(() => { if (s.data) setDraft(structuredClone(s.data)) }, [s.data])
  if (s.loading || !draft) return <Loading />
  const upd = (f: (d: Schedule) => void) => { const n = structuredClone(draft); f(n); setDraft(n) }
  const save = async () => { const r = await run(() => api.lawyer.saveSchedule(draft), 'Jadval saqlandi'); if (r) { s.setData(r); cal.reload(true) } }

  return (
    <div className="stack-lg">
      <PageHead eyebrow="Bo‘sh vaqtlar" title="Jadval" sub="Bo‘sh vaqtlaringizni belgilang. Mijozlar faqat shu vaqtlarga konsultatsiya bron qila oladi."
        actions={<><label className="check" style={{ alignItems: 'center' }}><input type="checkbox" checked={draft.isAcceptingBookings} onChange={(e) => upd((d) => { d.isAcceptingBookings = e.target.checked })} /><span className="small strong">Bron qabul qilaman</span></label><button className="btn btn-primary" disabled={busy} onClick={save}>{busy ? <span className="spinner" /> : 'Saqlash'}</button></>} />

      <section className="card">
        <div className="card-head">
          <h2 className="h3">Kalendar</h2>
          <div className="row" style={{ gap: 6 }}>
            <button className="icon-btn" onClick={() => setFrom(addDays(from, -7))} disabled={from <= todayTashkent()}><Icon name="arrowLeft" size={16} /></button>
            <button className="btn btn-sm btn-ghost" onClick={() => setFrom(todayTashkent())}>Bugun</button>
            <button className="icon-btn" onClick={() => setFrom(addDays(from, 7))}><Icon name="arrowRight" size={16} /></button>
          </div>
        </div>
        <div className="week">
          {cal.data?.days.map((d) => (
            <div key={d.date} className="sunken week-day">
              <div className="row between"><span className="xs strong faint" style={{ textTransform: 'uppercase' }}>{weekday(d.date)}</span><b>{dayNum(d.date)}</b></div>
              {d.booked.map((b) => <Link key={b.orderId} to={`/orders/${b.orderId}`} className="booked">{time(b.start)} · {b.clientName}<div className="xs" style={{ fontWeight: 500 }}>{FORMAT[b.format]}</div></Link>)}
              <div className="xs faint" style={{ marginTop: 8 }}>{d.free.length ? `${d.free.length} ta bo‘sh slot` : 'Bo‘sh vaqt yo‘q'}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid g2" style={{ alignItems: 'start' }}>
        <section className="card stack">
          <h2 className="h3">Haftalik ish vaqti</h2>
          {WEEK.map((name, i) => {
            const day = draft.weekly.find((w) => w.weekday === i + 1) ?? { weekday: i + 1, intervals: [] }
            return (
              <div key={name} className="row top" style={{ gap: 12, padding: '8px 0', borderBottom: '1px solid var(--hairline)' }}>
                <label className="check" style={{ width: 130, paddingTop: 8 }}><input type="checkbox" checked={day.intervals.length > 0} onChange={(e) => upd((d) => { const w = d.weekly.find((x) => x.weekday === i + 1); const iv = e.target.checked ? [{ start: '09:00', end: '18:00' }] : []; if (w) w.intervals = iv; else d.weekly.push({ weekday: i + 1, intervals: iv }) })} /><span className="small strong">{name}</span></label>
                <div className="grow stack" style={{ gap: 6 }}>
                  {day.intervals.map((iv, k) => (
                    <div key={k} className="row" style={{ gap: 6 }}>
                      <input type="time" className="input" style={{ height: 36, width: 110 }} value={iv.start} onChange={(e) => upd((d) => { d.weekly.find((x) => x.weekday === i + 1)!.intervals[k].start = e.target.value })} />
                      <span className="faint">—</span>
                      <input type="time" className="input" style={{ height: 36, width: 110 }} value={iv.end} onChange={(e) => upd((d) => { d.weekly.find((x) => x.weekday === i + 1)!.intervals[k].end = e.target.value })} />
                      <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => upd((d) => { d.weekly.find((x) => x.weekday === i + 1)!.intervals.splice(k, 1) })}><Icon name="x" size={14} /></button>
                    </div>
                  ))}
                  {day.intervals.length > 0 && <button className="btn-text btn xs" style={{ alignSelf: 'flex-start' }} onClick={() => upd((d) => { d.weekly.find((x) => x.weekday === i + 1)!.intervals.push({ start: '14:00', end: '18:00' }) })}>+ Oraliq qo‘shish</button>}
                  {day.intervals.length === 0 && <span className="small faint" style={{ paddingTop: 8 }}>Dam olish</span>}
                </div>
              </div>
            )
          })}
        </section>
        <div className="stack-lg">
          <section className="card stack">
            <h2 className="h3">Sozlamalar</h2>
            <div className="grid g2">
              <Field label="Slot qadami"><select className="select" value={draft.slotMinutes} onChange={(e) => upd((d) => { d.slotMinutes = Number(e.target.value) })}>{[15, 30, 45, 60].map((m) => <option key={m} value={m}>{m} daqiqa</option>)}</select></Field>
              <Field label="Uchrashuvlar orasida"><select className="select" value={draft.bufferMinutes} onChange={(e) => upd((d) => { d.bufferMinutes = Number(e.target.value) })}>{[0, 5, 10, 15, 30].map((m) => <option key={m} value={m}>{m} daqiqa</option>)}</select></Field>
              <Field label="Kamida oldin bron"><select className="select" value={draft.minNoticeHours} onChange={(e) => upd((d) => { d.minNoticeHours = Number(e.target.value) })}>{[1, 2, 3, 6, 12, 24].map((m) => <option key={m} value={m}>{m} soat</option>)}</select></Field>
              <Field label="Necha kun oldinga"><select className="select" value={draft.maxDaysAhead} onChange={(e) => upd((d) => { d.maxDaysAhead = Number(e.target.value) })}>{[7, 14, 30, 60].map((m) => <option key={m} value={m}>{m} kun</option>)}</select></Field>
            </div>
          </section>
          <section className="card stack">
            <h2 className="h3">Istisno kunlar</h2>
            <p className="small muted">Ta’til, sud majlisi yoki boshqa band kunlar. Mavjud bronlarga ta’sir qilmaydi.</p>
            <div className="row" style={{ gap: 6 }}>
              <input type="date" className="input" style={{ width: 170 }} value={exDate} min={todayTashkent()} onChange={(e) => setExDate(e.target.value)} />
              <input className="input" placeholder="Izoh (ixtiyoriy)" value={exNote} onChange={(e) => setExNote(e.target.value)} />
              <button className="btn btn-ghost" disabled={!exDate} onClick={() => { upd((d) => { d.exceptions = d.exceptions.filter((x) => x.date !== exDate); d.exceptions.push({ date: exDate, isAvailable: false, intervals: [], note: exNote || null }) }); setExDate(''); setExNote('') }}>Qo‘shish</button>
            </div>
            {draft.exceptions.map((e) => (
              <div key={e.date} className="row between small"><span><b>{e.date}</b> · {e.isAvailable ? 'Maxsus vaqt' : 'Band'}{e.note ? ` · ${e.note}` : ''}</span><button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => upd((d) => { d.exceptions = d.exceptions.filter((x) => x.date !== e.date) })}><Icon name="x" size={13} /></button></div>
            ))}
          </section>
        </div>
      </div>
    </div>
  )
}

const EMPTY: ServiceInput = { type: 'consultation', category: 'labor', title: '', description: '', price: 100000, priceType: 'fixed', durationMinutes: 30, deliveryDays: null, formats: ['video', 'chat'] }

export function ServicesPage() {
  const { me } = useAuth()
  const r = useAsync(() => api.lawyer.services(), [])
  const cats = useAsync(() => api.reference.categories(), [])
  const [edit, setEdit] = useState<{ id?: string; v: ServiceInput } | null>(null)
  const { busy, run } = useAction()
  const plan = me?.subscription.planCode
  const save = async () => {
    if (!edit) return
    const v = { ...edit.v, durationMinutes: edit.v.type === 'consultation' ? edit.v.durationMinutes : null, deliveryDays: edit.v.type === 'consultation' ? null : edit.v.deliveryDays, formats: edit.v.type === 'consultation' ? edit.v.formats : (['chat'] as ConsultationFormat[]) }
    const res = await run(() => (edit.id ? api.lawyer.updateService(edit.id, v) : api.lawyer.createService(v)), 'Saqlandi')
    if (res) { setEdit(null); r.reload(true) }
  }
  const toggle = async (s: Service) => { await run(() => api.lawyer.updateService(s.id, { isActive: !s.isActive })); r.reload(true) }
  const set = <K extends keyof ServiceInput>(k: K, v: ServiceInput[K]) => setEdit((e) => (e ? { ...e, v: { ...e.v, [k]: v } } : e))

  return (
    <>
      <PageHead title="Mening xizmatlarim" sub="Xizmat e’lonlari profilingizda va katalogda ko‘rinadi. Mijoz ularni to‘g‘ridan-to‘g‘ri buyurtma qiladi."
        actions={<button className="btn btn-primary" onClick={() => setEdit({ v: { ...EMPTY } })}><Icon name="plus" size={17} />Xizmat qo‘shish</button>} />
      {plan === 'lawyer_free' && <div className="banner info small" style={{ marginBottom: 16 }}><Icon name="info" size={17} /><div>Standart tarif: 5 tagacha faol xizmat, komissiya 15%. <Link to="/pro/profile#plans" className="btn-text btn">Yurist Pro</Link> bilan cheksiz xizmat va 10% komissiya.</div></div>}
      {r.loading ? <Loading /> : r.data?.length ? (
        <div className="grid g2">{r.data.map((s) => (
          <div key={s.id} className="card" style={{ opacity: s.isActive ? 1 : .6 }}>
            <div className="row between"><div className="row" style={{ gap: 6 }}><Badge tone={s.type === 'consultation' ? 'teal' : 'gold'}>{SERVICE_TYPE[s.type]}</Badge><Badge>{s.category.name}</Badge></div>{s.isActive ? <Badge tone="success">Faol</Badge> : <Badge>To‘xtatilgan</Badge>}</div>
            <h3 className="h3" style={{ marginTop: 10 }}>{s.title}</h3>
            <p className="small muted clamp2" style={{ marginTop: 4 }}>{s.description}</p>
            <div className="row between" style={{ marginTop: 12 }}>
              <div><b>{money(s.price)}</b><span className="xs faint"> · {s.durationMinutes ? `${s.durationMinutes} daq` : `${s.deliveryDays} kun`} · {s.ordersCount} buyurtma</span></div>
              <div className="row" style={{ gap: 6 }}>
                <button className="btn btn-sm btn-ghost" onClick={() => toggle(s)}>{s.isActive ? 'To‘xtatish' : 'Faollashtirish'}</button>
                <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={() => setEdit({ id: s.id, v: { type: s.type, category: s.category.code, title: s.title, description: s.description, price: s.price, priceType: s.priceType, durationMinutes: s.durationMinutes, deliveryDays: s.deliveryDays, formats: s.formats } })}><Icon name="edit" size={15} /></button>
                <button className="icon-btn" style={{ width: 34, height: 34 }} onClick={async () => { if (confirm('Xizmatni o‘chirasizmi?')) { await run(() => api.lawyer.deleteService(s.id), 'O‘chirildi'); r.reload(true) } }}><Icon name="trash" size={15} /></button>
              </div>
            </div>
          </div>
        ))}</div>
      ) : <div className="card"><Empty icon="zap" title="Hali xizmat yo‘q" text="Masalan: «Onlayn konsultatsiya, 30 daqiqa» yoki «Ijara shartnomasini tekshirish»." action={<button className="btn btn-primary" onClick={() => setEdit({ v: { ...EMPTY } })}>Birinchi xizmatni qo‘shish</button>} /></div>}

      {edit && (
        <Modal open wide onClose={() => setEdit(null)} title={edit.id ? 'Xizmatni tahrirlash' : 'Yangi xizmat'} footer={<><button className="btn btn-ghost" onClick={() => setEdit(null)}>Bekor qilish</button><button className="btn btn-primary" disabled={busy || edit.v.title.trim().length < 5} onClick={save}>{busy ? <span className="spinner" /> : 'Saqlash'}</button></>}>
          <div className="stack">
            <div className="grid g2">
              <Field label="Turi"><select className="select" value={edit.v.type} onChange={(e) => set('type', e.target.value as ServiceType)}>{Object.entries(SERVICE_TYPE).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></Field>
              <Field label="Yo‘nalish"><select className="select" value={edit.v.category} onChange={(e) => set('category', e.target.value as CategoryCode)}>{cats.data?.map((c) => <option key={c.code} value={c.code}>{c.name}</option>)}</select></Field>
            </div>
            <Field label="Sarlavha"><input className="input" value={edit.v.title} onChange={(e) => set('title', e.target.value)} placeholder="Onlayn konsultatsiya, 30 daqiqa" /></Field>
            <Field label="Tavsif" hint="Nima kiradi, mijoz nima oladi. Kontakt yozmang."><textarea className="textarea" value={edit.v.description} onChange={(e) => set('description', e.target.value)} /></Field>
            <div className="grid g3">
              <Field label="Narx (so‘m)"><input className="input" inputMode="numeric" value={edit.v.price} onChange={(e) => set('price', Number(e.target.value.replace(/\D/g, '')))} /></Field>
              <Field label="Narx turi"><select className="select" value={edit.v.priceType} onChange={(e) => set('priceType', e.target.value as ServiceInput['priceType'])}><option value="fixed">Qat’iy</option><option value="from">…dan boshlab</option></select></Field>
              {edit.v.type === 'consultation'
                ? <Field label="Davomiyligi"><select className="select" value={edit.v.durationMinutes ?? 30} onChange={(e) => set('durationMinutes', Number(e.target.value))}>{[15, 30, 45, 60, 90].map((m) => <option key={m} value={m}>{m} daqiqa</option>)}</select></Field>
                : <Field label="Bajarish muddati (kun)"><input className="input" inputMode="numeric" value={edit.v.deliveryDays ?? ''} onChange={(e) => set('deliveryDays', Number(e.target.value.replace(/\D/g, '')) || null)} /></Field>}
            </div>
            {edit.v.type === 'consultation' && (
              <Field label="Format"><div className="row wrap" style={{ gap: 6 }}>{(Object.keys(FORMAT) as ConsultationFormat[]).map((f) => <button key={f} type="button" className={`chip ${edit.v.formats.includes(f) ? 'on' : ''}`} onClick={() => set('formats', edit.v.formats.includes(f) ? edit.v.formats.filter((x) => x !== f) : [...edit.v.formats, f])}>{FORMAT[f]}</button>)}</div></Field>
            )}
            {edit.v.price > 0 && <p className="xs muted">Sizga tushadi: <b>{money(Math.round(edit.v.price * (plan === 'lawyer_pro' ? 0.9 : 0.85)))}</b> (komissiya {plan === 'lawyer_pro' ? '10' : '15'}%)</p>}
          </div>
        </Modal>
      )}
    </>
  )
}
