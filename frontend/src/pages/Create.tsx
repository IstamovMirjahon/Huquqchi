import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import type { NotaryRequirement, Template } from '../api/types'
import { useAuth } from '../auth'
import { Icon } from '../components/Icon'
import { Badge, Empty, ErrorBox, Field, Loading, PageHead, useAction, useAsync } from '../components/ui'
import { ago } from '../lib/format'
import { PORTAL_BY_TEMPLATE } from './pro/Pro'

export const NOTARY: Record<NotaryRequirement, [string, string, string]> = {
  required: ['Notarius shart', 'danger', 'stamp'],
  conditional: ['Ba’zan notarius kerak', 'warning', 'stamp'],
  optional: ['Notarius ixtiyoriy', 'lapis', 'check'],
  none: ['O‘zingiz tuzasiz', 'success', 'check'],
}
const GROUPS: { title: string; sub: string; match: NotaryRequirement[] }[] = [
  { title: 'O‘zingiz tuzib, darhol ishlatasiz', sub: 'Notarius kerak emas: imzolaysiz va topshirasiz yoki yuborasiz.', match: ['none', 'optional'] },
  { title: 'Notarial tasdiqlash kerak', sub: 'Loyihani biz tayyorlaymiz, siz notariusga yoki e-notarius.uz’ga tayyor holda borasiz.', match: ['required', 'conditional'] },
]
const ICONS: Record<string, [string, string]> = { Ijara: ['home', 'var(--grad-lapis)'], Biznes: ['building', 'var(--grad-teal)'], Ariza: ['scroll', 'var(--grad-gold)'], 'Oldi-sotdi': ['cart', 'linear-gradient(135deg,#2a2e38,#14161b)'], Sud: ['scale', 'var(--grad-lapis)'], Murojaat: ['send', 'var(--grad-teal)'], Notarial: ['stamp', 'var(--grad-gold)'] }

export function CreateHome() {
  const [sp] = useSearchParams()
  const nav = useNavigate()
  const t = useAsync(() => api.templates.list(), [])
  const drafts = useAsync(() => api.drafts.list(), [])
  useEffect(() => {
    const code = sp.get('template')
    const hit = code && t.data?.find((x) => x.code === code)
    if (hit) nav(`/create/${hit.id}`, { replace: true, state: history.state?.usr })
  }, [sp, t.data, nav])
  return (
    <>
      <PageHead eyebrow="Shablonlar" title="Hujjat yaratish" sub="Yuridik muharrir tekshirgan shablonlar. Bilmagan maydoningizni bo‘sh qoldiring: soxta ma’lumot to‘ldirilmaydi." />
      {t.loading ? <Loading /> : GROUPS.map((g) => (
        <section key={g.title} style={{ marginBottom: 28 }}>
          <div className="row between wrap" style={{ marginBottom: 12, gap: 8 }}>
            <div><h2 className="h3">{g.title}</h2><p className="small muted">{g.sub}</p></div>
          </div>
          <div className="grid g4">
            {t.data?.filter((x) => g.match.includes(x.notary)).map((x) => {
              const [ic, grad] = ICONS[x.category] ?? ['file', 'var(--grad-lapis)']
              const [nl, nt, ni] = NOTARY[x.notary]
              return (
                <Link key={x.id} to={`/create/${x.id}`} className="card tile">
                  <div className="row between"><div className="tile-ico" style={{ background: grad }}><Icon name={ic} size={22} /></div><Badge tone={nt} icon={ni}>{nl}</Badge></div>
                  <div><div className="h3">{x.name}</div><p className="small muted" style={{ marginTop: 4 }}>{x.description}</p></div>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
      <div className="banner info small" style={{ marginBottom: 8 }}><Icon name="info" size={17} /><div>Batafsil ro‘yxat saytdagi «Bo‘limlar → Notarius kerakmi?» qo‘llanmasida. Talablar o‘zgarishi mumkin: muhim bitimdan oldin notariusdan so‘rang.</div></div>
      <h2 className="h2" style={{ margin: '32px 0 12px' }}>Mening loyihalarim</h2>
      {drafts.data?.length ? (
        <div className="card list">{drafts.data.map((d) => (
          <Link key={d.id} to={`/drafts/${d.id}`} className="list-item">
            <Icon name="file" className="faint" />
            <div className="grow"><div className="strong">{d.name}</div><div className="xs faint">{d.templateName} · {ago(d.updatedAt)}</div></div>
            {d.status === 'confirmed' ? <Badge tone="success">Tasdiqlangan</Badge> : d.missingRequired.length ? <Badge tone="warning">{d.missingRequired.length} maydon bo‘sh</Badge> : <Badge tone="gold">Loyiha</Badge>}
          </Link>
        ))}</div>
      ) : <div className="card"><Empty icon="filePlus" title="Loyihalar yo‘q" text="Yuqoridagi shablonlardan birini tanlang." /></div>}
    </>
  )
}

export function TemplateWizard() {
  const { templateId } = useParams()
  const nav = useNavigate()
  const { refresh } = useAuth()
  const loc = useLocation()
  const fromCase = loc.state as { caseId?: string; stepId?: string; prefill?: Record<string, string> } | null
  const t = useAsync(() => api.templates.get(templateId!), [templateId])
  const [step, setStep] = useState(0)
  const [name, setName] = useState('')
  const [fields, setFields] = useState<Record<string, string>>(Object.fromEntries(Object.entries(fromCase?.prefill ?? {}).filter(([, v]) => v)))
  const { busy, run } = useAction()
  if (t.loading) return <Loading />
  if (t.error || !t.data) return <ErrorBox error={t.error} />
  const tpl: Template = t.data
  const steps = tpl.schema.steps
  const cur = steps[step]
  const last = step === steps.length - 1
  const submit = async () => {
    const d = await run(() => api.drafts.create({ templateId: tpl.id, name: name || tpl.name, fields: Object.fromEntries(steps.flatMap((s) => s.fields).map((f) => [f.key, fields[f.key]?.trim() || null])) }))
    if (!d) return
    if (fromCase?.caseId) await api.cases.link(fromCase.caseId, { kind: 'draft', refId: d.id, stepId: fromCase.stepId })
    refresh(); nav(`/drafts/${d.id}`, { replace: true })
  }
  return (
    <div style={{ maxWidth: 720 }}>
      <Link to="/create" className="btn-text btn small"><Icon name="arrowLeft" size={16} />Shablonlar</Link>
      <PageHead title={tpl.name} sub={tpl.description} />
      <div className="card pad-lg stack-lg">
        {fromCase?.caseId && <div className="banner info small"><Icon name="layout" size={17} /><div>Ishingizdagi ma’lumotlar bilan oldindan to‘ldirildi. Loyiha ishga biriktiriladi.</div></div>}
        <div className={`banner ${tpl.notary === 'required' ? 'danger' : tpl.notary === 'conditional' ? 'warn' : 'success'} small`}><Icon name={NOTARY[tpl.notary][2]} size={17} /><div><b>{NOTARY[tpl.notary][0]}.</b> {tpl.notaryNote}</div></div>
        <div className="steps">{steps.map((_, i) => <i key={i} className={i <= step ? 'on' : ''} />)}</div>
        <div className="row between"><h2 className="h3">{step + 1}. {cur.title}</h2><span className="xs faint">{step + 1} / {steps.length}</span></div>
        {step === 0 && <Field label="Loyiha nomi (o‘zingiz uchun)"><input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={tpl.name} /></Field>}
        {cur.fields.map((f) => (
          <Field key={f.key} label={`${f.label}${f.required ? ' *' : ''}`} hint={[f.hint, f.example && `Masalan: ${f.example}`].filter(Boolean).join(' · ') || undefined}>
            {f.type === 'textarea' ? <textarea className="textarea" value={fields[f.key] ?? ''} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })} />
              : f.type === 'select' ? <select className="select" value={fields[f.key] ?? ''} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}><option value="">Tanlang</option>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                : <input className="input" type={f.type === 'date' ? 'date' : 'text'} inputMode={f.type === 'money' || f.type === 'number' ? 'numeric' : undefined} value={fields[f.key] ?? ''} onChange={(e) => setFields({ ...fields, [f.key]: f.type === 'money' || f.type === 'number' ? e.target.value.replace(/\D/g, '') : e.target.value })} />}
          </Field>
        ))}
        <div className="banner info xs"><Icon name="info" size={16} /><div>Bilmagan qiymatni bo‘sh qoldiring. Hujjatda u «[TO‘LDIRING]» deb belgilanadi, keyin to‘ldirasiz.</div></div>
        <div className="row between">
          <button className="btn btn-ghost" disabled={step === 0} onClick={() => setStep(step - 1)}><Icon name="arrowLeft" size={16} />Orqaga</button>
          {last ? <button className="btn btn-primary" disabled={busy} onClick={submit}>{busy ? <span className="spinner" /> : 'Loyihani yaratish'}</button> : <button className="btn btn-primary" onClick={() => setStep(step + 1)}>Keyingi <Icon name="arrowRight" size={16} /></button>}
        </div>
      </div>
    </div>
  )
}

export function DraftView() {
  const { id } = useParams()
  const nav = useNavigate()
  const { isLawyer } = useAuth()
  const d = useAsync(() => api.drafts.get(id!), [id])
  const tpl = useAsync(() => (d.data ? api.templates.get(d.data.templateId) : Promise.resolve(null)), [d.data?.templateId])
  const [editing, setEditing] = useState(false)
  const [fields, setFields] = useState<Record<string, string>>({})
  const [checked, setChecked] = useState(false)
  const { busy, run } = useAction()
  if (d.loading) return <Loading />
  if (d.error || !d.data) return <ErrorBox error={d.error} />
  const draft = d.data
  const portal = tpl.data ? PORTAL_BY_TEMPLATE[tpl.data.code] : undefined
  const all = tpl.data?.schema.steps.flatMap((s) => s.fields) ?? []
  const parts = draft.text.split(/(\[TO‘LDIRING: [^\]]+\])/g)
  const download = async (fmt: 'docx' | 'pdf') => { const b = await run(() => api.drafts.export(draft.id, fmt)); if (!b) return; const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = `${draft.name}.${fmt === 'docx' ? 'docx' : 'pdf'}`; a.click() }

  return (
    <div className="stack-lg">
      <Link to="/create" className="btn-text btn small"><Icon name="arrowLeft" size={16} />Hujjat yaratish</Link>
      <div className="split">
        <div className="paper">{parts.map((p, i) => (p.startsWith('[TO‘LDIRING') ? <mark key={i}>{p}</mark> : p))}</div>
        <aside className="stack sticky">
          <div className="card stack">
            <div><h1 className="h3">{draft.name}</h1><p className="xs faint">{draft.templateName} · {draft.revision}-tahrir</p></div>
            {tpl.data && <div className={`banner ${tpl.data.notary === 'required' ? 'danger' : tpl.data.notary === 'conditional' ? 'warn' : 'success'} xs`}><Icon name={NOTARY[tpl.data.notary][2]} size={15} /><div><b>{NOTARY[tpl.data.notary][0]}.</b> {tpl.data.notaryNote}</div></div>}
            {draft.status === 'confirmed' ? <div className="banner success small"><Icon name="checkCircle" size={17} />Tasdiqlangan va «Hujjatlarim»ga saqlangan</div>
              : draft.missingRequired.length ? <div className="banner warn small"><Icon name="alert" size={17} /><div>{draft.missingRequired.length} ta majburiy maydon to‘ldirilmagan</div></div>
                : <div className="banner info small"><Icon name="info" size={17} />Loyiha tayyor. Tekshirib, tasdiqlang.</div>}
            <button className="btn btn-ghost btn-block" onClick={() => { setFields(Object.fromEntries(Object.entries(draft.fields).map(([k, v]) => [k, v ?? '']))); setEditing(!editing) }}><Icon name="edit" size={16} />{editing ? 'Yopish' : 'Maydonlarni tahrirlash'}</button>
            {editing && (
              <div className="stack">
                {all.map((f) => (
                  <Field key={f.key} label={`${f.label}${f.required ? ' *' : ''}`}>
                    {f.type === 'select' ? <select className="select" value={fields[f.key] ?? ''} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })}><option value="">—</option>{f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}</select>
                      : <input className="input" type={f.type === 'date' ? 'date' : 'text'} value={fields[f.key] ?? ''} onChange={(e) => setFields({ ...fields, [f.key]: e.target.value })} />}
                  </Field>
                ))}
                <button className="btn btn-primary" disabled={busy} onClick={async () => { const r = await run(() => api.drafts.update(draft.id, { fields: Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, v.trim() || null])) }), 'Yangilandi'); if (r) { d.setData(r); setEditing(false) } }}>Saqlash</button>
              </div>
            )}
            {draft.status !== 'confirmed' && (
              <>
                <label className="check"><input type="checkbox" checked={checked} onChange={(e) => setChecked(e.target.checked)} /><span className="small">Matnni o‘qib chiqdim, ma’lumotlar to‘g‘ri</span></label>
                <button className="btn btn-primary btn-block" disabled={busy || !checked || draft.missingRequired.length > 0} onClick={async () => { const r = await run(() => api.drafts.confirm(draft.id), 'Hujjatlarimga saqlandi'); if (r) d.setData(r) }}>Tasdiqlash va saqlash</button>
              </>
            )}
            <div className="grid g2" style={{ gap: 8 }}>
              <button className="btn btn-sm btn-ghost" onClick={() => download('docx')}><Icon name="download" size={15} />DOCX</button>
              <button className="btn btn-sm btn-ghost" onClick={() => download('pdf')}><Icon name="download" size={15} />PDF</button>
            </div>
            {draft.documentId && <Link to={`/documents/${draft.documentId}`} className="btn btn-sm btn-soft btn-block">Hujjatni ochish</Link>}
            {portal && (
              <button className="btn btn-lapis btn-block" disabled={busy || draft.missingRequired.length > 0} onClick={async () => { const f = await run(() => api.integrations.createFiling({ portal, draftId: draft.id })); if (f) nav(`${isLawyer ? '/pro/gov' : '/gov'}?filing=${f.id}`) }}>
                <Icon name="send" size={16} />{portal === 'e_notarius' ? 'Notarius uchun paket (e-notarius.uz)' : 'Rasmiy portal uchun paket'}
              </button>
            )}
          </div>
          <div className="card small">
            <b>Yurist tekshirsinmi?</b>
            <p className="muted" style={{ margin: '4px 0 10px' }}>Muhim shartnomani imzolashdan oldin yuristga ko‘rsating. O‘rtacha narx 100–150 ming so‘m.</p>
            <Link to="/lawyers?serviceType=document_review" className="btn btn-sm btn-gold btn-block">Yurist topish</Link>
          </div>
          <button className="btn btn-sm btn-text" style={{ color: 'var(--danger)' }} onClick={async () => { if (confirm('Loyihani o‘chirasizmi?')) { await run(() => api.drafts.remove(draft.id)); nav('/create') } }}>Loyihani o‘chirish</button>
        </aside>
      </div>
    </div>
  )
}
