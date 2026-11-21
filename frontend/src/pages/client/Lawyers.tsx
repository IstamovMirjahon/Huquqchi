import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { api } from '../../api'
import { Icon } from '../../components/Icon'
import { LawyerCardView } from '../../components/LawyerCard'
import { Empty, ErrorBox, Loading, PageHead, useAsync } from '../../components/ui'
import { SERVICE_TYPE } from '../../lib/format'

export default function Lawyers() {
  const [sp, setSp] = useSearchParams()
  const [search, setSearch] = useState(sp.get('search') ?? '')
  const cats = useAsync(() => api.reference.categories(), [])
  const regions = useAsync(() => api.reference.regions(), [])
  const q = Object.fromEntries(sp.entries())
  const res = useAsync(() => api.lawyers.list({ ...q, pageSize: 30 }), [sp.toString()])
  const set = (k: string, v: string | null) => { const n = new URLSearchParams(sp); if (v) n.set(k, v); else n.delete(k); setSp(n, { replace: true }) }

  return (
    <>
      <PageHead eyebrow="Tasdiqlangan mutaxassislar" title="Yurist topish" sub="Tasdiqlangan advokat va yuristlar. To‘lov ish bajarilguncha platformada saqlanadi." />
      <div className="split-l">
        <aside className="card sticky stack">
          <form onSubmit={(e) => { e.preventDefault(); set('search', search.trim() || null) }} className="input-icon">
            <Icon name="search" size={17} /><input className="input" placeholder="Ism yoki xizmat…" value={search} onChange={(e) => setSearch(e.target.value)} />
          </form>
          <div className="field"><span>Yo‘nalish</span></div>
          <div className="row wrap" style={{ gap: 6 }}>
            {cats.data?.filter((c) => c.code !== 'other').map((c) => (
              <button key={c.code} className={`chip ${q.category === c.code ? 'on' : ''}`} onClick={() => set('category', q.category === c.code ? null : c.code)}>{c.name}</button>
            ))}
          </div>
          <label className="field"><span>Xizmat turi</span>
            <select className="select" value={q.serviceType ?? ''} onChange={(e) => set('serviceType', e.target.value || null)}>
              <option value="">Hammasi</option>{Object.entries(SERVICE_TYPE).filter(([k]) => k !== 'other').map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className="field"><span>Hudud</span>
            <select className="select" value={q.region ?? ''} onChange={(e) => set('region', e.target.value || null)}>
              <option value="">Butun O‘zbekiston</option>{regions.data?.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}
            </select>
          </label>
          <label className="field"><span>Mutaxassis</span>
            <select className="select" value={q.type ?? ''} onChange={(e) => set('type', e.target.value || null)}>
              <option value="">Hammasi</option><option value="advocate">Advokat</option><option value="legal_consultant">Yuridik maslahatchi</option>
            </select>
          </label>
          <label className="field"><span>Narx (gacha)</span>
            <select className="select" value={q.priceMax ?? ''} onChange={(e) => set('priceMax', e.target.value || null)}>
              <option value="">Farqi yo‘q</option><option value="50000">50 000 so‘m</option><option value="100000">100 000 so‘m</option><option value="200000">200 000 so‘m</option><option value="500000">500 000 so‘m</option>
            </select>
          </label>
          <label className="check"><input type="checkbox" checked={q.availableWithin === '48'} onChange={(e) => set('availableWithin', e.target.checked ? '48' : null)} /><span className="small">48 soat ichida bo‘sh</span></label>
          <label className="check"><input type="checkbox" checked={q.format === 'court'} onChange={(e) => set('format', e.target.checked ? 'court' : null)} /><span className="small">Sudda vakillik qiladi</span></label>
          {sp.toString() && <button className="btn btn-sm btn-ghost" onClick={() => { setSearch(''); setSp({}, { replace: true }) }}>Filtrlarni tozalash</button>}
        </aside>

        <section>
          <div className="row between" style={{ marginBottom: 12 }}>
            <span className="small muted">{res.data ? `${res.data.total} ta yurist` : ''}</span>
            <select className="select" style={{ width: 'auto' }} value={q.sort ?? 'recommended'} onChange={(e) => set('sort', e.target.value === 'recommended' ? null : e.target.value)}>
              <option value="recommended">Tavsiya etilgan</option><option value="rating">Reyting bo‘yicha</option><option value="reviews">Sharhlar soni</option><option value="price_asc">Arzonroq</option><option value="price_desc">Qimmatroq</option><option value="experience">Tajriba</option>
            </select>
          </div>
          {res.loading && !res.data ? <Loading /> : res.error ? <ErrorBox error={res.error} retry={res.reload} /> : res.data?.items.length ? (
            <div className="stack">{res.data.items.map((l) => <LawyerCardView key={l.id} l={l} />)}</div>
          ) : <div className="card"><Empty icon="users" title="Mos yurist topilmadi" text="Filtrlarni o‘zgartiring yoki ochiq e’lon joylang: yuristlar o‘zlari taklif yuboradi." /></div>}
        </section>
      </div>
    </>
  )
}
