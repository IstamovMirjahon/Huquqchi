import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { api } from '../../api'
import type { CategoryCode, Language, LawyerProfileInput, VerificationKind, WorkFormat } from '../../api/types'
import { useAuth } from '../../auth'
import { Icon } from '../../components/Icon'
import { Badge, Empty, Field, FilePick, Loading, Modal, PageHead, Stars, useAction, useAsync } from '../../components/ui'
import { ago, dateFull, LANG, money, WORK_FORMAT } from '../../lib/format'
import { Plans } from '../client/Profile'

const TX: Record<string, [string, string]> = { order_income: ['Buyurtma', 'success'], commission: ['Komissiya', ''], payout: ['Pul yechish', 'lapis'], payout_reversal: ['Qaytarildi', 'warning'], refund_debit: ['Qaytarish', 'danger'], adjustment: ['Tuzatish', ''], promotion: ['Reklama', 'gold'] }

export function WalletPage() {
  const w = useAsync(() => api.wallet.get(), [])
  const tx = useAsync(() => api.wallet.transactions(), [])
  const methods = useAsync(() => api.wallet.methods(), [])
  const payouts = useAsync(() => api.wallet.payouts(), [])
  const [withdraw, setWithdraw] = useState(false)
  const [addCard, setAddCard] = useState(false)
  const [amount, setAmount] = useState('')
  const [methodId, setMethodId] = useState('')
  const [card, setCard] = useState({ number: '', holder: '' })
  const { busy, run } = useAction()
  useEffect(() => { if (methods.data?.length && !methodId) setMethodId(methods.data.find((m) => m.isDefault)?.id ?? methods.data[0].id) }, [methods.data, methodId])
  if (w.loading || !w.data) return <Loading />
  const wl = w.data
  const reloadAll = () => { w.reload(true); tx.reload(true); payouts.reload(true) }

  return (
    <div className="stack-lg">
      <PageHead eyebrow="Daromad" title="Hamyon" sub={`Mijoz ishni tasdiqlagach pul shu yerga tushadi (komissiya ${Math.round(wl.commissionRate * 100)}%). Kartaga 1–3 ish kunida o‘tkaziladi.`}
        actions={<button className="btn btn-primary" disabled={!wl.canWithdraw || wl.available < wl.minPayout} onClick={() => { setAmount(String(wl.available)); setWithdraw(true) }}><Icon name="download" size={17} />Pul yechish</button>} />
      {wl.withdrawBlockedReason && <div className="banner warn small"><Icon name="alert" size={17} />{wl.withdrawBlockedReason}</div>}
      <div className="grid g3">
        <div className="card" style={{ background: 'linear-gradient(135deg, var(--navy), var(--lapis))', color: '#fff' }}>
          <div className="small" style={{ opacity: .75 }}>Yechish mumkin</div>
          <div style={{ fontSize: 32, fontWeight: 750, letterSpacing: '-.03em', marginTop: 6 }}>{money(wl.available)}</div>
          <div className="xs" style={{ opacity: .7, marginTop: 6 }}>Minimal: {money(wl.minPayout)}</div>
        </div>
        <div className="card stat"><div className="label">Kutilmoqda</div><div className="value mono">{money(wl.pending)}</div><div className="hint">Faol buyurtmalar, mijoz tasdig‘idan keyin tushadi</div></div>
        <div className="card stat"><div className="label">Jami ishlangan</div><div className="value mono">{money(wl.totalEarned)}</div><div className="hint">Yechilgan: {money(wl.totalWithdrawn)}{wl.inPayout ? ` · jarayonda ${money(wl.inPayout)}` : ''}</div></div>
      </div>
      <div className="split">
        <section className="card">
          <div className="card-head"><h2 className="h3">Tranzaksiyalar</h2></div>
          {tx.data?.items.length ? (
            <div className="table-wrap"><table className="table">
              <thead><tr><th>Sana</th><th>Turi</th><th>Tavsif</th><th style={{ textAlign: 'right' }}>Summa</th></tr></thead>
              <tbody>{tx.data.items.map((t) => (
                <tr key={t.id}><td className="small">{dateFull(t.createdAt)}</td><td><Badge tone={TX[t.type][1]}>{TX[t.type][0]}</Badge></td><td className="small">{t.description}</td><td className="mono strong" style={{ textAlign: 'right', color: t.amount > 0 ? 'var(--success)' : 'var(--ink)' }}>{t.amount > 0 ? '+' : ''}{money(t.amount)}</td></tr>
              ))}</tbody>
            </table></div>
          ) : <Empty icon="wallet" title="Tranzaksiyalar yo‘q" />}
        </section>
        <aside className="stack">
          <section className="card stack">
            <div className="row between"><h2 className="h3">Kartalar</h2><button className="btn btn-sm btn-ghost" onClick={() => setAddCard(true)}><Icon name="plus" size={15} />Qo‘shish</button></div>
            {methods.data?.map((m) => (
              <div key={m.id} className="row" style={{ gap: 10, padding: 12, borderRadius: 12, background: '#fff', border: '1px solid var(--border)' }}>
                <Icon name="card" style={{ color: 'var(--lapis)' }} />
                <div className="grow"><div className="small strong mono">{m.maskedNumber}</div><div className="xs faint">{m.bankName} · {m.holderName}</div></div>
                {m.isDefault && <Badge tone="lapis">Asosiy</Badge>}
                <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={async () => { await run(() => api.wallet.removeMethod(m.id)); methods.reload(true) }}><Icon name="x" size={13} /></button>
              </div>
            ))}
            {methods.data?.length === 0 && <p className="small muted">Pul yechish uchun Humo yoki Uzcard kartasini qo‘shing.</p>}
          </section>
          <section className="card">
            <h2 className="h3" style={{ marginBottom: 8 }}>Pul yechish so‘rovlari</h2>
            {payouts.data?.items.length ? payouts.data.items.map((p) => (
              <div key={p.id} className="row between small" style={{ padding: '8px 0', borderBottom: '1px solid var(--hairline)' }}>
                <div><b className="mono">{money(p.amount)}</b><div className="xs faint">{p.method.maskedNumber} · {ago(p.requestedAt)}</div></div>
                <Badge tone={p.status === 'paid' ? 'success' : p.status === 'failed' ? 'danger' : 'warning'}>{{ requested: 'So‘ralgan', processing: 'Jarayonda', paid: 'O‘tkazildi', failed: 'Xato', cancelled: 'Bekor' }[p.status]}</Badge>
              </div>
            )) : <p className="small muted">Hali so‘rov yo‘q</p>}
          </section>
        </aside>
      </div>

      <Modal open={withdraw} onClose={() => setWithdraw(false)} title="Pul yechish" footer={<><button className="btn btn-ghost" onClick={() => setWithdraw(false)}>Bekor qilish</button><button className="btn btn-primary" disabled={busy || !methodId || Number(amount) < wl.minPayout} onClick={async () => { const r = await run(() => api.wallet.requestPayout({ amount: Number(amount), payoutMethodId: methodId }), 'So‘rov yuborildi'); if (r) { setWithdraw(false); reloadAll() } }}>{busy ? <span className="spinner" /> : 'So‘rov yuborish'}</button></>}>
        <div className="stack">
          <Field label="Summa (so‘m)" hint={`Mavjud: ${money(wl.available)}`}><input className="input" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))} /></Field>
          <Field label="Karta"><select className="select" value={methodId} onChange={(e) => setMethodId(e.target.value)}>{methods.data?.map((m) => <option key={m.id} value={m.id}>{m.maskedNumber} · {m.bankName}</option>)}</select></Field>
          {methods.data?.length === 0 && <button className="btn btn-ghost" onClick={() => { setWithdraw(false); setAddCard(true) }}>Avval karta qo‘shing</button>}
        </div>
      </Modal>
      <Modal open={addCard} onClose={() => setAddCard(false)} title="Karta qo‘shish" sub="Karta raqami to‘liq saqlanmaydi: faqat to‘lov tizimi tokeni va oxirgi 4 raqam." footer={<><button className="btn btn-ghost" onClick={() => setAddCard(false)}>Bekor qilish</button><button className="btn btn-primary" disabled={busy || card.number.replace(/\D/g, '').length < 16 || card.holder.length < 3} onClick={async () => { const r = await run(() => api.wallet.addMethod({ type: 'card', cardNumber: card.number, holderName: card.holder }), 'Karta qo‘shildi'); if (r) { setAddCard(false); setCard({ number: '', holder: '' }); methods.reload(true) } }}>Qo‘shish</button></>}>
        <div className="stack">
          <Field label="Karta raqami"><input className="input mono" inputMode="numeric" placeholder="8600 0000 0000 0000" value={card.number} onChange={(e) => setCard({ ...card, number: e.target.value.replace(/[^\d ]/g, '').slice(0, 19) })} /></Field>
          <Field label="Karta egasi"><input className="input" placeholder="DILSHOD RAHIMOV" value={card.holder} onChange={(e) => setCard({ ...card, holder: e.target.value.toUpperCase() })} /></Field>
        </div>
      </Modal>
    </div>
  )
}

const KIND_LABEL: Record<VerificationKind, [string, string]> = {
  passport: ['Pasport yoki ID karta', 'Asosiy sahifa, o‘qiladigan'], diploma: ['Yuridik diplom', 'Ilovasi bilan'],
  license: ['Advokat guvohnomasi / litsenziya', 'Faqat advokatlar uchun'], selfie: ['Selfi', 'Pasportni ushlab turgan holda'],
}

export function ProProfile() {
  const { refresh } = useAuth()
  const loc = useLocation()
  const p = useAsync(() => api.lawyer.profile(), [])
  const v = useAsync(() => api.lawyer.verification(), [])
  const cats = useAsync(() => api.reference.categories(), [])
  const regions = useAsync(() => api.reference.regions(), [])
  const reviews = useAsync(() => api.lawyer.reviews(), [])
  const [f, setF] = useState<LawyerProfileInput | null>(null)
  const [reply, setReply] = useState<{ id: string; text: string } | null>(null)
  const { busy, run } = useAction()
  useEffect(() => {
    if (p.data) setF({ type: p.data.type, headline: p.data.headline, bio: p.data.bio, experienceYears: p.data.experienceYears, categories: p.data.categories.map((c, i) => ({ code: c.code, isPrimary: i === 0 })), region: p.data.region.code, city: p.data.city, languages: p.data.languages, workFormats: p.data.workFormats, officeAddress: p.data.officeAddress, licenseNumber: p.data.licenseNumber, education: p.data.education })
  }, [p.data])
  useEffect(() => { if (loc.hash === '#plans') setTimeout(() => document.getElementById('plans')?.scrollIntoView({ behavior: 'smooth' }), 200) }, [loc.hash])
  // Demo auto-approval lands a few seconds after submit.
  useEffect(() => { if (v.data?.status !== 'pending') return; const t = setInterval(() => { v.reload(true); refresh() }, 3000); return () => clearInterval(t) }, [v.data?.status, v, refresh])
  if (p.loading || !f || !v.data) return <Loading />
  const ver = v.data
  const set = <K extends keyof LawyerProfileInput>(k: K, val: LawyerProfileInput[K]) => setF({ ...f, [k]: val })
  const toggleCat = (code: CategoryCode) => {
    const has = f.categories.some((c) => c.code === code)
    const next = has ? f.categories.filter((c) => c.code !== code) : [...f.categories, { code, isPrimary: f.categories.length === 0 }].slice(0, 5)
    if (next.length && !next.some((c) => c.isPrimary)) next[0].isPrimary = true
    set('categories', next)
  }
  const statusInfo = { draft: ['Tasdiqlanmagan', 'warning', 'Profilni to‘ldiring va hujjatlarni yuklab, tekshiruvga yuboring.'], pending: ['Tekshiruvda', 'lapis', 'Moderator hujjatlaringizni ko‘rib chiqmoqda. Odatda 1 ish kuni.'], verified: ['Tasdiqlangan', 'success', 'Siz katalogda ko‘rinasiz va buyurtma olasiz.'], rejected: ['Rad etilgan', 'danger', ver.rejectionReason ?? 'Hujjatlarni tuzatib qayta yuboring.'], suspended: ['To‘xtatilgan', 'danger', 'Yordam xizmatiga murojaat qiling.'] }[ver.status] as [string, string, string]

  return (
    <div className="stack-lg">
      <PageHead title="Profil va tekshiruv" actions={<Link to={`/lawyers/${p.data!.id}`} className="btn btn-ghost"><Icon name="eye" size={17} />Ochiq profil</Link>} />
      <section className="card pad-lg">
        <div className="row between wrap" style={{ gap: 12 }}>
          <div className="row" style={{ gap: 12 }}><Icon name="shieldCheck" size={28} style={{ color: `var(--${statusInfo[1]})` }} /><div><div className="row" style={{ gap: 8 }}><h2 className="h3">Tekshiruv holati</h2><Badge tone={statusInfo[1]}>{statusInfo[0]}</Badge></div><p className="small muted">{statusInfo[2]}</p></div></div>
          {['draft', 'rejected'].includes(ver.status) && <button className="btn btn-primary" disabled={busy} onClick={async () => { const r = await run(() => api.lawyer.submitVerification(), 'Tekshiruvga yuborildi'); if (r) { v.setData(r); refresh() } }}>Tekshiruvga yuborish</button>}
        </div>
        {ver.status !== 'verified' && (
          <div className="grid g2" style={{ marginTop: 16 }}>
            {ver.requiredKinds.map((k) => {
              const doc = ver.documents.find((d) => d.kind === k)
              return (
                <div key={k} className="row" style={{ gap: 12, padding: 14, borderRadius: 14, background: '#fff', border: `1px solid ${doc ? 'var(--success)' : 'var(--border)'}` }}>
                  <Icon name={doc ? 'checkCircle' : 'upload'} style={{ color: doc ? 'var(--success)' : 'var(--ink-faint)' }} />
                  <div className="grow"><div className="small strong">{KIND_LABEL[k][0]}</div><div className="xs faint">{doc ? doc.file.name : KIND_LABEL[k][1]}</div>{doc?.comment && <div className="xs" style={{ color: 'var(--danger)' }}>{doc.comment}</div>}</div>
                  {['draft', 'rejected'].includes(ver.status) && <FilePick className="btn btn-sm btn-ghost" accept=".jpg,.jpeg,.png,.pdf" onFile={async (file) => { const up = await run(() => api.files.upload(file, 'kyc')); if (up) { await api.lawyer.addVerificationDoc(k, up.id); v.reload(true) } }}>{doc ? 'Almashtirish' : 'Yuklash'}</FilePick>}
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="card pad-lg stack">
        <h2 className="h3">Ochiq profil</h2>
        <div className="grid g2">
          <Field label="Mutaxassis turi"><select className="select" value={f.type} onChange={(e) => set('type', e.target.value as LawyerProfileInput['type'])}><option value="advocate">Advokat</option><option value="legal_consultant">Yuridik maslahatchi</option></select></Field>
          <Field label="Tajriba (yil)"><input className="input" inputMode="numeric" value={f.experienceYears} onChange={(e) => set('experienceYears', Number(e.target.value.replace(/\D/g, '')))} /></Field>
        </div>
        <Field label="Sarlavha" hint="Masalan: Mehnat va oila nizolari bo‘yicha advokat"><input className="input" value={f.headline} onChange={(e) => set('headline', e.target.value)} /></Field>
        <Field label="O‘zingiz haqingizda"><textarea className="textarea" rows={5} value={f.bio} onChange={(e) => set('bio', e.target.value)} /></Field>
        <Field label="Yo‘nalishlar (1–5, birinchisi asosiy)"><div className="row wrap" style={{ gap: 6 }}>{cats.data?.filter((c) => c.code !== 'other').map((c) => <button key={c.code} type="button" className={`chip ${f.categories.some((x) => x.code === c.code) ? 'on' : ''}`} onClick={() => toggleCat(c.code)}>{f.categories.find((x) => x.code === c.code)?.isPrimary && '★ '}{c.name}</button>)}</div></Field>
        <div className="grid g3">
          <Field label="Hudud"><select className="select" value={f.region} onChange={(e) => set('region', e.target.value)}>{regions.data?.map((r) => <option key={r.code} value={r.code}>{r.name}</option>)}</select></Field>
          <Field label="Shahar"><input className="input" value={f.city} onChange={(e) => set('city', e.target.value)} /></Field>
          <Field label="Litsenziya raqami"><input className="input" value={f.licenseNumber ?? ''} onChange={(e) => set('licenseNumber', e.target.value || null)} /></Field>
        </div>
        <Field label="Tillar"><div className="row wrap" style={{ gap: 6 }}>{(Object.keys(LANG) as Language[]).map((l) => <button key={l} type="button" className={`chip ${f.languages.includes(l) ? 'on' : ''}`} onClick={() => set('languages', f.languages.includes(l) ? f.languages.filter((x) => x !== l) : [...f.languages, l])}>{LANG[l]}</button>)}</div></Field>
        <Field label="Ish formati"><div className="row wrap" style={{ gap: 6 }}>{(Object.keys(WORK_FORMAT) as WorkFormat[]).map((w) => <button key={w} type="button" disabled={w === 'court' && f.type !== 'advocate'} className={`chip ${f.workFormats.includes(w) ? 'on' : ''}`} onClick={() => set('workFormats', f.workFormats.includes(w) ? f.workFormats.filter((x) => x !== w) : [...f.workFormats, w])}>{WORK_FORMAT[w]}</button>)}</div></Field>
        {f.workFormats.includes('office') && <Field label="Ofis manzili"><input className="input" value={f.officeAddress ?? ''} onChange={(e) => set('officeAddress', e.target.value || null)} /></Field>}
        <Field label="Ta’lim"><div className="stack" style={{ gap: 6 }}>
          {f.education.map((e, i) => <div key={i} className="row" style={{ gap: 6 }}><input className="input" value={e.institution} placeholder="OTM" onChange={(ev) => set('education', f.education.map((x, k) => (k === i ? { ...x, institution: ev.target.value } : x)))} /><input className="input" style={{ width: 140 }} value={e.degree} placeholder="Daraja" onChange={(ev) => set('education', f.education.map((x, k) => (k === i ? { ...x, degree: ev.target.value } : x)))} /><input className="input" style={{ width: 90 }} value={e.year || ''} placeholder="Yil" onChange={(ev) => set('education', f.education.map((x, k) => (k === i ? { ...x, year: Number(ev.target.value.replace(/\D/g, '')) } : x)))} /></div>)}
          <button type="button" className="btn-text btn xs" style={{ alignSelf: 'flex-start' }} onClick={() => set('education', [...f.education, { institution: '', degree: '', year: 0 }])}>+ Qo‘shish</button>
        </div></Field>
        <div className="row" style={{ justifyContent: 'flex-end' }}><button className="btn btn-primary" disabled={busy} onClick={async () => { const r = await run(() => api.lawyer.updateProfile(f), 'Profil saqlandi'); if (r) p.setData(r) }}>Saqlash</button></div>
      </section>

      <section className="card">
        <div className="card-head"><h2 className="h3">Sharhlar</h2><span className="small muted">Sharhni o‘chirib bo‘lmaydi, faqat javob yozasiz</span></div>
        {reviews.data?.items.length ? reviews.data.items.map((r) => (
          <div key={r.id} className="list-item" style={{ alignItems: 'flex-start' }}>
            <div className="grow">
              <div className="row between"><div className="row" style={{ gap: 8 }}><b className="small">{r.client.name}</b><Stars value={r.rating} size={13} /></div><span className="xs faint">{ago(r.createdAt)}</span></div>
              <p className="small" style={{ marginTop: 4 }}>{r.text}</p>
              {r.lawyerReply ? <div className="sunken small" style={{ marginTop: 8, padding: 10 }}><b className="xs">Javobingiz:</b> {r.lawyerReply.text}</div> : <button className="btn-text btn xs" style={{ marginTop: 6 }} onClick={() => setReply({ id: r.id, text: '' })}>Javob yozish</button>}
            </div>
          </div>
        )) : <Empty icon="star" title="Hali sharh yo‘q" />}
      </section>

      <Plans audience="lawyer" />
      <Modal open={!!reply} onClose={() => setReply(null)} title="Sharhga javob" footer={<><button className="btn btn-ghost" onClick={() => setReply(null)}>Bekor qilish</button><button className="btn btn-primary" disabled={!reply?.text.trim() || busy} onClick={async () => { await run(() => api.reviews.reply(reply!.id, reply!.text), 'Javob yuborildi'); setReply(null); reviews.reload(true) }}>Yuborish</button></>}>
        <textarea className="textarea" value={reply?.text ?? ''} onChange={(e) => setReply(reply && { ...reply, text: e.target.value })} />
      </Modal>
    </div>
  )
}
