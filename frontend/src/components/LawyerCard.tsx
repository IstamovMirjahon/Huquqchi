import { Link } from 'react-router-dom'
import type { LawyerCard as LC } from '../api/types'
import { LAWYER_TYPE, money, time, date, todayTashkent } from '../lib/format'
import { Icon } from './Icon'
import { Avatar, Badge, Rating, Verified } from './ui'

export function nextLabel(iso: string | null) {
  if (!iso) return null
  const d = new Date(Date.parse(iso) + 5 * 3600_000).toISOString().slice(0, 10)
  const t = todayTashkent()
  const tomorrow = new Date(Date.parse(`${t}T00:00:00Z`) + 86400_000).toISOString().slice(0, 10)
  return `${d === t ? 'Bugun' : d === tomorrow ? 'Ertaga' : date(iso)}, ${time(iso)}`
}

export function LawyerCardView({ l, compact, action }: { l: LC; compact?: boolean; action?: React.ReactNode }) {
  return (
    <div className="card" style={{ padding: compact ? 16 : 20 }}>
      <div className="row top" style={{ gap: 14 }}>
        <Link to={`/lawyers/${l.id}`}><Avatar name={l.name} size={compact ? 48 : 60} online={l.isOnline} /></Link>
        <div className="grow">
          <div className="row wrap" style={{ gap: 8 }}>
            <Link to={`/lawyers/${l.id}`} className="h3">{l.name}</Link>
            {l.isVerified && <Verified label={LAWYER_TYPE[l.type]} />}
            {l.isPromoted && <Badge tone="gold">Reklama</Badge>}
          </div>
          <p className="small muted clamp2" style={{ marginTop: 2 }}>{l.headline}</p>
          <div className="row wrap small" style={{ gap: 14, marginTop: 8, color: 'var(--ink-2)' }}>
            <Rating value={l.rating} count={l.reviewCount} />
            <span className="row" style={{ gap: 5 }}><Icon name="briefcase" size={15} />{l.experienceYears} yil</span>
            <span className="row" style={{ gap: 5 }}><Icon name="mapPin" size={15} />{l.city}</span>
            {!compact && <span className="row" style={{ gap: 5 }}><Icon name="clock" size={15} />~{l.responseTimeMinutes < 60 ? `${l.responseTimeMinutes} daq` : `${Math.round(l.responseTimeMinutes / 60)} soat`} ichida javob</span>}
          </div>
          {!compact && (
            <div className="row wrap" style={{ gap: 6, marginTop: 10 }}>
              {l.categories.slice(0, 3).map((c) => <Badge key={c.code} tone="lapis">{c.name}</Badge>)}
            </div>
          )}
        </div>
        <div style={{ textAlign: 'right', minWidth: 120 }}>
          <div className="xs faint">dan</div>
          <div className="strong" style={{ fontSize: 17 }}>{money(l.priceFrom)}</div>
          {l.nextAvailableAt && <div className="xs" style={{ color: 'var(--success)', marginTop: 4, fontWeight: 600 }}>{nextLabel(l.nextAvailableAt)}</div>}
        </div>
      </div>
      {(action || !compact) && (
        <div className="row" style={{ justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
          {action ?? <Link to={`/lawyers/${l.id}`} className="btn btn-sm btn-primary">Profil va bron <Icon name="arrowRight" size={15} /></Link>}
        </div>
      )}
    </div>
  )
}
