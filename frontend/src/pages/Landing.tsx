import { useEffect, useRef, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { apiMode, isMock, switchMode } from '../api'
import { useAuth } from '../auth'
import { Icon } from '../components/Icon'
import { PublicNav } from '../components/PublicNav'

const GUIDES: [string, string, string, string][] = [
  ['ijara', 'home', 'Uy-joy ijarasi', 'Shartnoma, garov, to‘lovlar'],
  ['ishdagi-muammolar', 'alert', 'Ishdagi muammolar', 'Ish haqi, bo‘shatish, bosim'],
  ['ajrim-aliment', 'family', 'Ajrim va aliment', 'Bolalar, aliment, mulk'],
  ['meros', 'scroll', 'Oila va meros', 'Merosni qabul qilish'],
  ['mulk', 'building', 'Ko‘chmas mulk', 'Oldi-sotdi va hujjatlar'],
  ['kredit', 'card', 'Kredit va qarz', 'Kafillik, mikroqarz, tilxat'],
  ['notarius', 'stamp', 'Notarius kerakmi?', 'Qaysi hujjat tasdiqlanadi'],
  ['huquq-organlari', 'shield', 'Politsiya va tergov', 'Chaqiruv, bayonnoma, advokat'],
]

/** Public hero page for guests (signed-in users go straight to their dashboard). */
export default function Landing() {
  const { me, ready } = useAuth()
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const pageRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ready || me) return
    const page = pageRef.current
    if (!page) return
    const items = page.querySelectorAll<HTMLElement>('[data-reveal]')
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-visible')
        observer.unobserve(entry.target)
      })
    }, { threshold: 0.08, rootMargin: '0px 0px -32px 0px' })
    items.forEach((item) => observer.observe(item))
    page.classList.add('motion-ready')
    return () => observer.disconnect()
  }, [ready, me])

  if (!ready) return null
  if (me) return <Navigate to={me.role === 'lawyer' ? '/pro' : '/'} replace />
  const ask = (text: string) => nav(`/login?next=${encodeURIComponent(`/chat?q=${encodeURIComponent(text)}`)}`)

  return (
    <div className="lp" ref={pageRef}>
      <PublicNav />

      <section className="lp-wrap lp-hero">
        <div className="lp-intro">
          <span className="eyebrow">O‘zbekiston huquqi bo‘yicha AI yordamchi</span>
          <h1 className="lp-h1">Huquqingizni tushuning.<br /><span className="grad-text">Keyingi qadamni biling.</span></h1>
          <p className="lp-lead">Savol bering yoki hujjat yuklang: AI qonun moddasi bilan javob beradi va muammoni qadamlarga bo‘ladi. Kerak bo‘lsa, tasdiqlangan yurist ishni oxirigacha olib boradi, pul esa natijadan keyin o‘tadi.</p>
          {apiMode === 'hybrid' && <p className="banner info small" style={{ marginTop: 16 }}>Platforma sinov rejimida: kirish va ayrim hujjat xizmatlari backend bilan ishlaydi; yurist, buyurtma va to‘lov bo‘limlari hozircha demo.</p>}
          <form className="ask" onSubmit={(e) => { e.preventDefault(); if (q.trim()) ask(q) }}>
            <Icon name="sparkles" style={{ color: 'var(--lapis)', alignSelf: 'center' }} />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Vaziyatingizni yozing: masalan, ish haqim berilmayapti" />
            <button className="btn btn-lapis" disabled={!q.trim()}>So‘rash <Icon name="arrowRight" size={16} /></button>
          </form>
          <div className="row wrap" style={{ gap: 10, marginTop: 18 }}>
            <Link to="/login" className="btn btn-primary">Boshlash</Link>
            {!isMock && <button className="btn btn-ghost" onClick={() => switchMode('mock')}><Icon name="eye" size={16} />Demo’ni ko‘rish</button>}
            <Link to="/login?role=lawyer" className="btn btn-ghost"><Icon name="scale" size={16} />Yuristmisiz?</Link>
          </div>
          <p className="row small muted" style={{ gap: 8, marginTop: 18 }}><Icon name="checkCircle" size={17} style={{ color: 'var(--success)' }} />Manba topilmasa, ochiq aytadi: modda va havola to‘qimaydi.</p>
        </div>

        <div className="lp-preview card">
          <div className="row" style={{ gap: 8 }}><span className="badge lapis">Javob namunasi</span><span className="badge success">Demo ko‘rinishi</span></div>
          <div className="bubble-user" style={{ marginTop: 14, fontSize: 14 }}>Ish beruvchi ikki oydan beri ish haqimni bermayapti. Nima qilsam bo‘ladi?</div>
          <p className="small" style={{ marginTop: 14 }}>Har kim mehnati uchun haq olish huquqiga ega. Avval ish beruvchiga yozma talabnoma yuboring, javob bo‘lmasa mehnat inspeksiyasi yoki sudga murojaat qilasiz.</p>
          <div className="citation" style={{ marginTop: 10 }}><b className="small">Manba va modda havolasi</b><div className="xs muted">Tasdiqlangan huquqiy manba mavjud bo‘lganda ko‘rsatiladi</div></div>
          <div className="lp-steps">
            {[['check', 'Vaziyat tahlili'], ['receiptMoney', 'Summa: 12 mln so‘m'], ['filePlus', 'Talabnoma tayyor'], ['users', 'Yurist bilan']].map(([i, t], k) => (
              <div key={t} className={`lp-step ${k < 3 ? 'done' : ''}`}><Icon name={i} size={15} />{t}</div>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-wrap lp-sec" data-reveal>
        <div className="grid g4">
          {[
            ['sparkles', 'var(--grad-lapis)', 'AI huquqshunos', 'Savolga O‘zbekiston qonunlari asosida, modda va tahrir sanasi bilan javob.'],
            ['layout', 'var(--grad-teal)', 'Ishlarim', 'Muammo qadamlarga bo‘linadi: hisob, talabnoma, muddatlar, keyingi murojaat.'],
            ['users', 'var(--grad-gold)', 'Tasdiqlangan yuristlar', 'Konsultatsiya, yozma savol yoki e’lon. To‘lov ish bitguncha platformada.'],
            ['building', 'linear-gradient(135deg,#2a2e38,#14161b)', 'Davlat xizmatlari', 'Da’vo, murojaat, ishonchnoma tayyorlab beramiz: rasmiy portalda topshirasiz.'],
          ].map(([i, g, t, d]) => (
            <div key={t} className="card tile" data-reveal>
              <div className="tile-ico" style={{ background: g }}><Icon name={i} size={22} /></div>
              <div><div className="h3">{t}</div><p className="small muted" style={{ marginTop: 4 }}>{d}</p></div>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-wrap lp-sec" id="qanday" data-reveal>
        <span className="eyebrow">Qanday ishlaydi</span>
        <h2 className="lp-h2">Uch qadam: savoldan natijagacha</h2>
        <div className="grid g3" style={{ marginTop: 22 }}>
          {[
            ['01', 'chat', 'Vaziyatni yozing', 'Oddiy so‘zlar bilan yozing yoki hujjatni yuklang. AI kerakli savollarni o‘zi beradi.'],
            ['02', 'scale', 'Manbali javob va reja', 'Javob qonun moddasiga tayanadi. Muammo ish sifatida ochiladi va qadamlarga bo‘linadi.'],
            ['03', 'users', 'Kerak bo‘lsa, yurist', 'Bir tugma bilan tasdiqlangan yuristga ish konteksti bilan o‘tasiz. Pul natijadan keyin o‘tadi.'],
          ].map(([n, i, t, d]) => (
            <div key={n} className="card" data-reveal>
              <div className="row between"><span className="tile-ico" style={{ background: 'var(--lapis-soft)', color: 'var(--lapis)' }}><Icon name={i} size={20} /></span><span className="lp-num">{n}</span></div>
              <div className="h3" style={{ marginTop: 14 }}>{t}</div>
              <p className="small muted" style={{ marginTop: 4 }}>{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lp-wrap lp-sec" data-reveal>
        <div className="row between wrap" style={{ gap: 12 }}>
          <div><span className="eyebrow">Bepul · ro‘yxatdan o‘tmasdan</span><h2 className="lp-h2">Idoraga borishdan oldin o‘qing</h2>
            <p className="muted" style={{ marginTop: 6, maxWidth: 620 }}>Hujjatning qaysi bandlarini o‘qish, nimada aldanmaslik va borishdan oldin nima tayyorlash kerak: 17 ta soha bo‘yicha.</p></div>
          <Link to="/bolimlar" className="btn btn-ghost">Barcha bo‘limlar <Icon name="arrowRight" size={16} /></Link>
        </div>
        <div className="grid g4" style={{ marginTop: 20 }}>
          {GUIDES.map(([id, ic, t, d]) => (
            <Link key={id} to={`/bolimlar/${id}`} className="card row top" data-reveal style={{ gap: 12, padding: 16 }}>
              <span className="stat-icon" style={{ background: 'var(--lapis-soft)', color: 'var(--lapis)' }}><Icon name={ic} size={18} /></span>
              <span><b className="small">{t}</b><span className="xs muted" style={{ display: 'block' }}>{d}</span></span>
            </Link>
          ))}
        </div>
      </section>

      <section className="lp-wrap lp-sec" data-reveal>
        <div className="card pad-lg lp-lawyer">
          <div>
            <span className="eyebrow" style={{ color: 'var(--gold-bright)' }}>Yuristlar uchun</span>
            <h2 className="lp-h2" style={{ color: '#fff' }}>Mijozlar va AI vositalari, obunasiz</h2>
            <p style={{ opacity: .8, marginTop: 8, maxWidth: 560 }}>Profil bepul. Bo‘sh vaqtingizni belgilang, e’lonlarga taklif yuboring, mijoz hujjatlarini AI bilan tahlil qiling. Faqat bajarilgan ishdan 10–15% komissiya.</p>
          </div>
          <Link to="/login?role=lawyer" className="btn btn-gold btn-lg">Yurist sifatida qo‘shilish</Link>
        </div>
      </section>

      <footer className="lp-wrap lp-foot">
        <span>© 2026 Huquqchi AI</span>
        <span>Huquqchi davlat organi emas. AI javoblari yuridik maslahat o‘rnini bosmaydi.</span>
      </footer>
    </div>
  )
}
