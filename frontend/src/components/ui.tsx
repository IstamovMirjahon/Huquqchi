import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { ApiError } from '../api'
import type { OrderStatus } from '../api/types'
import { hueOf, initials, ORDER_STATUS } from '../lib/format'
import { Icon } from './Icon'

// ---- Data loading ---------------------------------------------------------------
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | undefined>()
  const [error, setError] = useState<Error | null>(null)
  const [loading, setLoading] = useState(true)
  const seq = useRef(0)
  const run = useCallback((silent = false) => {
    const id = ++seq.current
    if (!silent) setLoading(true)
    return fn().then(
      (d) => { if (id === seq.current) { setData(d); setError(null) } return d },
      (e) => { if (id === seq.current) setError(e) },
    ).finally(() => { if (id === seq.current) setLoading(false) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)
  useEffect(() => { run() }, [run])
  return { data, error, loading, reload: run, setData }
}

export const errText = (e: unknown) => (e instanceof ApiError ? e.message : e instanceof Error ? e.message : 'Xatolik yuz berdi')

// ---- Toasts ---------------------------------------------------------------------
type Toast = { id: number; text: string; kind: 'info' | 'error' | 'success' }
const ToastCtx = createContext<(text: string, kind?: Toast['kind']) => void>(() => {})
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([])
  const push = useCallback((text: string, kind: Toast['kind'] = 'info') => {
    const id = Date.now() + Math.random()
    setItems((x) => [...x, { id, text, kind }])
    setTimeout(() => setItems((x) => x.filter((t) => t.id !== id)), 3800)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts">{items.map((t) => <div key={t.id} className={`toast ${t.kind}`}>{t.text}</div>)}</div>
    </ToastCtx.Provider>
  )
}
export const useToast = () => useContext(ToastCtx)

/** Runs an async action with a busy flag and an error toast. */
export function useAction() {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const run = useCallback(async <T,>(f: () => Promise<T>, ok?: string): Promise<T | undefined> => {
    setBusy(true)
    try {
      const r = await f()
      if (ok) toast(ok, 'success')
      return r
    } catch (e) {
      toast(errText(e), 'error')
      return undefined
    } finally { setBusy(false) }
  }, [toast])
  return { busy, run }
}

// ---- Primitives -----------------------------------------------------------------
const AVATAR_BG = ['var(--grad-lapis)', 'linear-gradient(135deg, #2b4a7a, var(--navy))', 'var(--grad-gold)', 'var(--grad-teal)']
export function Avatar({ name, size = 40, online }: { name: string; size?: number; online?: boolean; hue?: number }) {
  return (
    <div className="avatar" style={{ width: size, height: size, fontSize: size * 0.36, background: AVATAR_BG[hueOf(name) % AVATAR_BG.length] }}>
      {initials(name)}
      {online && <span className="online" />}
    </div>
  )
}
export function Badge({ tone = '', children, icon }: { tone?: string; children: ReactNode; icon?: string }) {
  return <span className={`badge ${tone}`}>{icon && <Icon name={icon} size={13} stroke={2.2} />}{children}</span>
}
export function StatusBadge({ status }: { status: OrderStatus }) {
  const [label, tone] = ORDER_STATUS[status]
  return <Badge tone={tone}>{label}</Badge>
}
export function Stars({ value, size = 14 }: { value: number; size?: number }) {
  return (
    <span className="stars" aria-label={`${value} / 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width={size} height={size} viewBox="0 0 24 24" fill={i <= Math.round(value) ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="1.6">
          <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
        </svg>
      ))}
    </span>
  )
}
export function Rating({ value, count }: { value: number; count?: number }) {
  return (
    <span className="row" style={{ gap: 5, fontSize: 13.5 }}>
      <Icon name="star" size={15} style={{ color: 'var(--gold-bright)', fill: 'var(--gold-bright)' }} />
      <b>{value.toFixed(1)}</b>{count !== undefined && <span className="faint">({count})</span>}
    </span>
  )
}
export function Verified({ label = 'Tasdiqlangan' }: { label?: string }) {
  return <span className="verified"><Icon name="shieldCheck" size={15} stroke={2} />{label}</span>
}
export function Loading({ label }: { label?: string }) {
  return <div className="page-loading"><div className="row"><span className="spinner" />{label ?? 'Yuklanmoqda…'}</div></div>
}
export function ErrorBox({ error, retry }: { error: unknown; retry?: () => void }) {
  return (
    <div className="banner danger">
      <Icon name="alert" />
      <div className="grow">{errText(error)}</div>
      {retry && <button className="btn btn-sm btn-ghost" onClick={retry}>Qayta urinish</button>}
    </div>
  )
}
export function Empty({ icon = 'inbox', title, text, action }: { icon?: string; title: string; text?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <div className="ico"><Icon name={icon} size={26} /></div>
      <h3>{title}</h3>
      {text && <p className="small" style={{ maxWidth: 380, margin: '0 auto' }}>{text}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}
export function Modal({ open, onClose, title, sub, children, footer, wide }: { open: boolean; onClose: () => void; title: ReactNode; sub?: ReactNode; children: ReactNode; footer?: ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-wrap" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${wide ? 'wide' : ''}`} role="dialog" aria-modal>
        <div className="modal-head">
          <div><h3 className="h2">{title}</h3>{sub && <p className="sub small">{sub}</p>}</div>
          <button className="icon-btn" onClick={onClose} aria-label="Yopish"><Icon name="x" size={18} /></button>
        </div>
        {children}
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  )
}
export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>
}
export function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return <div className="seg">{options.map(([v, l]) => <button key={v} type="button" className={v === value ? 'on' : ''} onClick={() => onChange(v)}>{l}</button>)}</div>
}
export function PageHead({ title, sub, actions, eyebrow }: { title: ReactNode; sub?: ReactNode; actions?: ReactNode; eyebrow?: string }) {
  return (
    <div className="page-head">
      <div>{eyebrow && <div className="eyebrow">{eyebrow}</div>}<h1 className="h1">{title}</h1>{sub && <p className="sub">{sub}</p>}</div>
      {actions && <div className="row wrap">{actions}</div>}
    </div>
  )
}
export function FilePick({ onFile, accept, children, className = 'btn btn-ghost', disabled }: { onFile: (f: File) => void; accept?: string; children: ReactNode; className?: string; disabled?: boolean }) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <>
      <button type="button" className={className} onClick={() => ref.current?.click()} disabled={disabled}>{children}</button>
      <input ref={ref} type="file" hidden accept={accept} onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); e.target.value = '' }} />
    </>
  )
}
export function Stat({ icon, tone, label, value, hint }: { icon: string; tone: string; label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="card stat">
      <div className="label"><span className="stat-icon" style={{ background: `var(--${tone}-soft)`, color: `var(--${tone})` }}><Icon name={icon} size={18} /></span>{label}</div>
      <div className="value mono">{value}</div>
      {hint && <div className="hint">{hint}</div>}
    </div>
  )
}
