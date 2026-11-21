import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { api, tokenStore } from './api'
import type { Me, VerifyRequest } from './api/types'
import { Loading } from './components/ui'

interface AuthState {
  me: Me | null
  ready: boolean
  isLawyer: boolean
  signIn: (b: VerifyRequest) => Promise<Me>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}
const Ctx = createContext<AuthState>(null as unknown as AuthState)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [me, setMe] = useState<Me | null>(null)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    if (!tokenStore.get()) { setMe(null); return }
    try { setMe(await api.me.get()) } catch { tokenStore.set(null); setMe(null) }
  }, [])

  useEffect(() => { refresh().finally(() => setReady(true)) }, [refresh])
  useEffect(() => {
    const out = () => { tokenStore.set(null); setMe(null) }
    window.addEventListener('hq:logout', out)
    return () => window.removeEventListener('hq:logout', out)
  }, [])

  const signIn = useCallback(async (b: VerifyRequest) => {
    const r = await api.auth.verify(b)
    tokenStore.set({ accessToken: r.accessToken, refreshToken: r.refreshToken, accessTokenExpiresAt: r.accessTokenExpiresAt })
    setMe(r.user)
    return r.user
  }, [])

  const signOut = useCallback(async () => {
    const t = tokenStore.get()
    if (t) await api.auth.logout(t.refreshToken).catch(() => {})
    tokenStore.set(null)
    setMe(null)
  }, [])

  return <Ctx.Provider value={{ me, ready, isLawyer: me?.role === 'lawyer', signIn, signOut, refresh }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)

export function RequireAuth({ children, role }: { children: ReactNode; role?: 'lawyer' | 'client' }) {
  const { me, ready } = useAuth()
  const loc = useLocation()
  if (!ready) return <Loading />
  if (!me) return <Navigate to={`/login?next=${encodeURIComponent(loc.pathname + loc.search)}`} replace />
  if (role === 'lawyer' && me.role !== 'lawyer') return <Navigate to="/" replace />
  if (role === 'client' && me.role === 'lawyer') return <Navigate to="/pro" replace />
  return <>{children}</>
}
