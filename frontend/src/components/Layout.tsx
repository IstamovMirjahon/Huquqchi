import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { api, apiMode, envMode, isMock, switchMode } from '../api'
import type { Notification } from '../api/types'
import { useAuth } from '../auth'
import { ago } from '../lib/format'
import { Icon } from './Icon'
import { ThemeToggle } from './ThemeToggle'
import { Avatar, Badge } from './ui'

type Item = { to: string; icon: string; label: string; end?: boolean }
const CLIENT: { label?: string; items: Item[] }[] = [
  { items: [
    { to: '/', icon: 'home', label: 'Bosh sahifa', end: true },
    { to: '/chat', icon: 'sparkles', label: 'AI huquqshunos' },
    { to: '/cases', icon: 'layout', label: 'Ishlarim' },
  ] },
  { label: 'Yuristlar', items: [
    { to: '/lawyers', icon: 'users', label: 'Yurist topish' },
    { to: '/orders', icon: 'briefcase', label: 'Murojaatlarim' },
    { to: '/jobs', icon: 'megaphone', label: 'E’lonlarim' },
  ] },
  { label: 'Hujjatlar', items: [
    { to: '/create', icon: 'filePlus', label: 'Hujjat yaratish' },
    { to: '/documents', icon: 'folder', label: 'Hujjatlarim' },
    { to: '/laws', icon: 'book', label: 'Qonunlar' },
    { to: '/bolimlar', icon: 'list', label: 'Bo‘limlar (qo‘llanma)' },
    { to: '/gov', icon: 'building', label: 'Davlat xizmatlari' },
  ] },
  { label: 'Hisob', items: [
    { to: '/payments', icon: 'receipt', label: 'To‘lovlar' },
    { to: '/profile', icon: 'user', label: 'Profil va tarif' },
  ] },
]
const LAWYER: { label?: string; items: Item[] }[] = [
  { items: [
    { to: '/pro', icon: 'layout', label: 'Boshqaruv paneli', end: true },
    { to: '/pro/jobs', icon: 'megaphone', label: 'Ish e’lonlari' },
    { to: '/orders', icon: 'briefcase', label: 'Buyurtmalar' },
    { to: '/pro/schedule', icon: 'calendar', label: 'Jadval' },
    { to: '/pro/services', icon: 'zap', label: 'Mening xizmatlarim' },
    { to: '/pro/requests', icon: 'send', label: 'Advokat so‘rovlari' },
  ] },
  { label: 'AI vositalari', items: [
    { to: '/pro/ai', icon: 'zap', label: 'AI Pro: ish tahlili' },
    { to: '/chat', icon: 'sparkles', label: 'AI yordamchi' },
    { to: '/documents', icon: 'fileSearch', label: 'Hujjat tahlili' },
    { to: '/create', icon: 'filePlus', label: 'Hujjat tuzish' },
    { to: '/laws', icon: 'book', label: 'Qonunlar' },
    { to: '/pro/gov', icon: 'building', label: 'Davlat xizmatlari' },
  ] },
  { label: 'Hisob', items: [
    { to: '/pro/wallet', icon: 'wallet', label: 'Hamyon' },
    { to: '/pro/profile', icon: 'user', label: 'Profil va tekshiruv' },
  ] },
]
const GUEST: { label?: string; items: Item[] }[] = [
  { items: [
    { to: '/welcome', icon: 'home', label: 'Bosh sahifa' },
    { to: '/bolimlar', icon: 'list', label: 'Bo‘limlar' },
    { to: '/lawyers', icon: 'users', label: 'Yurist topish' },
    { to: '/laws', icon: 'book', label: 'Qonunlar' },
  ] },
]

export function Layout({ wide, children }: { wide?: boolean; children?: ReactNode }) {
  const { me, isLawyer } = useAuth()
  const [open, setOpen] = useState(false)
  const loc = useLocation()
  useEffect(() => setOpen(false), [loc.pathname])
  const nav = !me ? GUEST : isLawyer ? LAWYER : CLIENT
  const fullBleed = loc.pathname.startsWith('/chat')

  return (
    <div className="shell">
      <aside className={`side ${open ? 'open' : ''}`}>
        <Link to={me ? (isLawyer ? '/pro' : '/') : '/welcome'} className="brand">
          <div className="brand-logo"><img src="/logo.png" alt="" /></div>
          <div><b>Huquqchi AI</b><small>{isLawyer ? 'Yurist kabineti' : 'Huquqiy platforma'}</small></div>
        </Link>
        {nav.map((g, i) => (
          <div key={i}>
            {g.label && <div className="side-label">{g.label}</div>}
            {g.items.map((it) => (
              <NavLink key={it.to} to={it.to} end={it.end} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}>
                <Icon name={it.icon} size={19} />{it.label}
              </NavLink>
            ))}
          </div>
        ))}
        <div className="side-foot">
          {me && isLawyer && me.lawyerStatus !== 'verified' && (
            <Link to="/pro/profile" className="banner warn small" style={{ marginBottom: 10 }}>
              <Icon name="shield" size={18} />
              <div>{me.lawyerStatus === 'pending' ? 'Profilingiz tekshiruvda' : 'Profilni tasdiqlating, shunda buyurtma olasiz'}</div>
            </Link>
          )}
          {me && !isLawyer && me.subscription.planCode === 'client_free' && (
            <Link to="/profile#plans" className="card flat" style={{ padding: 14, background: 'linear-gradient(135deg, rgba(247,241,230,.9), rgba(255,255,255,.7))' }}>
              <div className="row" style={{ gap: 8 }}><Icon name="zap" size={17} style={{ color: 'var(--gold)' }} /><b className="small">Plus tarifi</b></div>
              <p className="xs muted" style={{ marginTop: 4 }}>Cheksiz AI savol va 10 ta tahlil, oyiga 49 000 so‘m</p>
            </Link>
          )}
          {!me && <Link to="/login" className="btn btn-primary btn-block">Kirish</Link>}
        </div>
      </aside>
      {open && <div className="scrim" onClick={() => setOpen(false)} />}
      <div className="main">
        <Topbar onMenu={() => setOpen(true)} />
        <main className={fullBleed ? '' : `content ${wide ? 'wide' : ''}`}>{children ?? <Outlet />}</main>
      </div>
      {isMock && <DemoPill />}
      {apiMode === 'hybrid' && <HybridPill />}
    </div>
  )
}

function Topbar({ onMenu }: { onMenu: () => void }) {
  const { me, isLawyer, signOut, refresh } = useAuth()
  const nav = useNavigate()
  const [panel, setPanel] = useState<'none' | 'notif' | 'user'>('none')
  const [notes, setNotes] = useState<Notification[]>([])
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setPanel('none') }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])
  useEffect(() => {
    if (!me) return
    const t = setInterval(() => refresh(), 30_000)
    return () => clearInterval(t)
  }, [me, refresh])

  const openNotif = async () => {
    setPanel(panel === 'notif' ? 'none' : 'notif')
    setNotes((await api.notifications.list()).items)
  }
  const go = async (n: Notification) => {
    setPanel('none')
    if (!n.isRead) { await api.notifications.read(n.id); refresh() }
    if (!n.link) return
    const to = { order: `/orders/${n.link.id}`, job: isLawyer ? `/pro/jobs/${n.link.id}` : `/jobs/${n.link.id}`, document: `/documents/${n.link.id}`, analysis: `/documents/${n.link.id}`, wallet: '/pro/wallet', verification: '/pro/profile', review: '/pro/profile' }[n.link.kind]
    nav(to)
  }

  return (
    <header className="topbar" ref={ref}>
      <button className="icon-btn menu-btn" onClick={onMenu} aria-label="Menyu"><Icon name="menu" /></button>
      <div className="grow" />
      <ThemeToggle />
      {me ? (
        <>
          {!isLawyer && <Link to="/chat" className="btn btn-sm btn-ghost"><Icon name="sparkles" size={16} />AI'ga savol</Link>}
          <div style={{ position: 'relative' }}>
            <button className="icon-btn" onClick={openNotif} aria-label="Bildirishnomalar">
              <Icon name="bell" size={19} />{me.unreadNotifications > 0 && <span className="dot" />}
            </button>
            {panel === 'notif' && (
              <div className="card solid" style={{ position: 'absolute', right: 0, top: 48, width: 360, padding: 8, zIndex: 30 }}>
                <div className="row between" style={{ padding: '8px 10px' }}>
                  <b>Bildirishnomalar</b>
                  <button className="btn-text btn small" onClick={async () => { await api.notifications.readAll(); refresh(); setNotes(notes.map((n) => ({ ...n, isRead: true }))) }}>Barchasini o‘qildi</button>
                </div>
                <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                  {notes.length === 0 && <p className="muted small" style={{ padding: 16 }}>Hozircha bildirishnoma yo‘q</p>}
                  {notes.map((n) => (
                    <button key={n.id} onClick={() => go(n)} className="list-item" style={{ width: '100%', border: 0, background: n.isRead ? 'none' : 'var(--lapis-soft)', borderRadius: 10, padding: 10, textAlign: 'left', cursor: 'pointer', marginBottom: 2 }}>
                      <div className="grow">
                        <div className="small strong">{n.title}</div>
                        <div className="xs muted clamp2">{n.body}</div>
                        <div className="xs faint" style={{ marginTop: 2 }}>{ago(n.createdAt)}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          <div style={{ position: 'relative' }}>
            <button className="row" style={{ border: 0, background: 'none', cursor: 'pointer', gap: 8 }} onClick={() => setPanel(panel === 'user' ? 'none' : 'user')}>
              <Avatar name={me.name} size={36} />
              <div style={{ textAlign: 'left', lineHeight: 1.2 }} className="hide-sm">
                <div className="small strong">{me.name}</div>
                <div className="xs faint">{isLawyer ? 'Yurist' : me.subscription.planName}</div>
              </div>
              <Icon name="chevronDown" size={16} />
            </button>
            {panel === 'user' && (
              <div className="card solid" style={{ position: 'absolute', right: 0, top: 48, width: 240, padding: 8, zIndex: 30 }}>
                <Link className="nav-link" to={isLawyer ? '/pro/profile' : '/profile'} onClick={() => setPanel('none')}><Icon name="user" size={18} />Profil</Link>
                {isLawyer && <Link className="nav-link" to={`/lawyers/${me.lawyerProfileId}`} onClick={() => setPanel('none')}><Icon name="eye" size={18} />Ochiq profilim</Link>}
                <button className="nav-link" style={{ width: '100%', border: 0, background: 'none', cursor: 'pointer' }} onClick={async () => { await signOut(); nav('/welcome') }}><Icon name="logout" size={18} />Chiqish</button>
              </div>
            )}
          </div>
        </>
      ) : (
        <Link to="/login" className="btn btn-primary btn-sm">Kirish</Link>
      )}
    </header>
  )
}

function DemoPill() {
  const [open, setOpen] = useState(false)
  return (
    <div className="demo-pill">
      {open ? (
        <div className="card solid" style={{ width: 300, padding: 16 }}>
          <div className="row between"><b className="small">Demo rejim</b><button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setOpen(false)}><Icon name="x" size={15} /></button></div>
          <p className="xs muted" style={{ margin: '6px 0 10px' }}>Backend ulanmagan. Ma’lumotlar brauzerda saqlanadi. Backend tayyor bo‘lganda <code>VITE_API_URL</code> beriladi.</p>
          <div className="xs" style={{ lineHeight: 1.7 }}>
            Mijoz: <b>+998 90 111 22 33</b><br />Yurist: <b>+998 90 777 88 99</b><br />Kod: istalgan 6 raqam
          </div>
          <button className="btn btn-sm btn-ghost btn-block" style={{ marginTop: 12 }} onClick={async () => { const { resetDb } = await import('../api/mock/db'); resetDb(); localStorage.removeItem('hq-tokens'); location.href = '/login' }}>
            <Icon name="refresh" size={15} />Demo ma’lumotlarni tiklash
          </button>
          {envMode !== 'mock' && <button className="btn btn-sm btn-soft btn-block" style={{ marginTop: 8 }} onClick={() => switchMode(null)}>Real backendga qaytish</button>}
        </div>
      ) : (
        <button onClick={() => setOpen(true)}><Badge tone="ink" icon="info">Demo</Badge></button>
      )}
    </div>
  )
}

function HybridPill() {
  const [open, setOpen] = useState(false)
  return (
    <div className="demo-pill">
      {open ? (
        <div className="card solid" style={{ width: 320, padding: 16 }}>
          <div className="row between"><b className="small">Backend + demo</b><button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => setOpen(false)}><Icon name="x" size={15} /></button></div>
          <p className="xs muted" style={{ margin: '6px 0 8px' }}>Real backendda: kirish, profil, hujjatlar va tahlil, AI chat, qonunlar, shablonlar, loyihalar, fayllar.</p>
          <p className="xs muted">Hali demo ma’lumotda (backend tayyorlayapti): yuristlar, buyurtmalar, to‘lovlar, e’lonlar, ishlar, hamyon, davlat xizmatlari, AI Pro.</p>
        </div>
      ) : (
        <button onClick={() => setOpen(true)}><Badge tone="lapis" icon="info">Backend + demo</Badge></button>
      )}
    </div>
  )
}
