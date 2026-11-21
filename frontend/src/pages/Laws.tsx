import { useEffect, useMemo, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { api } from '../api'
import type { LegalSearchHit } from '../api/types'
import { Icon } from '../components/Icon'
import { Badge, Empty, ErrorBox, Loading, PageHead, useAsync } from '../components/ui'
import { dateFull } from '../lib/format'

export function LawsHome() {
  const [q, setQ] = useState('')
  const [hits, setHits] = useState<LegalSearchHit[] | null>(null)
  const [busy, setBusy] = useState(false)
  const docs = useAsync(() => api.legal.list(), [])
  const search = async (text = q) => { if (!text.trim()) { setHits(null); return } setBusy(true); try { setHits(await api.legal.search(text)) } finally { setBusy(false) } }
  return (
    <>
      <PageHead eyebrow="Rasmiy manbalar" title="Qonunlar bazasi" sub="Rasmiy matn, tahrir sanasi va lex.uz havolasi bilan. Bazadagi hujjatlar ochiq ko‘rsatiladi." />
      <form className="ask" style={{ marginTop: 0, maxWidth: 760 }} onSubmit={(e) => { e.preventDefault(); search() }}>
        <Icon name="search" style={{ alignSelf: 'center', color: 'var(--ink-faint)' }} />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Modda, kalit so‘z yoki oddiy savol: «uy-joydan mahrum qilish mumkinmi»" />
        <button className="btn btn-primary" disabled={busy}>{busy ? <span className="spinner" /> : 'Qidirish'}</button>
      </form>
      <div className="row wrap" style={{ gap: 6, margin: '12px 0 24px' }}>{['mehnat qilish huquqi', 'uy-joy', 'yuridik yordam', 'mulk huquqi', 'oila va nikoh'].map((x) => <button key={x} className="chip" onClick={() => { setQ(x); search(x) }}>{x}</button>)}</div>

      {hits ? (
        <section className="stack">
          <div className="row between"><h2 className="h3">Natijalar ({hits.length})</h2><button className="btn-text btn small" onClick={() => { setHits(null); setQ('') }}>Tozalash</button></div>
          {hits.length ? hits.map((h) => (
            <Link key={h.sectionId} to={`/laws/${h.legalDocumentId}?section=${h.sectionId}`} className="card">
              <div className="row between"><b>{h.documentTitle}, {h.articleNumber ? `${h.articleNumber}-modda` : h.articleTitle}</b>{h.isCurrent && <Badge tone="success">Amalda</Badge>}</div>
              <p className="small muted clamp3" style={{ marginTop: 6, fontFamily: 'Georgia, serif' }}>{h.snippet}</p>
            </Link>
          )) : <div className="card"><Empty icon="search" title="Hech narsa topilmadi" text="Boshqa so‘z bilan qidiring yoki savolingizni AI huquqshunosga bering." action={<Link to={`/chat?q=${encodeURIComponent(q)}`} className="btn btn-lapis">AI'dan so‘rash</Link>} /></div>}
        </section>
      ) : (
        <section>
          <h2 className="h3" style={{ marginBottom: 12 }}>Bazadagi hujjatlar</h2>
          {docs.loading ? <Loading /> : (
            <div className="grid g3">
              {docs.data?.map((d) => (
                <Link key={d.id} to={`/laws/${d.id}`} className="card">
                  <div className="row between"><Badge tone="lapis">{d.type}</Badge>{d.status === 'in_force' ? <Badge tone="success">Amalda</Badge> : <Badge tone="danger">Kuchini yo‘qotgan</Badge>}</div>
                  <h3 className="h3" style={{ marginTop: 12 }}>{d.title}</h3>
                  <p className="xs faint" style={{ marginTop: 4 }}>{d.sectionCount} ta modda{d.issuedAt ? ` · ${dateFull(d.issuedAt)}` : ''}</p>
                </Link>
              ))}
              <div className="card flat" style={{ borderStyle: 'dashed', background: 'rgba(255,255,255,.4)' }}>
                <Icon name="clock" className="faint" /><h3 className="h3" style={{ marginTop: 10 }}>Tez orada</h3>
                <p className="small muted" style={{ marginTop: 4 }}>Fuqarolik, Mehnat, Oila, Uy-joy kodekslari va Iste’molchilar huquqlari to‘g‘risidagi qonun yuklanmoqda.</p>
              </div>
            </div>
          )}
        </section>
      )}
    </>
  )
}

export function LawDetail() {
  const { id } = useParams()
  const [sp] = useSearchParams()
  const focus = sp.get('section')
  const d = useAsync(() => api.legal.get(id!), [id])
  const [filter, setFilter] = useState('')
  const v = d.data?.versions.find((x) => x.isCurrent) ?? d.data?.versions[0]
  const sections = useMemo(() => (v?.sections ?? []).filter((s) => !filter || `${s.number} ${s.text}`.toLowerCase().includes(filter.toLowerCase())), [v, filter])
  useEffect(() => { if (focus && d.data) setTimeout(() => document.getElementById(focus)?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100) }, [focus, d.data])
  if (d.loading) return <Loading />
  if (d.error || !d.data || !v) return <ErrorBox error={d.error} />
  return (
    <div className="stack-lg">
      <Link to="/laws" className="btn-text btn small"><Icon name="arrowLeft" size={16} />Qonunlar</Link>
      <section className="card pad-lg">
        <div className="row wrap" style={{ gap: 8 }}><Badge tone="lapis">{d.data.type}</Badge><Badge tone="success">Amaldagi tahrir</Badge>{v.effectiveFrom && <span className="xs faint">{dateFull(v.effectiveFrom)} dan</span>}</div>
        <h1 className="h1" style={{ marginTop: 10 }}>{d.data.title}</h1>
        <div className="row wrap" style={{ gap: 10, marginTop: 14 }}>
          {d.data.officialUrl && <a href={d.data.officialUrl} target="_blank" rel="noreferrer" className="btn btn-sm btn-ghost"><Icon name="external" size={15} />lex.uz’da ochish</a>}
          <div className="input-icon" style={{ width: 300 }}><Icon name="search" size={16} /><input className="input" style={{ height: 34 }} placeholder="Hujjat ichida qidirish" value={filter} onChange={(e) => setFilter(e.target.value)} /></div>
        </div>
      </section>
      <div className="stack">
        {sections.map((s) => (
          <article key={s.id} id={s.id} className="card" style={focus === s.id ? { boxShadow: '0 0 0 2px var(--lapis-bright), var(--shadow-lg)' } : undefined}>
            <div className="row between wrap" style={{ gap: 8 }}>
              <h2 className="h3">{s.number ? `${s.number}-modda` : s.title}</h2>
              <div className="row" style={{ gap: 6 }}>
                <Link to={`/chat?q=${encodeURIComponent(`${d.data!.title}, ${s.number}-moddasini oddiy tilda tushuntiring`)}`} className="btn btn-sm btn-soft"><Icon name="sparkles" size={14} />Oddiy tilda</Link>
                {s.officialUrl && <a href={s.officialUrl} target="_blank" rel="noreferrer" className="icon-btn" style={{ width: 34, height: 34 }} title="Rasmiy manba"><Icon name="external" size={15} /></a>}
              </div>
            </div>
            {s.number && s.title && <p className="xs faint" style={{ marginTop: 2 }}>{s.title}</p>}
            <p className="law-text" style={{ marginTop: 10 }}>{s.text}</p>
          </article>
        ))}
        {sections.length === 0 && <div className="card"><Empty icon="search" title="Topilmadi" /></div>}
      </div>
    </div>
  )
}
