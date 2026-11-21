// Real backend client. Every call maps to an endpoint in docs/BACKEND_API.md.
import type * as T from './types'
import * as N from './normalize'

export const API_URL = (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ?? ''
export const API_MODE = ((import.meta.env.VITE_API_MODE as string | undefined) || (API_URL ? 'real' : 'mock')) as 'mock' | 'hybrid' | 'real'

export class ApiError extends Error {
  status: number
  code: string
  problem: T.ProblemDetails
  constructor(p: T.ProblemDetails) {
    super(p.detail || p.title || 'Xatolik yuz berdi')
    this.status = p.status
    this.code = p.code ?? `http.${p.status}`
    this.problem = p
  }
}

// ---- Token storage ------------------------------------------------------------
const TOKENS_KEY = 'hq-tokens'
export interface StoredTokens { accessToken: string; refreshToken: string; accessTokenExpiresAt: string }
export const tokenStore = {
  get(): StoredTokens | null {
    try { return JSON.parse(localStorage.getItem(TOKENS_KEY) || 'null') } catch { return null }
  },
  set(t: StoredTokens | null) {
    if (t) localStorage.setItem(TOKENS_KEY, JSON.stringify(t))
    else localStorage.removeItem(TOKENS_KEY)
  },
}

let refreshing: Promise<boolean> | null = null
async function refreshTokens(): Promise<boolean> {
  const t = tokenStore.get()
  if (!t) return false
  refreshing ??= (async () => {
    try {
      const r = await fetch(`${API_URL}/api/v1/auth/refresh`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: t.refreshToken }),
      })
      if (!r.ok) { tokenStore.set(null); return false }
      const body = N.normAuth(await r.json())
      tokenStore.set({ accessToken: body.accessToken, refreshToken: body.refreshToken, accessTokenExpiresAt: body.accessTokenExpiresAt })
      return true
    } finally { setTimeout(() => (refreshing = null), 0) }
  })()
  return refreshing
}

type Query = Record<string, string | number | boolean | null | undefined | (string | number)[]>
interface ReqOpts { query?: Query; body?: unknown; form?: FormData; headers?: Record<string, string>; signal?: AbortSignal; raw?: boolean }

function qs(q?: Query) {
  if (!q) return ''
  const p = new URLSearchParams()
  for (const [k, v] of Object.entries(q)) {
    if (v === undefined || v === null || v === '') continue
    if (Array.isArray(v)) v.forEach((x) => p.append(k, String(x)))
    else p.set(k, String(v))
  }
  const s = p.toString()
  return s ? `?${s}` : ''
}

async function toError(r: Response): Promise<ApiError> {
  let p: T.ProblemDetails = { status: r.status }
  try { p = { status: r.status, ...(await r.json()) } } catch { /* empty body */ }
  return new ApiError(p)
}

export async function request<R>(method: string, path: string, o: ReqOpts = {}, retried = false): Promise<R> {
  const headers: Record<string, string> = { Accept: 'application/json', 'Accept-Language': 'uz-Latn', ...o.headers }
  const t = tokenStore.get()
  if (t) headers.Authorization = `Bearer ${t.accessToken}`
  let body: BodyInit | undefined
  if (o.form) body = o.form
  else if (o.body !== undefined) { headers['Content-Type'] = 'application/json'; body = JSON.stringify(o.body) }

  let r: Response
  try {
    r = await fetch(`${API_URL}${path}${qs(o.query)}`, { method, headers, body, signal: o.signal })
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e
    throw new ApiError({ status: 0, code: 'network', detail: 'Internetga ulanib bo‘lmadi. Qayta urinib ko‘ring.' })
  }
  if (r.status === 401 && t && !retried && !path.startsWith('/api/v1/auth/')) {
    if (await refreshTokens()) return request<R>(method, path, o, true)
    try { sessionStorage.setItem('hq-logout-reason', `${method} ${path} → 401 (token yaroqsiz yoki muddati tugagan, refresh ham rad etildi)`) } catch { /* ignore */ }
    console.warn('[huquqchi] session ended:', method, path, '401')
    window.dispatchEvent(new Event('hq:logout'))
  }
  if (!r.ok) throw await toError(r)
  if (o.raw) return (await r.blob()) as R
  if (r.status === 204) return undefined as R
  const text = await r.text()
  return (text ? JSON.parse(text) : undefined) as R
}

const get = <R>(p: string, query?: Query) => request<R>('GET', p, { query })
const post = <R>(p: string, body?: unknown, headers?: Record<string, string>) => request<R>('POST', p, { body, headers })
const patch = <R>(p: string, body?: unknown) => request<R>('PATCH', p, { body })
const put = <R>(p: string, body?: unknown) => request<R>('PUT', p, { body })
const del = (p: string) => request<void>('DELETE', p)
const idem = () => ({ 'Idempotency-Key': crypto.randomUUID() })
const upload = <R>(p: string, file: File, extra: Record<string, string> = {}) => {
  const f = new FormData()
  f.append('file', file)
  Object.entries(extra).forEach(([k, v]) => f.append(k, v))
  return request<R>('POST', p, { form: f })
}

// ---- SSE (§4.2) ---------------------------------------------------------------
export interface StreamHandlers { onStatus?: (s: T.ChatStage) => void; onDelta?: (text: string) => void; onUser?: (m: T.Message) => void }

async function streamMessage(conversationId: string, req: T.SendMessageRequest, h: StreamHandlers, signal?: AbortSignal): Promise<T.Message> {
  const go = async (retried: boolean): Promise<T.Message> => {
    const t = tokenStore.get()
    const r = await fetch(`${API_URL}/api/v1/conversations/${conversationId}/messages`, {
      method: 'POST', signal,
      headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream', ...(t ? { Authorization: `Bearer ${t.accessToken}` } : {}) },
      body: JSON.stringify(req),
    })
    if (r.status === 401 && !retried && (await refreshTokens())) return go(true)
    if (!r.ok || !r.body) throw await toError(r)
    // Current backend answers with plain JSON (no SSE yet): accept either.
    if (!(r.headers.get('content-type') ?? '').includes('event-stream')) {
      const text = await r.text()
      const payload: unknown = text ? JSON.parse(text) : null
      // Current POST returns [userMessage, assistantMessage]; the planned API returns one message.
      const messages = (Array.isArray(payload) ? payload : payload ? [payload] : []).map(N.normMsg)
      const user = messages.find((m) => m.role === 'user')
      if (user) h.onUser?.(user)
      const answer = [...messages].reverse().find((m) => m.role === 'assistant')
      if (answer) return answer
      const all = (await request<T.Message[]>('GET', `/api/v1/conversations/${conversationId}/messages`)).map(N.normMsg)
      const last = [...all].reverse().find((m) => m.role === 'assistant')
      if (last && (!user || last.createdAt >= user.createdAt)) return last
      throw new ApiError({ status: 0, code: 'chat.no_answer', detail: 'AI javobi hali kelmadi. Suhbatni birozdan keyin qayta oching.' })
    }
    const reader = r.body.getReader()
    const dec = new TextDecoder()
    let buf = ''
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      buf += dec.decode(value, { stream: true })
      let i: number
      while ((i = buf.indexOf('\n\n')) >= 0) {
        const chunk = buf.slice(0, i)
        buf = buf.slice(i + 2)
        let ev = 'message'
        let data = ''
        for (const line of chunk.split('\n')) {
          if (line.startsWith('event:')) ev = line.slice(6).trim()
          else if (line.startsWith('data:')) data += line.slice(5).trim()
        }
        if (!data) continue
        const payload = JSON.parse(data)
        if (ev === 'status') h.onStatus?.(payload.stage)
        else if (ev === 'delta') h.onDelta?.(payload.text)
        else if (ev === 'user') h.onUser?.(N.normMsg(payload))
        else if (ev === 'final') return N.normMsg(payload)
        else if (ev === 'error') throw new ApiError(payload)
      }
    }
    throw new ApiError({ status: 0, code: 'stream.closed', detail: 'Javob to‘liq kelmadi. Qayta urinib ko‘ring.' })
  }
  return go(false)
}

// ---- Endpoints ----------------------------------------------------------------
export const httpApi = {
  auth: {
    requestCode: (phone: string) => post<T.CodeRequestResult>('/api/v1/auth/request-code', { phone, channel: 'telegram' }),
    verify: async (b: T.VerifyRequest) => N.normAuth(await post<T.AuthTokens>('/api/v1/auth/verify', { workspaceKind: 'Personal', acceptTerms: false, ...b })),
    logout: (refreshToken: string) => post<void>('/api/v1/auth/logout', { refreshToken }),
    sessions: () => get<T.Session[]>('/api/v1/auth/sessions'),
    // requestCode returns the backend's codeSent flag too; extra fields are ignored by the UI.
    revokeSession: (id: string) => del(`/api/v1/auth/sessions/${id}`),
    logoutAll: () => post<void>('/api/v1/auth/logout-all'),
  },
  me: {
    get: async () => N.normMe(await get<T.Me>('/api/v1/me')),
    update: async (b: Partial<Pick<T.Me, 'name' | 'email' | 'language'>>) => N.normMe(await patch<T.Me>('/api/v1/me', b)),
    deleteAccount: (reason?: string) => request<void>('DELETE', '/api/v1/me', { body: { confirm: 'O‘CHIRISH', reason } }),
  },
  reference: {
    categories: () => get<T.Category[]>('/api/v1/reference/categories'),
    regions: () => get<T.Region[]>('/api/v1/reference/regions'),
  },
  files: {
    upload: (file: File, purpose: string) => upload<T.FileRef>('/api/v1/files', file, { purpose }),
  },
  chat: {
    list: async (search?: string) => (await get<T.Conversation[]>('/api/v1/conversations', { search })).map(N.normConv)
      .filter((c) => !search || c.title.toLowerCase().includes(search.toLowerCase())),
    create: async (title: string, mode: 'client' | 'professional' = 'client') => N.normConv(await post<T.Conversation>('/api/v1/conversations', { title, mode })),
    get: async (id: string) => N.normConv(await get<T.Conversation>(`/api/v1/conversations/${id}`)),
    rename: async (id: string, title: string) => N.normConv(await patch<T.Conversation>(`/api/v1/conversations/${id}`, { title })),
    remove: (id: string) => del(`/api/v1/conversations/${id}`),
    messages: async (id: string) => (await get<T.Message[]>(`/api/v1/conversations/${id}/messages`)).map(N.normMsg),
    send: streamMessage,
    feedback: (id: string, messageId: string, value: 'up' | 'down', reason?: string) =>
      post<void>(`/api/v1/conversations/${id}/messages/${messageId}/feedback`, { value, reason }),
    attach: (id: string, documentId: string) => post<void>(`/api/v1/conversations/${id}/documents/${documentId}`),
    detach: (id: string, documentId: string) => del(`/api/v1/conversations/${id}/documents/${documentId}`),
    handoffPreview: (id: string) => post<T.HandoffPreview>(`/api/v1/conversations/${id}/handoff-preview`, {}),
  },
  documents: {
    list: async (q: { search?: string; origin?: T.DocumentOrigin } = {}) => (await get<T.DocumentItem[]>('/api/v1/documents', q)).map(N.normDoc),
    get: async (id: string) => N.normDoc(await get<T.DocumentItem>(`/api/v1/documents/${id}`)),
    upload: async (file: File, origin: T.DocumentOrigin = 'Uploaded') => N.normDoc(await upload<T.DocumentItem>('/api/v1/documents', file, { origin })),
    update: (id: string, b: { name: string; tags: string[] }) => patch<void>(`/api/v1/documents/${id}`, { name: b.name, tags: b.tags.join(',') }),
    remove: (id: string) => del(`/api/v1/documents/${id}`),
    download: (id: string) => request<Blob>('GET', `/api/v1/documents/${id}/download`, { raw: true }),
    analyses: async (id: string) => (await get<T.Analysis[]>(`/api/v1/documents/${id}/analyses`)).map((a) => N.normAnalysis(a, id)),
    analysis: async (id: string, analysisId: string) => N.normAnalysis(await get<T.Analysis>(`/api/v1/documents/${id}/analyses/${analysisId}`), id),
    analyze: async (id: string, b: { purpose: string; userRole?: string | null }) => N.normAnalysis(await post<T.Analysis>(`/api/v1/documents/${id}/analyses`, b), id),
  },
  legal: {
    list: async (q: { query?: string; type?: string; status?: string } = {}) => (await get<T.LegalListItem[]>('/api/v1/legal-documents', q)).map(N.normLegalItem),
    get: async (id: string) => N.normLegalDetails(await get<T.LegalDocumentDetails>(`/api/v1/legal-documents/${id}`)),
    search: (query: string, limit = 10) => post<T.LegalSearchHit[]>('/api/v1/legal/search', { query, limit }),
  },
  templates: {
    list: async () => (await get<T.Template[]>('/api/v1/templates')).map(N.normTemplate),
    get: async (id: string) => N.normTemplate(await get<T.Template>(`/api/v1/templates/${id}`)),
  },
  drafts: {
    list: async () => (await get<T.Draft[]>('/api/v1/drafts')).map((d) => N.normDraft(d)),
    get: async (id: string) => N.normDraft(await get<T.Draft>(`/api/v1/drafts/${id}`)),
    create: async (b: { templateId: string; name: string; fields: Record<string, string | null> }) => N.normDraft(await post<T.Draft>('/api/v1/drafts', b)),
    update: async (id: string, b: { name?: string; fields?: Record<string, string | null>; text?: string }) => N.normDraft(await patch<T.Draft>(`/api/v1/drafts/${id}`, b)),
    remove: (id: string) => del(`/api/v1/drafts/${id}`),
    confirm: (id: string) => post<T.Draft>(`/api/v1/drafts/${id}/confirm`),
    export: (id: string, format: 'docx' | 'pdf') => request<Blob>('GET', `/api/v1/drafts/${id}/export`, { query: { format }, raw: true }),
  },
  lawyers: {
    list: (q: Query) => get<T.Paged<T.LawyerCard>>('/api/v1/lawyers', q),
    get: (id: string) => get<T.LawyerProfile>(`/api/v1/lawyers/${id}`),
    slots: (id: string, q: { from: string; to: string; serviceId?: string }) => get<T.SlotsResponse>(`/api/v1/lawyers/${id}/slots`, q),
    reviews: (id: string, page = 1) => get<T.Paged<T.Review>>(`/api/v1/lawyers/${id}/reviews`, { page }),
    recommended: (q: { conversationId?: string; category?: string }) => get<T.LawyerCard[]>('/api/v1/lawyers/recommended', q),
  },
  lawyer: {
    profile: () => get<T.OwnLawyerProfile>('/api/v1/lawyer/profile'),
    updateProfile: (b: T.LawyerProfileInput) => patch<T.OwnLawyerProfile>('/api/v1/lawyer/profile', b),
    verification: () => get<T.Verification>('/api/v1/lawyer/verification'),
    addVerificationDoc: (kind: T.VerificationKind, fileId: string) => post<unknown>('/api/v1/lawyer/verification/documents', { kind, fileId }),
    submitVerification: () => post<T.Verification>('/api/v1/lawyer/verification/submit'),
    dashboard: () => get<T.LawyerDashboard>('/api/v1/lawyer/dashboard'),
    services: () => get<T.Service[]>('/api/v1/lawyer/services'),
    createService: (b: T.ServiceInput) => post<T.Service>('/api/v1/lawyer/services', b),
    updateService: (id: string, b: Partial<T.ServiceInput>) => patch<T.Service>(`/api/v1/lawyer/services/${id}`, b),
    deleteService: (id: string) => del(`/api/v1/lawyer/services/${id}`),
    schedule: () => get<T.Schedule>('/api/v1/lawyer/schedule'),
    saveSchedule: (b: T.Schedule) => put<T.Schedule>('/api/v1/lawyer/schedule', b),
    calendar: (from: string, to: string) => get<{ days: T.CalendarDay[] }>('/api/v1/lawyer/schedule/calendar', { from, to }),
    jobs: (q: Query) => get<T.Paged<T.Job>>('/api/v1/lawyer/jobs', q),
    job: (id: string) => get<T.Job>(`/api/v1/lawyer/jobs/${id}`),
    sendOffer: (jobId: string, b: { price: number; deliveryDays: number; message: string }) => post<T.Offer>(`/api/v1/lawyer/jobs/${jobId}/offers`, b),
    withdrawOffer: (id: string) => post<T.Offer>(`/api/v1/lawyer/offers/${id}/withdraw`),
    offers: () => get<T.Offer[]>('/api/v1/lawyer/offers'),
    aiDraft: (orderId: string) => post<{ text: string; citations: T.Citation[]; confidence: T.Confidence; warnings: string[] }>(`/api/v1/lawyer/orders/${orderId}/ai-draft`),
    reviews: () => get<T.Paged<T.Review>>('/api/v1/lawyer/reviews'),
  },
  jobs: {
    create: (b: T.JobInput) => post<T.Job>('/api/v1/jobs', b),
    mine: () => get<T.Paged<T.Job>>('/api/v1/jobs/mine'),
    get: (id: string) => get<T.Job>(`/api/v1/jobs/${id}`),
    close: (id: string) => post<T.Job>(`/api/v1/jobs/${id}/close`),
    offers: (id: string) => get<T.Offer[]>(`/api/v1/jobs/${id}/offers`),
    acceptOffer: (id: string, offerId: string) => post<T.Order>(`/api/v1/jobs/${id}/offers/${offerId}/accept`, undefined, idem()),
    rejectOffer: (id: string, offerId: string) => post<T.Offer>(`/api/v1/jobs/${id}/offers/${offerId}/reject`),
  },
  orders: {
    create: (b: T.CreateOrderRequest) => post<T.Order>('/api/v1/orders', b, idem()),
    list: (q: { group?: 'active' | 'completed' | 'cancelled'; search?: string; page?: number }) => get<T.Paged<T.OrderListItem>>('/api/v1/orders', q),
    get: (id: string) => get<T.Order>(`/api/v1/orders/${id}`),
    events: (id: string) => get<T.OrderEvent[]>(`/api/v1/orders/${id}/events`),
    action: (id: string, action: 'accept' | 'decline' | 'deliver' | 'request-revision' | 'complete' | 'dispute' | 'no-show', body?: unknown) =>
      post<T.Order>(`/api/v1/orders/${id}/${action}`, body),
    cancelPreview: (id: string) => get<{ refundAmount: number; policy: string }>(`/api/v1/orders/${id}/cancel-preview`),
    cancel: (id: string, reason: string) => post<{ order: T.Order; refundAmount: number }>(`/api/v1/orders/${id}/cancel`, { reason }),
    meeting: (id: string) => get<{ url: string; token: string; expiresAt: string }>(`/api/v1/orders/${id}/meeting`),
    messages: (id: string, after?: string) => get<T.OrderMessage[]>(`/api/v1/orders/${id}/messages`, { after, limit: 100 }),
    send: (id: string, b: { text: string; fileIds: string[] }) => post<T.OrderMessage>(`/api/v1/orders/${id}/messages`, b),
    read: (id: string, lastMessageId: string) => post<void>(`/api/v1/orders/${id}/messages/read`, { lastMessageId }),
    sharedConversation: (id: string) => get<T.Message[]>(`/api/v1/orders/${id}/shared/conversation`),
    review: (id: string, b: { rating: number; text: string }) => post<T.Review>(`/api/v1/orders/${id}/review`, b),
  },
  reviews: {
    reply: (id: string, text: string) => post<T.Review>(`/api/v1/reviews/${id}/reply`, { text }),
  },
  payments: {
    create: (b: T.CreatePaymentRequest) => post<T.Payment>('/api/v1/payments', b, idem()),
    get: (id: string) => get<T.Payment>(`/api/v1/payments/${id}`),
    list: () => get<T.Paged<T.Payment>>('/api/v1/payments'),
  },
  wallet: {
    get: () => get<T.Wallet>('/api/v1/wallet'),
    transactions: () => get<T.Paged<T.WalletTransaction>>('/api/v1/wallet/transactions'),
    methods: () => get<T.PayoutMethod[]>('/api/v1/wallet/payout-methods'),
    addMethod: (b: { type: 'card'; cardNumber: string; holderName: string }) => post<T.PayoutMethod>('/api/v1/wallet/payout-methods', b),
    removeMethod: (id: string) => del(`/api/v1/wallet/payout-methods/${id}`),
    payouts: () => get<T.Paged<T.Payout>>('/api/v1/wallet/payouts'),
    requestPayout: (b: { amount: number; payoutMethodId: string }) => post<T.Payout>('/api/v1/wallet/payouts', b, idem()),
  },
  plans: {
    list: (audience: 'client' | 'lawyer') => get<T.Plan[]>('/api/v1/plans', { audience }),
    subscribe: (b: { planCode: string; period: 'month' | 'year'; provider: T.PaymentProvider; returnUrl: string }) =>
      post<T.Payment>('/api/v1/me/subscription', b),
    cancel: () => post<void>('/api/v1/me/subscription/cancel'),
  },
  cases: {
    list: (status?: T.CaseStatus) => get<T.CaseListItem[]>('/api/v1/cases', { status }),
    create: (b: T.CaseInput) => post<T.Case>('/api/v1/cases', b),
    get: (id: string) => get<T.Case>(`/api/v1/cases/${id}`),
    update: (id: string, b: { title?: string; status?: T.CaseStatus; amounts?: Partial<T.Case['amounts']> }) => patch<T.Case>(`/api/v1/cases/${id}`, b),
    updateStep: (id: string, stepId: string, b: { status?: T.CaseStepStatus; result?: string | null; dueAt?: string | null }) => patch<T.Case>(`/api/v1/cases/${id}/steps/${stepId}`, b),
    addStep: (id: string, b: { title: string; description?: string }) => post<T.Case>(`/api/v1/cases/${id}/steps`, b),
    addDeadline: (id: string, b: { title: string; date: string; kind: T.CaseDeadline['kind']; note?: string }) => post<T.Case>(`/api/v1/cases/${id}/deadlines`, b),
    updateDeadline: (id: string, deadlineId: string, b: { done: boolean }) => patch<T.Case>(`/api/v1/cases/${id}/deadlines/${deadlineId}`, b),
    link: (id: string, b: { kind: 'document' | 'conversation' | 'draft' | 'order'; refId: string; stepId?: string }) => post<T.Case>(`/api/v1/cases/${id}/links`, b),
    calculate: (id: string, b: { calculator: T.CalculatorCode; inputs: Record<string, number>; stepId?: string }) => post<T.CalcResult>(`/api/v1/cases/${id}/calculate`, b),
    replan: (id: string) => post<T.Case>(`/api/v1/cases/${id}/replan`),
  },
  pro: {
    bundleAnalysis: async (b: { documentIds: string[]; question: string; orderId?: string }) => {
      let r = await post<T.BundleAnalysis>('/api/v1/lawyer/ai/bundle-analysis', b)
      for (let i = 0; r.status === 'processing' && i < 60; i++) { await new Promise((x) => setTimeout(x, 2000)); r = await get<T.BundleAnalysis>(`/api/v1/lawyer/ai/bundle-analysis/${r.id}`) }
      return r
    },
    position: (b: { orderId?: string; caseId?: string; text?: string; clientRole: string }) => post<T.LegalPosition>('/api/v1/lawyer/ai/position', b),
    requests: () => get<T.AdvocateRequest[]>('/api/v1/lawyer/requests'),
    createRequest: (b: { recipient: { name: string; address?: string | null }; subject: string; questions: string[]; orderId?: string | null }) => post<T.AdvocateRequest>('/api/v1/lawyer/requests', b),
    requestDraft: (id: string) => post<T.AdvocateRequest>(`/api/v1/lawyer/requests/${id}/ai-draft`),
    updateRequest: (id: string, b: Partial<Pick<T.AdvocateRequest, 'text' | 'status' | 'sentAt' | 'dueAt'>>) => patch<T.AdvocateRequest>(`/api/v1/lawyer/requests/${id}`, b),
    deleteRequest: (id: string) => del(`/api/v1/lawyer/requests/${id}`),
  },
  integrations: {
    list: () => get<T.Integration[]>('/api/v1/integrations'),
    filings: () => get<T.Filing[]>('/api/v1/filings'),
    createFiling: (b: { portal: string; documentId?: string; draftId?: string; orderId?: string; caseId?: string; claimAmount?: number }) => post<T.Filing>('/api/v1/filings', b),
    updateFiling: (id: string, b: { status?: T.Filing['status']; externalRef?: string; submittedAt?: string; checklist?: T.Filing['package']['checklist'] }) => patch<T.Filing>(`/api/v1/filings/${id}`, b),
  },
  notifications: {
    list: () => get<T.Paged<T.Notification>>('/api/v1/notifications'),
    read: (id: string) => post<void>(`/api/v1/notifications/${id}/read`),
    readAll: () => post<void>('/api/v1/notifications/read-all'),
  },
}

export type Api = typeof httpApi
