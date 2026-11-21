import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../auth'
import { ThemeToggle } from './ThemeToggle'

/** Header for public pages (hero, Bo‘limlar). One menu everywhere; the logo always leads home. */
export function PublicNav() {
  const { me } = useAuth()
  const home = me ? (me.role === 'lawyer' ? '/pro' : '/') : '/'
  return (
    <header className="lp-nav">
      <div className="lp-wrap lp-nav-bar card">
        <Link to={home} className="row" style={{ gap: 10 }}>
          <span className="brand-logo"><img src="/logo.png" alt="" /></span><b style={{ fontSize: 17 }}>Huquqchi AI</b>
        </Link>
        <nav className="lp-links">
          <NavLink to={home} end>Bosh sahifa</NavLink>
          <NavLink to="/bolimlar">Bo‘limlar</NavLink>
          <NavLink to="/lawyers">Yuristlar</NavLink>
          <NavLink to="/laws">Qonunlar</NavLink>
        </nav>
        <ThemeToggle />
        {me ? <Link to={home} className="btn btn-primary btn-sm">Kabinetga</Link> : <Link to="/login" className="btn btn-primary btn-sm">Kirish</Link>}
      </div>
    </header>
  )
}
