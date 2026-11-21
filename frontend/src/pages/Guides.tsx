import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Icon } from '../components/Icon'
import { PublicNav } from '../components/PublicNav'
import { GUIDES, GUIDES_UPDATED, type Guide } from '../data/guides'

const TONE: Record<Guide['tone'], string> = { lapis: 'var(--grad-lapis)', gold: 'var(--grad-gold)', teal: 'var(--grad-teal)', ink: 'linear-gradient(135deg,#2a2e38,#14161b)' }
const fmt = (iso: string) => { const [y, m, d] = iso.split('-'); return `${+d}.${m}.${y}` }
const norm = (s: string) => s.toLowerCase().replace(/[‘’ʻʼ`']/g, "'")

function Footer() {
  return (
    <footer className="lp-wrap lp-foot">
      <span>© 2026 Huquqchi AI</span>
      <span>Qo‘llanmalar ma’lumot uchun, yuridik maslahat emas. Rasmiy matnni lex.uz’da tekshiring. Yangilangan: {fmt(GUIDES_UPDATED)}</span>
    </footer>
  )
}

/** /bolimlar — free guides hub (public, no sign-in). */
export function GuidesHub() {
  const [q, setQ] = useState('')
  const list = useMemo(() => GUIDES.filter((g) => !q || norm(`${g.title} ${g.short} ${g.situations.join(' ')}`).includes(norm(q))), [q])
  useEffect(() => { document.title = 'Bo‘limlar: huquqiy qo‘llanmalar | Huquqchi AI' }, [])
  return (
    <div className="lp">
      <PublicNav />
      <section className="lp-wrap" style={{ paddingTop: 56, paddingBottom: 28 }}>
        <span className="eyebrow">Bepul · ro‘yxatdan o‘tmasdan</span>
        <h1 className="lp-h1" style={{ maxWidth: 820 }}>Idoraga borishdan <span className="grad-text">oldin o‘qing.</span></h1>
        <p className="lp-lead">Har bir soha bo‘yicha: hujjatning qaysi bandlarini o‘qish kerak, qayerda aldab ketishlari mumkin va borishdan oldin nimalarni tayyorlash kerak. Sodda tilda, bitta sahifada.</p>
        <div className="ask" style={{ maxWidth: 640 }}>
          <Icon name="search" style={{ color: 'var(--ink-faint)', alignSelf: 'center' }} />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Masalan: ijara, aliment, ish haqi, kredit…" aria-label="Bo‘limlardan qidirish" />
        </div>
        <div className="row wrap" style={{ gap: 24, marginTop: 24 }}>
          {[['file', 'lapis', 'O‘qing', 'Hujjatning muhim bandlari'], ['alert', 'gold', 'Aldanmang', 'Ko‘p uchraydigan tuzoqlar'], ['list', 'teal', 'Tayyorlaning', 'Qayerga va nima bilan borish']].map(([i, t, a, b]) => (
            <div key={a} className="row" style={{ gap: 12 }}>
              <span className="tile-ico" style={{ width: 36, height: 36, borderRadius: 11, background: TONE[t as Guide['tone']] }}><Icon name={i} size={18} /></span>
              <div><b className="small">{a}</b><div className="xs muted">{b}</div></div>
            </div>
          ))}
        </div>
      </section>
      <section className="lp-wrap" style={{ paddingBottom: 40 }}>
        <div className="row between" style={{ marginBottom: 16 }}><h2 className="h2">Bo‘limlar</h2><span className="xs faint" style={{ fontFamily: 'var(--mono)' }}>{list.length} ta soha</span></div>
        {list.length ? (
          <div className="grid g4">
            {list.map((g) => (
              <Link key={g.id} to={`/bolimlar/${g.id}`} className="card row top" style={{ gap: 14, padding: 18 }}>
                <span className="tile-ico" style={{ width: 42, height: 42, borderRadius: 13, flexShrink: 0, background: TONE[g.tone] }}><Icon name={g.icon} size={20} /></span>
                <span><b style={{ fontSize: 15 }}>{g.title}</b><span className="small muted" style={{ display: 'block', marginTop: 4 }}>{g.short}</span></span>
              </Link>
            ))}
          </div>
        ) : <div className="card" style={{ textAlign: 'center', padding: 40 }}><b>Hech narsa topilmadi</b><p className="small muted">Boshqa so‘z bilan qidirib ko‘ring.</p></div>}
      </section>
      <Footer />
    </div>
  )
}

/** /bolimlar/:id — one guide: read · traps · prepare · when you need a lawyer · legal basis. */
export function GuideDetail() {
  const { id } = useParams()
  const g = GUIDES.find((x) => x.id === id)
  const key = `hq-check-${id}`
  const [checked, setChecked] = useState<Set<string>>(() => new Set(JSON.parse(localStorage.getItem(key) || '[]')))
  useEffect(() => { setChecked(new Set(JSON.parse(localStorage.getItem(key) || '[]'))); window.scrollTo(0, 0) }, [key])
  useEffect(() => { if (g) document.title = `${g.title}: nimani o‘qish, nimada aldanmaslik | Huquqchi AI` }, [g])
  if (!g) return <div className="lp"><PublicNav /><div className="lp-wrap" style={{ padding: 60 }}><h1 className="h1">Bo‘lim topilmadi</h1><Link to="/bolimlar" className="btn btn-primary" style={{ marginTop: 16 }}>Barcha bo‘limlar</Link></div></div>
  const next = GUIDES[(GUIDES.indexOf(g) + 1) % GUIDES.length]
  const items = [...g.bring.map((b, i) => [`b${i}`, b]), ...(g.before ?? []).map((b, i) => [`p${i}`, b])]
  const toggle = (k: string) => { const n = new Set(checked); if (n.has(k)) n.delete(k); else n.add(k); setChecked(n); localStorage.setItem(key, JSON.stringify([...n])) }
  const go = (sec: string) => document.getElementById(sec)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const Head = ({ icon, tone, step, title }: { icon: string; tone: Guide['tone']; step: string; title: string }) => (
    <div className="row" style={{ gap: 14, marginBottom: 12 }}>
      <span className="tile-ico" style={{ width: 42, height: 42, borderRadius: 13, background: TONE[tone] }}><Icon name={icon} size={20} /></span>
      <div><div className="xs faint" style={{ fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.12em' }}>{step}</div><h2 className="h2">{title}</h2></div>
    </div>
  )

  return (
    <div className="lp">
      <PublicNav />
      <div className="lp-wrap" style={{ paddingTop: 28, paddingBottom: 40 }}>
        <nav className="row small" style={{ gap: 8, marginBottom: 14 }}><Link to="/bolimlar" className="btn-text btn">Bo‘limlar</Link><span className="faint">/</span><span className="faint">{g.title}</span></nav>
        <header className="card pad-lg row top wrap" style={{ gap: 20 }}>
          <span className="tile-ico" style={{ width: 60, height: 60, borderRadius: 18, background: TONE[g.tone] }}><Icon name={g.icon} size={28} /></span>
          <div className="grow">
            <h1 className="h1">{g.title}</h1>
            <p className="muted" style={{ marginTop: 6, fontSize: 16 }}>{g.short}</p>
            <div className="row wrap" style={{ gap: 8, marginTop: 14 }}>{g.situations.map((s) => <span key={s} className="chip" style={{ cursor: 'default' }}>{s}</span>)}</div>
          </div>
          <button className="btn btn-ghost btn-sm g-noprint" onClick={() => window.print()}><Icon name="print" size={16} />Chop etish</button>
        </header>

        <div className="g-layout">
          <aside className="card g-toc g-noprint">
            {[['oqish', 'file', 'Nimani o‘qish'], ['aldanmang', 'alert', 'Aldanib qolmang'], ['tayyorlaning', 'list', 'Borishdan oldin'], ['yurist', 'users', 'Qachon yurist kerak'], ['asos', 'book', 'Huquqiy asos']].map(([s, i, t]) => (
              <button key={s} className="nav-link" style={{ width: '100%', border: 0, background: 'none', cursor: 'pointer' }} onClick={() => go(s)}><Icon name={i} size={17} />{t}</button>
            ))}
          </aside>

          <div className="stack-lg" style={{ minWidth: 0 }}>
            <section id="oqish" className="g-block">
              <Head icon="file" tone="lapis" step="1-qadam" title="Hujjatda nimani o‘qish kerak" />
              <div className="stack">
                {g.read.map((r) => (
                  <div key={r.doc} className="card">
                    <h3 className="h3 row" style={{ gap: 8, marginBottom: 10 }}><Icon name="file" size={18} style={{ color: 'var(--lapis)' }} />{r.doc}</h3>
                    <ol className="g-items">{r.items.map(([t, d]) => <li key={t}><b>{t}</b><span>{d}</span></li>)}</ol>
                  </div>
                ))}
              </div>
            </section>

            <section id="aldanmang" className="g-block">
              <Head icon="alert" tone="gold" step="2-qadam" title="Aldanib qolmang" />
              <div className="grid g2">{g.traps.map(([t, d]) => (
                <div key={t} className="g-trap"><b className="row top" style={{ gap: 8 }}><Icon name="alert" size={17} style={{ color: 'var(--warning)', flexShrink: 0, marginTop: 2 }} />{t}</b><p className="small" style={{ marginTop: 6, paddingLeft: 25 }}>{d}</p></div>
              ))}</div>
            </section>

            <section id="tayyorlaning" className="g-block">
              <Head icon="list" tone="teal" step="3-qadam" title="Borishdan oldin tayyorlang" />
              <div className="grid g2" style={{ alignItems: 'start' }}>
                <div className="card">
                  <h3 className="h3 row" style={{ gap: 8, marginBottom: 12 }}><Icon name="mapPin" size={18} style={{ color: 'var(--lapis)' }} />Qayerga murojaat qilinadi</h3>
                  <div className="stack">{g.where.map(([t, d]) => <div key={t} style={{ paddingLeft: 12, borderLeft: '3px solid var(--lapis-soft)' }}><b className="small">{t}</b><div className="small muted">{d}</div></div>)}</div>
                </div>
                <div className="card">
                  <h3 className="h3 row" style={{ gap: 8, marginBottom: 8 }}><Icon name="list" size={18} style={{ color: 'var(--teal)' }} />O‘zingiz bilan oling<span className="badge" style={{ marginLeft: 'auto' }}>{items.filter(([k]) => checked.has(k)).length}/{items.length}</span></h3>
                  {items.map(([k, t], i) => (
                    <div key={k}>
                      {k === 'p0' && <div className="xs faint" style={{ fontFamily: 'var(--mono)', textTransform: 'uppercase', letterSpacing: '.1em', margin: '14px 0 4px' }}>Oldindan qiling</div>}
                      <label className="check" style={{ padding: '8px 0', borderTop: i && k !== 'p0' ? '1px solid var(--hairline)' : 0 }}>
                        <input type="checkbox" checked={checked.has(k)} onChange={() => toggle(k)} /><span style={checked.has(k) ? { textDecoration: 'line-through', color: 'var(--ink-faint)' } : undefined}>{t}</span>
                      </label>
                    </div>
                  ))}
                  <p className="xs faint" style={{ marginTop: 8 }}>Belgilaringiz faqat shu qurilmada saqlanadi.</p>
                </div>
              </div>
            </section>

            <section id="yurist" className="g-block">
              <Head icon="users" tone="ink" step="Muhim" title="Qachon yurist kerak" />
              <div className="card">
                <div className="stack">{g.lawyer.map((l) => <div key={l} className="row" style={{ gap: 10 }}><Icon name="checkCircle" size={18} style={{ color: 'var(--success)' }} />{l}</div>)}</div>
                <div className="row between wrap" style={{ gap: 14, marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--hairline)' }}>
                  <p className="small muted" style={{ maxWidth: 560 }}>{g.caseHint ?? 'Huquqchi AI’da tasdiqlangan yuristlar bor. To‘lov ish bajarilguncha platformada saqlanadi.'}</p>
                  <Link to={`/lawyers?category=${g.category}`} className="btn btn-primary btn-sm g-noprint">Yurist topish <Icon name="arrowRight" size={15} /></Link>
                </div>
              </div>
            </section>

            <section id="asos" className="g-block">
              <Head icon="book" tone="lapis" step="Manbalar" title="Huquqiy asos" />
              <div className="card">
                {g.laws.map(([n, url]) => (
                  <div key={n} className="list-item small">
                    <Icon name="book" size={17} style={{ color: 'var(--lapis)' }} />
                    {url ? <a href={url} target="_blank" rel="noreferrer" className="strong" style={{ color: 'var(--lapis)' }}>{n} ↗</a> : <span className="grow">{n}</span>}
                    {!url && <span className="xs faint">lex.uz’da qidiring</span>}
                  </div>
                ))}
              </div>
              <p className="row xs muted" style={{ gap: 8, marginTop: 12 }}><Icon name="info" size={15} />Bu qo‘llanma umumiy ma’lumot beradi va yuridik maslahat o‘rnini bosmaydi. Aniq muddat va summalar vaziyatga qarab farq qiladi.</p>
            </section>

            <Link to={`/bolimlar/${next.id}`} className="card row between g-noprint"><span><span className="xs faint">Keyingi bo‘lim</span><b style={{ display: 'block', fontSize: 17 }}>{next.title}</b></span><Icon name="arrowRight" style={{ color: 'var(--lapis)' }} /></Link>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  )
}
