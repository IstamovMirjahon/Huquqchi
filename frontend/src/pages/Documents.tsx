import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { api, ApiError } from '../api'
import type { Analysis, DocumentOrigin } from '../api/types'
import { useAuth } from '../auth'
import { Icon } from '../components/Icon'
import { Badge, Empty, ErrorBox, FilePick, Loading, Modal, PageHead, useAction, useAsync, useToast } from '../components/ui'
import { ago, dateTime, DOC_STATUS, fileSize, SEVERITY } from '../lib/format'

export function DocumentsList() {
  const [sp, setSp] = useSearchParams()
  const [origin, setOrigin] = useState<DocumentOrigin | ''>('')
  const [search, setSearch] = useState('')
  const r = useAsync(() => api.documents.list({ origin: origin || undefined, search }), [origin, search])
  const { busy, run } = useAction()
  const nav = useNavigate()
  const toast = useToast()
  const upload = async (f: File) => {
    try {
      const d = await api.documents.upload(f, 'Uploaded')
      toast('Hujjat saqlandi', 'success'); nav(`/documents/${d.id}`)
    } catch (e) {
      if (e instanceof ApiError && e.code === 'documents.duplicate') toast('Bu fayl allaqachon saqlangan.', 'error')
      else await run(() => Promise.reject(e))
    }
  }
  useEffect(() => { if (sp.get('upload')) { setSp({}, { replace: true }); document.getElementById('doc-upload')?.click() } }, [sp, setSp])
  return (
    <>
      <PageHead eyebrow="Shaxsiy ombor" title="Hujjatlarim" sub="Fayllaringiz serverda yopiq saqlanadi. Istalgan vaqt AI bilan tekshirasiz yoki yuristga ulashasiz."
        actions={<FilePick className="btn btn-primary" accept=".pdf,.docx,.jpg,.jpeg,.png" onFile={upload} disabled={busy}><span id="doc-upload" /><Icon name="upload" size={17} />Hujjat yuklash</FilePick>} />
      <div className="row between wrap" style={{ marginBottom: 14, gap: 10 }}>
        <div className="seg">{([['', 'Barchasi'], ['Uploaded', 'Yuklanganlar'], ['Chat', 'Chatdan'], ['Generated', 'Yaratilganlar']] as const).map(([k, l]) => <button key={k} className={origin === k ? 'on' : ''} onClick={() => setOrigin(k)}>{l}</button>)}</div>
        <div className="input-icon" style={{ width: 280 }}><Icon name="search" size={17} /><input className="input" placeholder="Nom yoki teg bo‘yicha" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
      </div>
      {r.loading && !r.data ? <Loading /> : r.data?.length ? (
        <div className="grid g3">{r.data.map((d) => (
          <Link key={d.id} to={`/documents/${d.id}`} className="card">
            <div className="row between"><div className="stat-icon" style={{ background: 'var(--lapis-soft)', color: 'var(--lapis)' }}><Icon name="file" size={18} /></div><Badge tone={DOC_STATUS[d.status][1]}>{DOC_STATUS[d.status][0]}</Badge></div>
            <div className="strong clamp2" style={{ marginTop: 12 }}>{d.name}</div>
            <div className="xs faint" style={{ marginTop: 4 }}>{fileSize(d.sizeBytes)} · {ago(d.createdAt)}</div>
            {d.tags.length > 0 && <div className="row wrap" style={{ gap: 4, marginTop: 8 }}>{d.tags.map((t) => <Badge key={t}>#{t}</Badge>)}</div>}
          </Link>
        ))}</div>
      ) : <div className="card"><Empty icon="folder" title="Hujjatlar yo‘q" text="PDF, DOCX yoki rasm yuklang (25 MB gacha). Yuklash tahlilni avtomatik boshlamaydi." /></div>}
    </>
  )
}

export function DocumentDetail() {
  const { id } = useParams()
  const nav = useNavigate()
  const { refresh } = useAuth()
  const d = useAsync(() => api.documents.get(id!), [id])
  const list = useAsync(() => api.documents.analyses(id!), [id])
  const [current, setCurrent] = useState<Analysis | null>(null)
  const [ask, setAsk] = useState(false)
  const [purpose, setPurpose] = useState('Xavfli va noaniq bandlarni tekshirish')
  const [roles, setRoles] = useState<string[] | null>(null)
  const [edit, setEdit] = useState(false)
  const [name, setName] = useState('')
  const [tags, setTags] = useState('')
  const { busy, run } = useAction()

  useEffect(() => { if (list.data && !current) setCurrent(list.data[0] ?? null) }, [list.data, current])
  useEffect(() => {
    if (!current || !['Queued', 'Processing'].includes(current.status)) return
    const t = setInterval(async () => {
      const a = await api.documents.analysis(id!, current.id)
      setCurrent(a)
      if (!['Queued', 'Processing'].includes(a.status)) { clearInterval(t); list.reload(true); d.reload(true) }
    }, 1500)
    return () => clearInterval(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, current?.status])

  if (d.loading) return <Loading />
  if (d.error || !d.data) return <ErrorBox error={d.error} />
  const doc = d.data

  const start = async (role?: string) => {
    const a = await run(() => api.documents.analyze(doc.id, { purpose, userRole: role ?? null }))
    if (!a) return
    if (a.status === 'NeedsRole') { setRoles(a.candidateRoles); return }
    setRoles(null); setAsk(false); setCurrent(a); refresh()
  }

  return (
    <div className="stack-lg">
      <Link to="/documents" className="btn-text btn small"><Icon name="arrowLeft" size={16} />Hujjatlarim</Link>
      <div className="split">
        <div className="stack-lg">
          <section className="card pad-lg">
            <div className="row between top wrap" style={{ gap: 12 }}>
              <div className="row" style={{ gap: 14 }}>
                <div className="tile-ico" style={{ background: 'var(--grad-lapis)' }}><Icon name="file" size={22} /></div>
                <div><h1 className="h2">{doc.name}</h1><div className="small muted">{fileSize(doc.sizeBytes)} · {dateTime(doc.createdAt)} · <Badge tone={DOC_STATUS[doc.status][1]}>{DOC_STATUS[doc.status][0]}</Badge></div></div>
              </div>
              <div className="row wrap" style={{ gap: 8 }}>
                <button className="btn btn-lapis" onClick={() => { setAsk(true); setRoles(null) }}><Icon name="fileSearch" size={17} />AI bilan tekshirish</button>
                <button className="btn btn-ghost" onClick={() => nav(`/chat?doc=${doc.id}`)}><Icon name="chat" size={17} />Savol berish</button>
              </div>
            </div>
          </section>

          {current ? <AnalysisView a={current} /> : <div className="card"><Empty icon="fileSearch" title="Hali tahlil qilinmagan" text="«AI bilan tekshirish» tugmasini bosing. AI shartnomadagi xavfli bandlar, majburiyatlar va muddatlarni topadi." /></div>}
        </div>

        <aside className="stack sticky">
          <div className="card">
            <h3 className="h3" style={{ marginBottom: 8 }}>Tahlillar tarixi</h3>
            {list.data?.length ? list.data.map((a) => (
              <button key={a.id} className="list-item" style={{ width: '100%', border: 0, background: current?.id === a.id ? 'var(--lapis-soft)' : 'none', borderRadius: 10, padding: 10, cursor: 'pointer', textAlign: 'left' }} onClick={() => setCurrent(a)}>
                <div className="grow"><div className="small strong clamp2">{a.purpose}</div><div className="xs faint">{ago(a.createdAt)}</div></div>
                {a.status === 'Completed' && a.findingCounts.HighAttention > 0 && <Badge tone="danger">{a.findingCounts.HighAttention}</Badge>}
              </button>
            )) : <p className="small muted">Bo‘sh</p>}
          </div>
          <div className="card stack">
            <button className="btn btn-ghost btn-block" onClick={async () => { const b = await api.documents.download(doc.id); const u = URL.createObjectURL(b); const a = document.createElement('a'); a.href = u; a.download = doc.name; a.click() }}><Icon name="download" size={16} />Asl faylni yuklab olish</button>
            <button className="btn btn-ghost btn-block" onClick={() => { setName(doc.name); setTags(doc.tags.join(', ')); setEdit(true) }}><Icon name="edit" size={16} />Nom va teglar</button>
            <Link to="/lawyers?serviceType=document_review" className="btn btn-gold btn-block"><Icon name="users" size={16} />Yuristga tekshirtirish</Link>
            <button className="btn btn-danger btn-block" onClick={async () => { if (confirm('Hujjat va unga tegishli tahlillar o‘chiriladi. Davom etasizmi?')) { await run(() => api.documents.remove(doc.id), 'O‘chirildi'); nav('/documents') } }}><Icon name="trash" size={16} />O‘chirish</button>
          </div>
        </aside>
      </div>

      <Modal open={ask} onClose={() => setAsk(false)} title="AI bilan tekshirish" sub="Asl fayl qayta yuklanmaydi. Yangi tahlil eskisini o‘chirmaydi."
        footer={!roles && <><button className="btn btn-ghost" onClick={() => setAsk(false)}>Bekor qilish</button><button className="btn btn-lapis" disabled={busy || !purpose.trim()} onClick={() => start()}>{busy ? <span className="spinner" /> : 'Tekshirish'}</button></>}>
        {!roles ? (
          <div className="stack">
            <label className="field"><span>Nimani tekshiraylik?</span><textarea className="textarea" value={purpose} onChange={(e) => setPurpose(e.target.value)} /></label>
            <div className="row wrap" style={{ gap: 6 }}>{['Bekor qilish shartlari', 'To‘lov va jarimalar', 'Mening majburiyatlarim', 'Imzolashdan oldin umumiy tekshiruv'].map((x) => <button key={x} className="chip" onClick={() => setPurpose(x)}>{x}</button>)}</div>
          </div>
        ) : (
          <div className="stack">
            <p className="small">Hujjatda siz qaysi tomonsiz? AI tomonlardan birini o‘zboshimchalik bilan tanlamaydi.</p>
            {roles.map((r) => <button key={r} className="btn btn-ghost btn-block" style={{ justifyContent: 'flex-start', height: 'auto', padding: 14, whiteSpace: 'normal', textAlign: 'left' }} disabled={busy} onClick={() => start(r)}>{r}</button>)}
          </div>
        )}
      </Modal>
      <Modal open={edit} onClose={() => setEdit(false)} title="Hujjatni tahrirlash" footer={<><button className="btn btn-ghost" onClick={() => setEdit(false)}>Bekor qilish</button><button className="btn btn-primary" onClick={async () => { await run(() => api.documents.update(doc.id, { name, tags: tags.split(',').map((t) => t.trim()).filter(Boolean) }), 'Saqlandi'); setEdit(false); d.reload(true) }}>Saqlash</button></>}>
        <div className="stack"><label className="field"><span>Nomi</span><input className="input" value={name} onChange={(e) => setName(e.target.value)} /></label><label className="field"><span>Teglar (vergul bilan)</span><input className="input" value={tags} onChange={(e) => setTags(e.target.value)} /></label></div>
      </Modal>
    </div>
  )
}

function AnalysisView({ a }: { a: Analysis }) {
  if (['Queued', 'Processing'].includes(a.status)) return (
    <div className="card pad-lg" style={{ textAlign: 'center' }}>
      <span className="spinner" style={{ width: 28, height: 28, color: 'var(--lapis)' }} />
      <h3 className="h3" style={{ marginTop: 14 }}>Tahlil qilinmoqda…</h3>
      <p className="small muted">Matn o‘qilmoqda, bandlar tekshirilmoqda. Odatda 10–40 soniya.</p>
    </div>
  )
  if (a.status === 'Failed') return <div className="banner danger">Tahlil amalga oshmadi. Qayta urinib ko‘ring.</div>
  return (
    <div className="stack-lg">
      <section className="card pad-lg">
        <div className="row wrap" style={{ gap: 8, marginBottom: 12 }}>
          <Badge tone="lapis" icon="sparkles">AI tahlili</Badge>
          {(['HighAttention', 'NeedsReview', 'Information'] as const).map((k) => a.findingCounts[k] > 0 && <Badge key={k} tone={SEVERITY[k][1]}>{a.findingCounts[k]} · {SEVERITY[k][0]}</Badge>)}
          {a.userRole && <span className="xs faint">Sizning rolingiz: {a.userRole}</span>}
        </div>
        <h3 className="h3">Qisqa mazmun</h3>
        <p style={{ marginTop: 6 }}>{a.summary}</p>
        {a.findings.length === 0 && <div className="banner success small" style={{ marginTop: 12 }}>Jiddiy muammo topilmadi. Bu hujjatning to‘liq xavfsizligiga kafolat emas.</div>}
      </section>
      {a.findings.length > 0 && (
        <section className="stack">
          <h3 className="h3">E’tiborli bandlar</h3>
          {a.findings.map((f) => (
            <div key={f.id} className="card" style={{ borderLeft: `4px solid var(--${SEVERITY[f.severity][1]})` }}>
              <div className="row between wrap" style={{ gap: 8 }}><b>{f.title}</b><div className="row" style={{ gap: 6 }}><Badge tone={SEVERITY[f.severity][1]}>{SEVERITY[f.severity][0]}</Badge>{(f.location.page || f.location.clause) && <span className="xs faint">{f.location.clause ? `${f.location.clause}-band` : ''}{f.location.page ? ` · ${f.location.page}-bet` : ''}</span>}</div></div>
              <blockquote style={{ margin: '10px 0', padding: '8px 12px', borderLeft: '3px solid var(--border)', fontFamily: 'Georgia, serif', fontSize: 14, color: 'var(--ink-body)' }}>«{f.excerpt}»</blockquote>
              <p className="small">{f.explanation}</p>
              <p className="small" style={{ marginTop: 6 }}><b>Tavsiya:</b> {f.recommendation}</p>
            </div>
          ))}
        </section>
      )}
      <div className="grid g2">
        {a.obligations.length > 0 && <section className="card"><h3 className="h3">Majburiyatlar</h3>{a.obligations.map((o) => <div key={o.party} style={{ marginTop: 10 }}><b className="small">{o.party}</b><ul className="small" style={{ margin: '4px 0 0', paddingLeft: 18 }}>{o.items.map((i) => <li key={i}>{i}</li>)}</ul></div>)}</section>}
        {a.paymentsAndDeadlines.length > 0 && <section className="card"><h3 className="h3">To‘lov va muddatlar</h3>{a.paymentsAndDeadlines.map((p) => <div key={p.label} className="row between small" style={{ marginTop: 10, gap: 12 }}><span className="muted">{p.label}</span><b style={{ textAlign: 'right' }}>{p.value}</b></div>)}</section>}
        {a.missingInfo.length > 0 && <section className="card"><h3 className="h3">Yetishmayotgan ma’lumot</h3><ul className="small" style={{ margin: '8px 0 0', paddingLeft: 18 }}>{a.missingInfo.map((i) => <li key={i}>{i}</li>)}</ul></section>}
        {a.suggestions.length > 0 && <section className="card"><h3 className="h3">Takliflar</h3><ul className="small" style={{ margin: '8px 0 0', paddingLeft: 18 }}>{a.suggestions.map((i) => <li key={i}>{i}</li>)}</ul></section>}
      </div>
      {a.limitations.length > 0 && <div className="banner warn xs"><Icon name="alert" size={16} /><div>{a.limitations.join(' ')}</div></div>}
    </div>
  )
}
