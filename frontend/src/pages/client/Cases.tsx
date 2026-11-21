import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { api } from '../../api'
import type { CalcResult, CalculatorCode, Case, CaseStep } from '../../api/types'
import { Icon } from '../../components/Icon'
import { Badge, Empty, ErrorBox, Field, FilePick, Loading, Modal, PageHead, useAction, useAsync, useToast } from '../../components/ui'
import { ago, dateFull, money, ORDER_STATUS, todayTashkent, until } from '../../lib/format'

const STATUS = { active: ['Faol', 'lapis'], resolved: ['Hal qilindi', 'success'], closed: ['Yopilgan', ''] } as const
const STEP_ICON: Record<CaseStep['kind'], string> = { analyze: 'sparkles', check_document: 'fileSearch', collect: 'folder', calculate: 'receiptMoney', draft: 'filePlus', send: 'send', authority: 'building', lawyer: 'users', track: 'checkCircle', custom: 'dots' }

export function CasesList() {
  const r = useAsync(() => api.cases.list(), [])
  return (
    <>
      <PageHead eyebrow="Legal Case Assistant" title="Ishlarim" sub="Bitta huquqiy muammo, bitta ish. AI bosqichma-bosqich reja tuzadi, siz har qadamni bajarib, muddatlarni kuzatasiz."
        actions={<Link to="/cases/new" className="btn btn-primary"><Icon name="plus" size={17} />Yangi ish</Link>} />
      {r.loading ? <Loading /> : r.data?.length ? (
        <div className="grid g2">{r.data.map((c) => (
          <Link key={c.id} to={`/cases/${c.id}`} className="card">
            <div className="row between"><Badge tone="lapis">{c.category.name}</Badge><Badge tone={STATUS[c.status][1]}>{STATUS[c.status][0]}</Badge></div>
            <h3 className="h3" style={{ marginTop: 12 }}>{c.title}</h3>
            <div className="row between xs muted" style={{ marginTop: 12 }}><span>{c.progress.done} / {c.progress.total} qadam</span>{c.amountClaimed != null && <b style={{ color: 'var(--ink)' }}>{money(c.amountClaimed)}</b>}</div>
            <div className="progress" style={{ marginTop: 6 }}><i style={{ width: `${(c.progress.done / Math.max(c.progress.total, 1)) * 100}%` }} /></div>
            {c.nextStep && <div className="row small" style={{ gap: 8, marginTop: 14 }}><Icon name="arrowRight" size={15} style={{ color: 'var(--lapis)' }} /><span>Keyingi qadam: <b>{c.nextStep.title}</b></span></div>}
            {c.nearestDeadline && <div className="row xs" style={{ gap: 8, marginTop: 6, color: 'var(--warning)', fontWeight: 600 }}><Icon name="clock" size={14} />{c.nearestDeadline.title}: {dateFull(c.nearestDeadline.date)}</div>}
          </Link>
        ))}</div>
      ) : (
        <div className="card"><Empty icon="briefcase" title="Hali ish ochilmagan" text="Masalan: ish haqi berilmayapti, garov qaytarilmayapti, sifatsiz tovar. AI vaziyatni tahlil qilib, qadamma-qadam reja tuzadi." action={<Link to="/cases/new" className="btn btn-primary">Ish ochish</Link>} /></div>
      )}
    </>
  )
}

export function NewCase() {
  const loc = useLocation()
  const st = loc.state as { conversationId?: string; situation?: string; title?: string } | null
  const nav = useNavigate()
  const [situation, setSituation] = useState(st?.situation ?? '')
  const [title, setTitle] = useState(st?.title ?? '')
  const { busy, run } = useAction()
  const examples = ['Ish beruvchi ikki oydan beri ish haqimni bermayapti. Mehnat shartnomam bor.', 'Ijaradan chiqdim, uy egasi 3 mln so‘m garovni qaytarmayapti.', 'Do‘kondan olgan telefonim 2 haftada buzildi, sotuvchi qaytarib olmayapti.']
  const create = async () => { const c = await run(() => api.cases.create({ situation, title: title || undefined, sourceConversationId: st?.conversationId ?? null })); if (c) nav(`/cases/${c.id}`, { replace: true }) }
  return (
    <div style={{ maxWidth: 760 }}>
      <PageHead eyebrow="Legal Case Assistant" title="Yangi ish ochish" sub="Vaziyatni oddiy so‘zlar bilan yozing. AI qaysi qadamlar kerakligini, qaysi hujjatlar va muddatlar muhimligini aniqlaydi." />
      <div className="card pad-lg stack-lg">
        {st?.conversationId && <div className="banner info small"><Icon name="sparkles" size={18} /><div>Ish AI suhbatingizdan ochiladi, suhbat ishga biriktiriladi.</div></div>}
        <Field label="Nima bo‘ldi?" hint="Kim, qachon, qancha summa, qanday hujjatlar bor. Shaxsiy ma’lumotlarni yozish shart emas."><textarea className="textarea" rows={6} value={situation} onChange={(e) => setSituation(e.target.value)} autoFocus /></Field>
        {!st?.situation && <div className="row wrap" style={{ gap: 6 }}>{examples.map((x) => <button key={x} className="chip" style={{ height: 'auto', padding: '7px 12px', whiteSpace: 'normal', textAlign: 'left' }} onClick={() => setSituation(x)}>{x}</button>)}</div>}
        <Field label="Ish nomi (ixtiyoriy)"><input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="AI o‘zi taklif qiladi" /></Field>
        <div className="banner gold xs"><Icon name="shield" size={16} /><div>AI reja va tavsiya beradi, yakuniy qarorni siz yoki yurist qabul qilasiz. Yuridik ahamiyatli qarorlar faqat AI xulosasiga asoslanmaydi.</div></div>
        <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn btn-primary btn-lg" disabled={busy || situation.trim().length < 20} onClick={create}>{busy ? <><span className="spinner" />AI reja tuzmoqda…</> : 'Ish ochish'}</button></div>
      </div>
    </div>
  )
}

export function CaseDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const toast = useToast()
  const r = useAsync(() => api.cases.get(id!), [id])
  const [calc, setCalc] = useState<{ step: CaseStep; code: CalculatorCode } | null>(null)
  const [docStep, setDocStep] = useState<CaseStep | null>(null)
  const [newStep, setNewStep] = useState(false)
  const [newDl, setNewDl] = useState(false)
  const [txt, setTxt] = useState({ title: '', date: '' })
  const { busy, run } = useAction()
  if (r.loading) return <Loading />
  if (r.error || !r.data) return <ErrorBox error={r.error} retry={r.reload} />
  const c = r.data
  const set = (x?: Case) => x && r.setData(x)
  const stepStatus = async (s: CaseStep, status: CaseStep['status']) => set(await run(() => api.cases.updateStep(c.id, s.id, { status })))
  const handoff = { conversationId: c.links.conversations[0]?.id ?? '', shareConversation: !!c.links.conversations[0], documentIds: c.links.documents.map((d) => d.id), summary: `${c.title}. ${c.summary}${c.amounts.claimed ? ` Talab summasi: ${money(c.amounts.claimed)}.` : ''}`, title: c.title, category: c.category.code, caseId: c.id }

  const doAction = (s: CaseStep) => {
    const a = s.action
    if (a.type === 'chat') nav(c.links.conversations[0] ? `/chat/${c.links.conversations[0].id}` : `/chat?q=${encodeURIComponent(c.summary)}`)
    else if (a.type === 'calculator' && a.calculator) setCalc({ step: s, code: a.calculator })
    else if (a.type === 'upload_document' || a.type === 'analyze_document') setDocStep(s)
    else if (a.type === 'create_draft') nav(`/create?template=${a.templateCode}`, { state: { caseId: c.id, stepId: s.id, prefill: { facts: c.summary, demand: c.amounts.claimed ? `${money(c.amounts.claimed)}ni 10 kun ichida to‘lash` : '', amount: c.amounts.claimed ? String(c.amounts.claimed) : '' } } })
    else if (a.type === 'find_lawyer') nav(`/lawyers${a.serviceType ? `?serviceType=${a.serviceType}&category=${c.category.code}` : `?category=${c.category.code}`}`, { state: { handoff } })
    else if (a.type === 'mark_sent') stepStatus(s, 'done').then(() => toast('Topshirilgan sana qayd etildi. Javob muddati qo‘shildi.'))
  }
  const actionLabel: Record<string, string> = { chat: 'AI bilan muhokama', calculator: 'Hisoblash', upload_document: 'Hujjat yuklash', analyze_document: 'Hujjatni tekshirish', create_draft: 'Hujjat tayyorlash', find_lawyer: 'Yurist topish', mark_sent: 'Topshirdim' }

  return (
    <div className="stack-lg">
      <Link to="/cases" className="btn-text btn small"><Icon name="arrowLeft" size={16} />Ishlarim</Link>
      <section className="card pad-lg">
        <div className="row between top wrap" style={{ gap: 12 }}>
          <div className="grow">
            <div className="row wrap" style={{ gap: 8 }}><Badge tone="lapis">{c.category.name}</Badge><Badge tone={STATUS[c.status][1]}>{STATUS[c.status][0]}</Badge><span className="xs faint">ochilgan {ago(c.createdAt)}</span></div>
            <h1 className="h1" style={{ marginTop: 10 }}>{c.title}</h1>
            <p className="muted" style={{ marginTop: 6, maxWidth: 760 }}>{c.summary}</p>
          </div>
          <div className="row wrap" style={{ gap: 8 }}>
            <button className="btn btn-gold" onClick={() => nav(`/lawyers?category=${c.category.code}`, { state: { handoff } })}><Icon name="users" size={16} />Yurist bilan ishlash</button>
            {c.status === 'active' ? <button className="btn btn-ghost" onClick={async () => set(await run(() => api.cases.update(c.id, { status: 'resolved' }), 'Ish hal qilindi deb belgilandi'))}>Hal qilindi</button> : <button className="btn btn-ghost" onClick={async () => set(await run(() => api.cases.update(c.id, { status: 'active' })))}>Qayta ochish</button>}
          </div>
        </div>
        <div className="grid g3" style={{ marginTop: 20 }}>
          <div className="sunken"><div className="xs muted">Jarayon</div><div className="row" style={{ gap: 10, marginTop: 6 }}><b style={{ fontSize: 20 }}>{c.progress.done}/{c.progress.total}</b><div className="progress grow"><i style={{ width: `${(c.progress.done / Math.max(c.progress.total, 1)) * 100}%` }} /></div></div></div>
          <div className="sunken"><div className="xs muted">Talab summasi</div><b style={{ fontSize: 20 }}>{c.amounts.claimed != null ? money(c.amounts.claimed) : '—'}</b></div>
          <div className="sunken"><div className="xs muted">Eng yaqin muddat</div><b style={{ fontSize: 15 }}>{c.nearestDeadline ? `${dateFull(c.nearestDeadline.date)} · ${until(`${c.nearestDeadline.date}T18:00:00Z`)}` : '—'}</b></div>
        </div>
      </section>

      <div className="split">
        <section className="card pad-lg">
          <div className="card-head"><h2 className="h3">Reja</h2><div className="row" style={{ gap: 6 }}><Badge tone="lapis" icon="sparkles">AI tavsiyasi</Badge><button className="btn btn-sm btn-ghost" onClick={() => setNewStep(true)}><Icon name="plus" size={14} />Qadam</button></div></div>
          <div className="stack">
            {c.steps.map((s) => {
              const done = s.status === 'done', skipped = s.status === 'skipped', isNext = c.nextStep?.id === s.id
              return (
                <div key={s.id} className="row top" style={{ gap: 14, padding: 14, borderRadius: 16, background: isNext ? 'var(--lapis-soft)' : done ? 'rgba(255,255,255,.5)' : '#fff', border: `1px solid ${isNext ? 'rgba(74,107,235,.3)' : 'var(--hairline)'}`, opacity: skipped ? 0.5 : 1 }}>
                  <button onClick={() => stepStatus(s, done ? 'todo' : 'done')} title={done ? 'Qayta ochish' : 'Bajarildi deb belgilash'} style={{ width: 34, height: 34, borderRadius: 11, flexShrink: 0, border: 0, cursor: 'pointer', display: 'grid', placeItems: 'center', background: done ? 'var(--success)' : isNext ? 'var(--lapis)' : 'var(--sunken)', color: done || isNext ? '#fff' : 'var(--ink-2)' }}>
                    <Icon name={done ? 'check' : STEP_ICON[s.kind]} size={17} />
                  </button>
                  <div className="grow">
                    <div className="row wrap" style={{ gap: 8 }}><b style={{ textDecoration: skipped ? 'line-through' : undefined }}>{s.order}. {s.title}</b>{isNext && <Badge tone="lapis">Keyingi</Badge>}{s.source === 'user' && <Badge>O‘zim qo‘shdim</Badge>}</div>
                    {s.description && <p className="small muted" style={{ marginTop: 2 }}>{s.description}</p>}
                    {s.result && <p className="small" style={{ marginTop: 4, color: 'var(--success)', fontWeight: 600 }}>✓ {s.result}</p>}
                    {!done && !skipped && (
                      <div className="row wrap" style={{ gap: 6, marginTop: 10 }}>
                        {s.action.type !== 'none' && <button className={`btn btn-sm ${isNext ? 'btn-primary' : 'btn-ghost'}`} disabled={busy} onClick={() => doAction(s)}>{actionLabel[s.action.type]}</button>}
                        <button className="btn btn-sm btn-text" style={{ color: 'var(--ink-faint)' }} onClick={() => stepStatus(s, 'skipped')}>O‘tkazib yuborish</button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
          <p className="xs faint" style={{ marginTop: 16 }}>{c.disclaimer}</p>
        </section>

        <aside className="stack sticky">
          <section className="card">
            <div className="card-head"><h3 className="h3">Muddatlar</h3><button className="btn btn-sm btn-ghost" onClick={() => { setTxt({ title: '', date: todayTashkent() }); setNewDl(true) }}><Icon name="plus" size={14} /></button></div>
            {c.deadlines.length ? c.deadlines.map((d) => (
              <label key={d.id} className="check" style={{ padding: '8px 0', borderBottom: '1px solid var(--hairline)' }}>
                <input type="checkbox" checked={d.done} onChange={async (e) => set(await run(() => api.cases.updateDeadline(c.id, d.id, { done: e.target.checked })))} />
                <span className="grow"><span className="small strong" style={{ textDecoration: d.done ? 'line-through' : undefined }}>{d.title}</span><br /><span className="xs" style={{ color: d.kind === 'legal' ? 'var(--danger)' : 'var(--ink-faint)', fontWeight: 600 }}>{dateFull(d.date)}{d.kind === 'legal' ? ' · qonuniy muddat' : d.kind === 'response' ? ' · javob kutish' : ''}</span>{d.note && <><br /><span className="xs faint">{d.note}</span></>}</span>
              </label>
            )) : <p className="small muted">Muddatlar yo‘q</p>}
          </section>
          <section className="card">
            <h3 className="h3" style={{ marginBottom: 8 }}>Biriktirilganlar</h3>
            {c.links.conversations.map((x) => <Link key={x.id} to={`/chat/${x.id}`} className="list-item small"><Icon name="sparkles" size={16} style={{ color: 'var(--lapis)' }} /><span className="grow">{x.title}</span></Link>)}
            {c.links.documents.map((x) => <Link key={x.id} to={`/documents/${x.id}`} className="list-item small"><Icon name="file" size={16} className="faint" /><span className="grow">{x.name}</span></Link>)}
            {c.links.drafts.map((x) => <Link key={x.id} to={`/drafts/${x.id}`} className="list-item small"><Icon name="filePlus" size={16} style={{ color: 'var(--gold)' }} /><span className="grow">{x.name}</span></Link>)}
            {c.links.orders.map((x) => <Link key={x.id} to={`/orders/${x.id}`} className="list-item small"><Icon name="briefcase" size={16} style={{ color: 'var(--teal)' }} /><span className="grow">{x.number} · {x.title}</span><Badge tone={ORDER_STATUS[x.status][1]}>{ORDER_STATUS[x.status][0]}</Badge></Link>)}
            {!c.links.conversations.length && !c.links.documents.length && !c.links.drafts.length && !c.links.orders.length && <p className="small muted">Hali hech narsa biriktirilmagan</p>}
          </section>
          <section className="card">
            <h3 className="h3" style={{ marginBottom: 10 }}>Tarix</h3>
            <div className="timeline">{c.events.slice(0, 8).map((e) => <div key={e.id} className="t"><div className="small">{e.text}</div><div className="xs faint">{e.actor === 'ai' ? 'AI · ' : ''}{ago(e.createdAt)}</div></div>)}</div>
          </section>
        </aside>
      </div>

      {calc && <CalculatorModal caseId={c.id} step={calc.step} code={calc.code} onClose={() => setCalc(null)} onDone={() => { setCalc(null); r.reload(true) }} />}
      {docStep && <DocModal caseId={c.id} step={docStep} onClose={() => setDocStep(null)} onDone={(x) => { set(x); setDocStep(null) }} />}
      <Modal open={newStep} onClose={() => setNewStep(false)} title="Qadam qo‘shish" footer={<><button className="btn btn-ghost" onClick={() => setNewStep(false)}>Bekor qilish</button><button className="btn btn-primary" disabled={!txt.title.trim()} onClick={async () => { set(await run(() => api.cases.addStep(c.id, { title: txt.title }))); setNewStep(false); setTxt({ title: '', date: '' }) }}>Qo‘shish</button></>}>
        <input className="input" placeholder="Masalan: Guvoh bilan gaplashish" value={txt.title} onChange={(e) => setTxt({ ...txt, title: e.target.value })} />
      </Modal>
      <Modal open={newDl} onClose={() => setNewDl(false)} title="Muddat qo‘shish" footer={<><button className="btn btn-ghost" onClick={() => setNewDl(false)}>Bekor qilish</button><button className="btn btn-primary" disabled={!txt.title.trim() || !txt.date} onClick={async () => { set(await run(() => api.cases.addDeadline(c.id, { title: txt.title, date: txt.date, kind: 'self' }))); setNewDl(false) }}>Qo‘shish</button></>}>
        <div className="stack"><input className="input" placeholder="Nima?" value={txt.title} onChange={(e) => setTxt({ ...txt, title: e.target.value })} /><input className="input" type="date" value={txt.date} onChange={(e) => setTxt({ ...txt, date: e.target.value })} /></div>
      </Modal>
    </div>
  )
}

const CALC_FIELDS: Record<CalculatorCode, [string, string, string?][]> = {
  unpaid_wages: [['monthlySalary', 'Oylik ish haqi (hisoblangan, so‘m)'], ['months', 'Necha oy to‘lanmagan'], ['otherUnpaid', 'Boshqa to‘lanmagan summalar (ixtiyoriy)', 'Mukofot, ta’til puli']],
  deposit_return: [['deposit', 'Garov summasi (so‘m)'], ['deductions', 'Asosli ushlab qolishlar (so‘m)', 'Zarar yoki qarz bo‘lsa']],
  goods_refund: [['price', 'Tovar narxi (so‘m)'], ['expenses', 'Bog‘liq xarajatlar (so‘m)', 'Yetkazish, ta’mir']],
}
function CalculatorModal({ caseId, step, code, onClose, onDone }: { caseId: string; step: CaseStep; code: CalculatorCode; onClose: () => void; onDone: () => void }) {
  const [v, setV] = useState<Record<string, string>>({})
  const [res, setRes] = useState<CalcResult | null>(null)
  const { busy, run } = useAction()
  const go = async () => setRes((await run(() => api.cases.calculate(caseId, { calculator: code, inputs: Object.fromEntries(Object.entries(v).map(([k, x]) => [k, Number(x) || 0])), stepId: step.id }))) ?? null)
  return (
    <Modal open onClose={res ? onDone : onClose} title={step.title} sub="Hisob kodda bajariladi, AI taxmin qilmaydi. Natija tavsiya: summani yurist bilan tekshiring."
      footer={res ? <button className="btn btn-primary" onClick={onDone}>Tayyor</button> : <><button className="btn btn-ghost" onClick={onClose}>Bekor qilish</button><button className="btn btn-primary" disabled={busy} onClick={go}>Hisoblash</button></>}>
      {!res ? (
        <div className="stack">{CALC_FIELDS[code].map(([k, l, h]) => <Field key={k} label={l} hint={h}><input className="input" inputMode="numeric" value={v[k] ?? ''} onChange={(e) => setV({ ...v, [k]: e.target.value.replace(/\D/g, '') })} /></Field>)}</div>
      ) : (
        <div className="stack">
          {res.breakdown.map((b) => <div key={b.label} className="row between small"><span className="muted">{b.label}</span><b className="mono">{money(b.amount)}</b></div>)}
          <hr className="divider" style={{ margin: '4px 0' }} />
          <div className="row between"><b>Jami talab</b><b style={{ fontSize: 22 }}>{money(res.total)}</b></div>
          {res.notes.map((n) => <div key={n} className="banner warn xs"><Icon name="info" size={15} /><div>{n}</div></div>)}
          {res.citations.map((ct) => <a key={ct.sectionId} href={`/laws/${ct.legalDocumentId}?section=${ct.sectionId}`} className="citation xs"><b>{ct.documentTitle}, {ct.articleNumber}-modda</b></a>)}
        </div>
      )}
    </Modal>
  )
}

function DocModal({ caseId, step, onClose, onDone }: { caseId: string; step: CaseStep; onClose: () => void; onDone: (c: Case) => void }) {
  const docs = useAsync(() => api.documents.list(), [])
  const nav = useNavigate()
  const { busy, run } = useAction()
  const analyze = step.action.type === 'analyze_document'
  const pick = async (docId: string) => {
    const c = await run(() => api.cases.link(caseId, { kind: 'document', refId: docId, stepId: analyze ? undefined : step.id }))
    if (!c) return
    if (analyze) nav(`/documents/${docId}`)
    else onDone(c)
  }
  return (
    <Modal open onClose={onClose} title={step.title} sub={analyze ? 'Hujjatni tanlang: AI tahlili ochiladi. Natijani ko‘rib, qadamni bajarildi deb belgilang.' : 'Hujjatlar ishga biriktiriladi va «Hujjatlarim»da saqlanadi.'}>
      <FilePick className="btn btn-ghost btn-block" accept=".pdf,.docx,.jpg,.jpeg,.png" disabled={busy} onFile={async (f) => { const d = await run(() => api.documents.upload(f, 'Uploaded')); if (d) pick(d.id) }}><Icon name="upload" size={17} />Yangi fayl yuklash</FilePick>
      <div className="list" style={{ marginTop: 10 }}>{docs.data?.map((d) => (
        <button key={d.id} className="list-item" style={{ border: 0, background: 'none', width: '100%', textAlign: 'left', cursor: 'pointer' }} onClick={() => pick(d.id)}><Icon name="file" className="faint" /><span className="grow small strong">{d.name}</span><Icon name="plus" size={16} /></button>
      ))}</div>
    </Modal>
  )
}
