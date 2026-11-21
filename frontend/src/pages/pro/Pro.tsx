import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { api } from '../../api'
import type { AdvocateRequest, BundleAnalysis, Filing, Integration, IntegrationStatus, LegalPosition } from '../../api/types'
import { useAuth } from '../../auth'
import { Icon } from '../../components/Icon'
import { Badge, Empty, Field, Loading, Modal, PageHead, Seg, useAction, useAsync } from '../../components/ui'
import { ago, dateFull } from '../../lib/format'

const STRENGTH = { strong: ['Kuchli', 'success'], medium: ['O‘rtacha', 'warning'], weak: ['Zaif', 'danger'] } as const

// ---- AI Pro --------------------------------------------------------------------
export function AiProPage() {
  const [tool, setTool] = useState<'bundle' | 'position'>('bundle')
  return (
    <div className="stack-lg">
      <PageHead eyebrow="Yurist uchun AI Pro" title="Ish tahlili" sub="Mijoz materiallarini birga tahlil qiling va huquqiy pozitsiya tuzing. Har bir xulosa qonun moddasi bilan; natija AI tavsiyasi, yakuniy qarorni siz qabul qilasiz." />
      <div className="row between wrap" style={{ gap: 12 }}>
        <Seg value={tool} onChange={setTool} options={[['bundle', 'Materiallar tahlili'], ['position', 'Huquqiy pozitsiya']]} />
        <div className="row wrap" style={{ gap: 8 }}>
          <Link to="/create?template=claim_letter" className="btn btn-sm btn-ghost"><Icon name="filePlus" size={15} />Protsessual hujjat</Link>
          <Link to="/pro/requests" className="btn btn-sm btn-ghost"><Icon name="send" size={15} />Advokat so‘rovi</Link>
        </div>
      </div>
      {tool === 'bundle' ? <BundleTool /> : <PositionTool />}
    </div>
  )
}

function BundleTool() {
  const docs = useAsync(() => api.documents.list(), [])
  const [sel, setSel] = useState<string[]>([])
  const [q, setQ] = useState('Voqealar xronologiyasi, summalar va hujjatlar orasidagi ziddiyatlar')
  const [res, setRes] = useState<BundleAnalysis | null>(null)
  const { busy, run } = useAction()
  const name = (id: string) => docs.data?.find((d) => d.id === id)?.name ?? 'hujjat'
  return (
    <div className="split">
      <div className="stack-lg">
        {!res && !busy && <div className="card"><Empty icon="fileSearch" title="Hujjatlarni tanlang" text="1–20 ta hujjat: shartnoma, buyruq, yozishma, dalolatnoma. AI ularni birga o‘qib, xronologiya, tomonlar, summalar va ziddiyatlarni chiqaradi." /></div>}
        {busy && <div className="card pad-lg" style={{ textAlign: 'center' }}><span className="spinner" style={{ width: 28, height: 28, color: 'var(--lapis)' }} /><h3 className="h3" style={{ marginTop: 12 }}>Materiallar tahlil qilinmoqda…</h3><p className="small muted">Har bir hujjat alohida o‘qiladi, keyin natijalar birlashtiriladi.</p></div>}
        {res && !busy && (
          <>
            <section className="card pad-lg">
              <div className="card-head"><h2 className="h3">Xronologiya</h2><Badge tone="lapis" icon="sparkles">AI tavsiyasi</Badge></div>
              <div className="timeline">{res.timeline.map((t, i) => <div key={i} className="t"><div className="strong">{dateFull(t.date)}</div><div className="small">{t.event}</div>{t.source && <div className="xs faint">{name(t.source.documentId)}{t.source.page ? `, ${t.source.page}-bet` : ''}</div>}</div>)}</div>
            </section>
            <div className="grid g2">
              <section className="card"><h3 className="h3">Tomonlar</h3>{res.parties.map((p) => <div key={p.name} className="row between small" style={{ marginTop: 10 }}><span>{p.name}</span><Badge>{p.role}</Badge></div>)}</section>
              <section className="card"><h3 className="h3">Summalar</h3>{res.amounts.map((a) => <div key={a.label} className="row between small" style={{ marginTop: 10, gap: 10 }}><span className="muted">{a.label}</span><b>{a.value}</b></div>)}</section>
            </div>
            {res.contradictions.length > 0 && <section className="card"><h3 className="h3" style={{ marginBottom: 8 }}>Ziddiyatlar</h3>{res.contradictions.map((c, i) => <div key={i} className="banner warn small" style={{ marginTop: 8 }}><Icon name="alert" size={17} /><div>{c.text}<div className="xs" style={{ marginTop: 2 }}>{c.sources.map((s) => name(s.documentId)).join(' ↔ ')}</div></div></div>)}</section>}
            <section className="card"><h3 className="h3">Yetishmayotgan dalillar</h3><ul className="small" style={{ margin: '8px 0 0', paddingLeft: 18 }}>{res.missingEvidence.map((m) => <li key={m}>{m}</li>)}</ul></section>
            {res.citations.length > 0 && <section className="card"><h3 className="h3" style={{ marginBottom: 8 }}>Qonun moddalari</h3>{res.citations.map((c) => <Link key={c.sectionId} to={`/laws/${c.legalDocumentId}?section=${c.sectionId}`} className="citation" style={{ marginTop: 8 }}><b>{c.documentTitle}, {c.articleNumber}-modda</b><p className="xs muted clamp2" style={{ marginTop: 4 }}>{c.quote}</p></Link>)}</section>}
            {res.limitations.map((l) => <div key={l} className="banner warn xs"><Icon name="info" size={15} /><div>{l}</div></div>)}
            <p className="xs faint">{res.disclaimer}</p>
          </>
        )}
      </div>
      <aside className="card stack sticky">
        <h3 className="h3">Materiallar</h3>
        {docs.loading ? <div className="skel" style={{ height: 80 }} /> : docs.data?.length ? docs.data.map((d) => (
          <label key={d.id} className="check"><input type="checkbox" checked={sel.includes(d.id)} onChange={(e) => setSel(e.target.checked ? [...sel, d.id] : sel.filter((x) => x !== d.id))} /><span className="small">{d.name}</span></label>
        )) : <p className="small muted">Avval <Link to="/documents" className="btn-text btn">hujjatlarni yuklang</Link>. Mijoz ulashgan hujjatlar buyurtma sahifasida.</p>}
        <Field label="Nimaga e’tibor qaratilsin"><textarea className="textarea" rows={3} value={q} onChange={(e) => setQ(e.target.value)} /></Field>
        <button className="btn btn-lapis" disabled={busy || !sel.length} onClick={async () => { setRes(null); const r = await run(() => api.pro.bundleAnalysis({ documentIds: sel, question: q })); if (r) setRes(r) }}><Icon name="sparkles" size={16} />Tahlil qilish ({sel.length})</button>
      </aside>
    </div>
  )
}

function PositionTool() {
  const orders = useAsync(() => api.orders.list({ group: 'active' }), [])
  const [orderId, setOrderId] = useState('')
  const [text, setText] = useState('')
  const [role, setRole] = useState('Xodim (da’vogar)')
  const [res, setRes] = useState<LegalPosition | null>(null)
  const { busy, run } = useAction()
  return (
    <div className="split">
      <div className="stack-lg">
        {!res && !busy && <div className="card"><Empty icon="scale" title="Huquqiy pozitsiya" text="Ish mazmunini yozing yoki buyurtmani tanlang. AI argumentlar, ularning qonuniy asosi, kerakli dalillar va kutiladigan e’tirozlarni chiqaradi." /></div>}
        {busy && <div className="card pad-lg" style={{ textAlign: 'center' }}><span className="spinner" style={{ width: 28, height: 28, color: 'var(--lapis)' }} /><h3 className="h3" style={{ marginTop: 12 }}>Pozitsiya tuzilmoqda…</h3></div>}
        {res && !busy && (
          <>
            <section className="card pad-lg"><div className="row wrap" style={{ gap: 6, marginBottom: 10 }}><Badge tone="lapis" icon="sparkles">AI tavsiyasi</Badge><Badge tone={res.confidence === 'high' ? 'success' : res.confidence === 'medium' ? 'warning' : 'danger'}>{{ high: 'Yuqori', medium: 'O‘rtacha', low: 'Past' }[res.confidence]} ishonch</Badge></div><p>{res.summary}</p></section>
            {res.arguments.map((a, i) => (
              <section key={i} className="card" style={{ borderLeft: `4px solid var(--${STRENGTH[a.strength][1]})` }}>
                <div className="row between wrap" style={{ gap: 8 }}><b>{i + 1}. {a.claim}</b><Badge tone={STRENGTH[a.strength][1]}>{STRENGTH[a.strength][0]}</Badge></div>
                <div className="row wrap" style={{ gap: 6, marginTop: 8 }}>{a.basis.map((c) => <Link key={c.sectionId} to={`/laws/${c.legalDocumentId}?section=${c.sectionId}`} className="badge lapis">{c.documentTitle.replace('O‘zbekiston Respublikasi ', '')}, {c.articleNumber}-modda</Link>)}</div>
                <div className="grid g2" style={{ marginTop: 12 }}>
                  <div className="sunken small"><b className="xs">Kerakli dalillar</b><ul style={{ margin: '4px 0 0', paddingLeft: 16 }}>{a.evidenceNeeded.map((e) => <li key={e}>{e}</li>)}</ul></div>
                  <div className="sunken small"><b className="xs">Kutiladigan e’tiroz</b><p style={{ marginTop: 4 }}>{a.counter}</p></div>
                </div>
              </section>
            ))}
            <div className="grid g2">
              <section className="card"><h3 className="h3">Xavflar</h3><ul className="small" style={{ margin: '8px 0 0', paddingLeft: 18 }}>{res.risks.map((r) => <li key={r}>{r}</li>)}</ul></section>
              <section className="card"><h3 className="h3">Keyingi qadamlar</h3><ol className="small" style={{ margin: '8px 0 0', paddingLeft: 18 }}>{res.nextSteps.map((r) => <li key={r}>{r}</li>)}</ol></section>
            </div>
            <p className="xs faint">{res.disclaimer}</p>
          </>
        )}
      </div>
      <aside className="card stack sticky">
        <Field label="Buyurtma (ixtiyoriy)"><select className="select" value={orderId} onChange={(e) => setOrderId(e.target.value)}><option value="">Tanlanmagan</option>{orders.data?.items.map((o) => <option key={o.id} value={o.id}>{o.number} · {o.title}</option>)}</select></Field>
        <Field label="Ish mazmuni"><textarea className="textarea" rows={6} value={text} onChange={(e) => setText(e.target.value)} placeholder="Faktlar, sanalar, mijoz talabi…" /></Field>
        <Field label="Mijoz roli"><input className="input" value={role} onChange={(e) => setRole(e.target.value)} /></Field>
        <button className="btn btn-lapis" disabled={busy || (!text.trim() && !orderId)} onClick={async () => { setRes(null); const r = await run(() => api.pro.position({ orderId: orderId || undefined, text, clientRole: role })); if (r) setRes(r) }}><Icon name="scale" size={16} />Pozitsiya tuzish</button>
      </aside>
    </div>
  )
}

// ---- Gov services ----------------------------------------------------------------
const ISTATUS: Record<IntegrationStatus, [string, string]> = { assisted: ['Yordamchi rejim', 'lapis'], planned: ['Rejada', ''], negotiating: ['Kelishuv jarayonida', 'gold'], live: ['Ulangan', 'success'] }
const CAT: Record<Integration['category'], string> = { court: 'Sud', gov_services: 'Davlat xizmatlari', justice: 'Adliya', appeals: 'Murojaatlar', enforcement: 'Majburiy ijro', identity: 'Identifikatsiya', signature: 'Elektron imzo', legal_data: 'Huquqiy ma’lumot', property: 'Ko‘chmas mulk' }

/** Template → official portal journeys: we draft the document, the user files it. */
export const RECIPES: { template: string; portal: string | null; title: string; text: string; icon: string; tone: string }[] = [
  { template: 'lawsuit', portal: 'my_sud', title: 'Sudga da’vo arizasi', text: 'Pul undirish, shartnoma nizolari. Savollarga javob bering, ariza tayyor bo‘ladi, my.sud.uz’da topshirasiz.', icon: 'scale', tone: 'lapis' },
  { template: 'appeal_letter', portal: 'murojaat', title: 'Davlat organiga murojaat', text: 'Hokimiyat, inspeksiya, vazirlikka ariza yoki shikoyat. murojaat.gov.uz orqali yuborasiz.', icon: 'building', tone: 'teal' },
  { template: 'power_of_attorney', portal: 'e_notarius', title: 'Ishonchnoma', text: 'Boshqa shaxsga vakolat berish. Matnni tayyorlaymiz, e-notarius.uz’da tasdiqlatasiz.', icon: 'stamp', tone: 'gold' },
  { template: 'claim_letter', portal: null, title: 'Talabnoma', text: 'Ish beruvchi, sotuvchi yoki qarzdorga yozma talab. Sudgacha bo‘lgan birinchi qadam.', icon: 'send', tone: 'ink' },
]
export const PORTAL_BY_TEMPLATE: Record<string, string> = { ...Object.fromEntries(RECIPES.filter((r) => r.portal).map((r) => [r.template, r.portal!])), car_sale: 'e_notarius', alimony_agreement: 'e_notarius' }

export function GovPage() {
  const { isLawyer } = useAuth()
  const nav = useNavigate()
  const [sp, setSp] = useSearchParams()
  const list = useAsync(() => api.integrations.list(), [])
  const filings = useAsync(() => api.integrations.filings(), [])
  const [prep, setPrep] = useState<Integration | null>(null)
  const [open, setOpen] = useState<Filing | null>(null)
  useEffect(() => {
    const id = sp.get('filing')
    const f = id && filings.data?.find((x) => x.id === id)
    if (f) { setOpen(f); setSp({}, { replace: true }) }
  }, [sp, filings.data, setSp])
  return (
    <div className="stack-lg">
      <PageHead eyebrow={isLawyer ? 'Integratsiyalar' : 'Hujjatni biz tayyorlaymiz'} title="Davlat xizmatlari" sub={isLawyer ? 'Rasmiy portallar uchun hujjat paketini tayyorlaymiz, topshirishni siz portalda bajarasiz. Avtomatik ulanishlar davlat organlari bilan kelishuvdan keyin yoqiladi.' : 'Nima qilmoqchi ekaningizni tanlang: hujjatni shablon bo‘yicha biz tayyorlaymiz, siz faqat savollarga javob berasiz. Keyin tayyor paket bilan rasmiy portalda o‘zingiz topshirasiz.'} />
      <section>
        <h2 className="h3" style={{ marginBottom: 12 }}>Tayyor yo‘llar</h2>
        <div className="grid g4">
          {RECIPES.map((r) => (
            <button key={r.template} className="card tile" style={{ textAlign: 'left' }} onClick={() => nav(`/create?template=${r.template}`, { state: { portal: r.portal } })}>
              <div className="tile-ico" style={{ background: r.tone === 'ink' ? 'linear-gradient(135deg,#2a2e38,#14161b)' : `var(--grad-${r.tone})` }}><Icon name={r.icon} size={22} /></div>
              <div><div className="h3">{r.title}</div><p className="small muted" style={{ marginTop: 4 }}>{r.text}</p></div>
              <span className="btn btn-sm btn-primary" style={{ alignSelf: 'flex-start' }}>Hujjatni tayyorlash</span>
            </button>
          ))}
        </div>
      </section>
      {!isLawyer && (
        <div className="banner gold small"><Icon name="shield" size={17} /><div><b>Davlat hisobidan bepul yuridik yordam.</b> Kam ta’minlanganlar va qonunda belgilangan boshqa toifalar advokat yordamini davlat hisobidan olishi mumkin («Davlat hisobidan yuridik yordam ko‘rsatish to‘g‘risida»gi qonun, O‘RQ-848). <a href="https://lex.uz/docs/-6502543" target="_blank" rel="noreferrer" className="btn-text btn">Qonun matni</a></div></div>
      )}
      <h2 className="h3">Rasmiy portallar</h2>
      <div className="banner info small"><Icon name="info" size={17} /><div><b>Holatlar:</b> «Yordamchi rejim»: paket va ko‘rsatma tayyor, topshirish sizda. «Rejada» va «Kelishuv jarayonida»: hali ulanmagan. Platforma ulanmagan tizimga sizning nomingizdan hech narsa yubormaydi.</div></div>
      {list.loading ? <Loading /> : (
        <div className="grid g3">
          {list.data?.map((it) => (
            <div key={it.code} className="card" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="row between"><Badge>{CAT[it.category]}</Badge><Badge tone={ISTATUS[it.status][1]}>{ISTATUS[it.status][0]}</Badge></div>
              <h3 className="h3" style={{ marginTop: 10 }}>{it.name}</h3>
              <p className="small muted" style={{ marginTop: 4 }}>{it.description}</p>
              <p className="xs" style={{ marginTop: 8, color: 'var(--ink-body)' }}>{it.mode}</p>
              <ul className="xs muted" style={{ margin: '8px 0 0', paddingLeft: 16, flex: 1 }}>{it.platformProvides.map((p) => <li key={p}>{p}</li>)}</ul>
              <div className="row" style={{ gap: 6, marginTop: 14 }}>
                {it.status === 'assisted' && ['my_sud', 'my_gov', 'e_notarius', 'murojaat'].includes(it.code) && <button className="btn btn-sm btn-primary" onClick={() => setPrep(it)}>Paket tayyorlash</button>}
                <a href={it.officialUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost"><Icon name="external" size={14} />Rasmiy sayt</a>
              </div>
            </div>
          ))}
        </div>
      )}
      <section className="card">
        <div className="card-head"><h2 className="h3">Topshirish paketlari</h2></div>
        {filings.data?.length ? filings.data.map((f) => (
          <button key={f.id} className="list-item" style={{ width: '100%', border: 0, background: 'none', textAlign: 'left', cursor: 'pointer' }} onClick={() => setOpen(f)}>
            <Icon name="send" size={18} className="faint" />
            <div className="grow"><div className="small strong">{f.title}</div><div className="xs faint">{ago(f.createdAt)}{f.externalRef ? ` · № ${f.externalRef}` : ''}</div></div>
            <Badge tone={f.status === 'prepared' ? 'warning' : f.status === 'submitted' ? 'lapis' : f.status === 'accepted' ? 'success' : 'danger'}>{{ prepared: 'Tayyorlandi', submitted: 'Topshirildi', accepted: 'Qabul qilindi', rejected: 'Rad etildi' }[f.status]}</Badge>
          </button>
        )) : <p className="small muted">Hali paket yo‘q.</p>}
      </section>
      {prep && <PrepModal it={prep} onClose={() => setPrep(null)} onDone={(f) => { setPrep(null); filings.reload(true); setOpen(f) }} />}
      {open && <FilingModal f={open} onClose={() => setOpen(null)} onChange={(f) => { setOpen(f); filings.reload(true) }} />}
    </div>
  )
}

function PrepModal({ it, onClose, onDone }: { it: Integration; onClose: () => void; onDone: (f: Filing) => void }) {
  const docs = useAsync(() => api.documents.list(), [])
  const [docId, setDocId] = useState('')
  const { busy, run } = useAction()
  return (
    <Modal open onClose={onClose} title={`Paket: ${it.name}`} sub="Hujjatni tanlang. Platforma checklist, portal qadamlari va boj ma’lumotini tayyorlaydi."
      footer={<><button className="btn btn-ghost" onClick={onClose}>Bekor qilish</button><button className="btn btn-primary" disabled={busy || !docId} onClick={async () => { const f = await run(() => api.integrations.createFiling({ portal: it.code, documentId: docId })); if (f) onDone(f) }}>Tayyorlash</button></>}>
      <Field label="Hujjat"><select className="select" value={docId} onChange={(e) => setDocId(e.target.value)}><option value="">Tanlang</option>{docs.data?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}</select></Field>
      <p className="xs muted" style={{ marginTop: 10 }}>Hujjat yo‘qmi? <Link to="/create" className="btn-text btn xs">Hujjat tuzish</Link> yoki AI Pro’da protsessual hujjat tayyorlang.</p>
    </Modal>
  )
}

function FilingModal({ f, onClose, onChange }: { f: Filing; onClose: () => void; onChange: (f: Filing) => void }) {
  const [ref, setRef] = useState(f.externalRef ?? '')
  const { busy, run } = useAction()
  const toggle = async (i: number) => { const checklist = f.package.checklist.map((c, k) => (k === i ? { ...c, done: !c.done } : c)); const r = await run(() => api.integrations.updateFiling(f.id, { checklist })); if (r) onChange(r) }
  return (
    <Modal open wide onClose={onClose} title={f.title} sub="Yordamchi rejim: platforma tashqi portalga hech narsa yubormaydi.">
      <div className="grid g2" style={{ alignItems: 'start' }}>
        <div className="stack">
          <b className="small">Tayyorlang</b>
          {f.package.checklist.map((c, i) => <label key={i} className="check"><input type="checkbox" checked={c.done} onChange={() => toggle(i)} /><span className="small">{c.label}</span></label>)}
          <div className="banner warn xs"><Icon name="info" size={15} /><div>{f.package.stateFee.note}</div></div>
        </div>
        <div className="stack">
          <b className="small">Portalda qadamlar</b>
          <ol className="small" style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>{f.package.steps.map((s) => <li key={s}>{s}</li>)}</ol>
          <Field label="Portal bergan ariza raqami"><input className="input" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Topshirgandan keyin kiriting" /></Field>
          <button className="btn btn-primary" disabled={busy || !ref.trim() || f.status !== 'prepared'} onClick={async () => { const r = await run(() => api.integrations.updateFiling(f.id, { status: 'submitted', externalRef: ref, submittedAt: new Date().toISOString() }), 'Topshirilgan deb belgilandi'); if (r) onChange(r) }}>{f.status === 'prepared' ? 'Topshirdim' : 'Topshirilgan'}</button>
        </div>
      </div>
    </Modal>
  )
}

// ---- Advocate requests --------------------------------------------------------
const RSTATUS: Record<AdvocateRequest['status'], [string, string]> = { draft: ['Qoralama', ''], sent: ['Yuborilgan', 'lapis'], answered: ['Javob olindi', 'success'], overdue: ['Muddati o‘tdi', 'danger'] }

export function RequestsPage() {
  const r = useAsync(() => api.pro.requests(), [])
  const orders = useAsync(() => api.orders.list({ group: 'active' }), [])
  const [newOpen, setNewOpen] = useState(false)
  const [edit, setEdit] = useState<AdvocateRequest | null>(null)
  const [f, setF] = useState({ name: '', address: '', subject: '', questions: '', orderId: '' })
  const { busy, run } = useAction()
  return (
    <div className="stack-lg">
      <PageHead eyebrow="Ish jarayoni" title="Advokat so‘rovlari" sub="Tashkilotlardan ma’lumot va hujjat so‘rash: AI xat loyihasini tayyorlaydi, siz tekshirib yuborasiz va javob muddatini kuzatasiz."
        actions={<button className="btn btn-primary" onClick={() => setNewOpen(true)}><Icon name="plus" size={17} />Yangi so‘rov</button>} />
      {r.loading ? <Loading /> : r.data?.length ? (
        <div className="card list">{r.data.map((x) => (
          <button key={x.id} className="list-item" style={{ width: '100%', border: 0, background: 'none', textAlign: 'left', cursor: 'pointer' }} onClick={() => setEdit(x)}>
            <Icon name="send" size={18} className="faint" />
            <div className="grow"><div className="strong">{x.subject}</div><div className="small muted">{x.recipient.name}{x.sentAt ? ` · yuborilgan ${dateFull(x.sentAt)}` : ''}{x.dueAt ? ` · javob ${dateFull(x.dueAt)} gacha` : ''}</div></div>
            <Badge tone={RSTATUS[x.status][1]}>{RSTATUS[x.status][0]}</Badge>
          </button>
        ))}</div>
      ) : <div className="card"><Empty icon="send" title="So‘rovlar yo‘q" text="Masalan: ish beruvchidan ish haqi hisob-kitobini, bankdan ko‘chirmani, idoradan ma’lumotnomani so‘rash." action={<button className="btn btn-primary" onClick={() => setNewOpen(true)}>Birinchi so‘rov</button>} /></div>}

      <Modal open={newOpen} onClose={() => setNewOpen(false)} title="Yangi advokat so‘rovi" footer={<><button className="btn btn-ghost" onClick={() => setNewOpen(false)}>Bekor qilish</button><button className="btn btn-primary" disabled={busy || !f.name.trim() || !f.subject.trim()} onClick={async () => {
        const x = await run(() => api.pro.createRequest({ recipient: { name: f.name, address: f.address || null }, subject: f.subject, questions: f.questions.split('\n'), orderId: f.orderId || null }))
        if (!x) return
        const d = await run(() => api.pro.requestDraft(x.id))
        setNewOpen(false); setF({ name: '', address: '', subject: '', questions: '', orderId: '' }); r.reload(true); if (d) setEdit(d)
      }}>{busy ? <span className="spinner" /> : <><Icon name="sparkles" size={15} />AI bilan loyiha</>}</button></>}>
        <div className="stack">
          <Field label="Kimga (tashkilot)"><input className="input" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} placeholder="«Alfa» MChJ" /></Field>
          <Field label="Manzil (ixtiyoriy)"><input className="input" value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
          <Field label="Mavzu"><input className="input" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} placeholder="Ish haqi to‘lovlari haqida ma’lumot" /></Field>
          <Field label="Nima so‘raladi (har biri yangi qatorda)"><textarea className="textarea" rows={4} value={f.questions} onChange={(e) => setF({ ...f, questions: e.target.value })} /></Field>
          <Field label="Buyurtma (ixtiyoriy)"><select className="select" value={f.orderId} onChange={(e) => setF({ ...f, orderId: e.target.value })}><option value="">—</option>{orders.data?.items.map((o) => <option key={o.id} value={o.id}>{o.number} · {o.title}</option>)}</select></Field>
        </div>
      </Modal>

      {edit && <RequestModal x={edit} onClose={() => setEdit(null)} onChange={(x) => { setEdit(x); r.reload(true) }} onDelete={() => { setEdit(null); r.reload(true) }} />}
    </div>
  )
}

function RequestModal({ x, onClose, onChange, onDelete }: { x: AdvocateRequest; onClose: () => void; onChange: (x: AdvocateRequest) => void; onDelete: () => void }) {
  const [text, setText] = useState(x.text)
  const [due, setDue] = useState(x.dueAt ?? '')
  const { busy, run } = useAction()
  const save = async (b: Parameters<typeof api.pro.updateRequest>[1], ok?: string) => { const r = await run(() => api.pro.updateRequest(x.id, b), ok); if (r) onChange(r) }
  return (
    <Modal open wide onClose={onClose} title={x.subject} sub={`${x.recipient.name} · ${RSTATUS[x.status][0]}`}
      footer={<>
        {x.status === 'draft' && <button className="btn btn-danger" onClick={async () => { await run(() => api.pro.deleteRequest(x.id)); onDelete() }}>O‘chirish</button>}
        <button className="btn btn-ghost" onClick={() => { navigator.clipboard.writeText(text) }}><Icon name="copy" size={15} />Nusxa</button>
        <button className="btn btn-ghost" disabled={busy} onClick={() => save({ text }, 'Saqlandi')}>Saqlash</button>
        {x.status === 'draft' && <button className="btn btn-primary" disabled={busy || !due} onClick={() => save({ text, status: 'sent', dueAt: due }, 'Yuborilgan deb belgilandi')}>Yubordim</button>}
        {(x.status === 'sent' || x.status === 'overdue') && <button className="btn btn-primary" disabled={busy} onClick={() => save({ status: 'answered' }, 'Javob qayd etildi')}>Javob keldi</button>}
      </>}>
      <div className="stack">
        <div className="banner gold xs"><Icon name="shield" size={15} /><div>AI loyihasi. Qonuniy asos va javob muddatini tekshiring: tasdiqlanmagan joylar «[TO‘LDIRING]» bilan belgilangan.</div></div>
        <textarea className="textarea" rows={14} value={text} onChange={(e) => setText(e.target.value)} style={{ fontFamily: 'Georgia, serif' }} />
        {x.status === 'draft' && <Field label="Javob muddati (o‘zingiz belgilang)"><input className="input" type="date" value={due} onChange={(e) => setDue(e.target.value)} /></Field>}
      </div>
    </Modal>
  )
}
