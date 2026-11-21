import { API_MODE, httpApi, tokenStore, type Api } from './http'
import { hybridApi } from './hybrid'
import { mockApi } from './mock/api'

type Mode = 'mock' | 'hybrid' | 'real'
/** Runtime override (login page «Demo rejimda ko‘rish»): localStorage hq-mode. */
const override = (typeof localStorage !== 'undefined' ? localStorage.getItem('hq-mode') : null) as Mode | null
export const envMode: Mode = API_MODE
export const apiMode: Mode = override ?? API_MODE
export const isMock = apiMode === 'mock'
export const api: Api = apiMode === 'real' ? httpApi : apiMode === 'hybrid' ? hybridApi : mockApi

// A demo token left from mock mode must never reach the real backend (and vice versa).
const t = tokenStore.get()
if (t && (t.accessToken.startsWith('mock:') !== isMock)) tokenStore.set(null)

export function switchMode(mode: Mode | null) {
  if (mode && mode !== envMode) localStorage.setItem('hq-mode', mode)
  else localStorage.removeItem('hq-mode')
  tokenStore.set(null)
  location.href = '/login'
}
export { ApiError, tokenStore } from './http'
export type * from './types'
