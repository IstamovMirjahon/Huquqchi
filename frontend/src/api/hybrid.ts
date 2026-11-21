// Hybrid mode: endpoints the backend already serves go to it; the rest stay on the mock until
// the backend ships them (docs/BACKEND_API.md §22). Mock modules run as the real signed-in user.
import { ApiError, httpApi, type Api } from './http'
import { mockApi } from './mock/api'
import { db, save, setBridgedUser, defaultSchedule } from './mock/db'
import * as N from './normalize'
import type * as T from './types'

/** Make the real user exist in the mock store so mock modules (orders, cases…) work for them. */
function bridge(me: T.Me): T.Me {
  setBridgedUser(me.id)
  const d = db()
  let u = d.users.find((x) => x.id === me.id)
  if (!u) {
    u = { id: me.id, name: me.name, phone: me.phone, email: me.email, role: me.role, lawyerStatus: me.lawyerStatus, lawyerProfileId: null, planCode: me.subscription.planCode || (me.role === 'lawyer' ? 'lawyer_free' : 'client_free'), language: me.language, createdAt: me.createdAt }
    d.users.push(u)
  }
  Object.assign(u, { name: me.name, phone: me.phone, role: me.role })
  if (me.role === 'lawyer' && !d.lawyers.some((l) => l.userId === me.id)) {
    const id = `lw-${me.id.slice(0, 8)}`
    d.lawyers.push({ id, userId: me.id, type: 'advocate', headline: '', bio: '', categories: [], region: 'tashkent_city', city: 'Toshkent', languages: ['uz-Latn'], workFormats: ['online'], experienceYears: 0, rating: 0, reviewCount: 0, completedOrders: 0, responseTimeMinutes: 0, isOnline: true, isPromoted: false, education: [], licenseNumber: null, officeAddress: null, status: (me.lawyerStatus as T.LawyerStatus) ?? 'draft', rejectionReason: null, verifiedAt: null, schedule: defaultSchedule(), verificationDocs: [], submittedAt: null, createdAt: me.createdAt, hue: 220 })
    u.lawyerProfileId = id
  }
  save()
  const lawyer = d.lawyers.find((l) => l.userId === me.id)
  return lawyer ? { ...me, lawyerProfileId: me.lawyerProfileId ?? lawyer.id, lawyerStatus: me.lawyerStatus ?? lawyer.status } : me
}

const notReady = (what: string): never => { throw new ApiError({ status: 501, code: 'backend.not_ready', detail: `${what} backendda hali tayyor emas.` }) }
/** Call the backend; on 404/405 (endpoint not shipped yet) use the fallback. */
async function orElse<R>(real: () => Promise<R>, fallback: () => Promise<R>): Promise<R> {
  try { return await real() } catch (e) {
    if (e instanceof ApiError && (e.status === 404 || e.status === 405 || e.status === 501) && !e.code.endsWith('.not_found')) return fallback()
    throw e
  }
}

let templatesCache: T.Template[] | null = null
const templates = async () => (templatesCache ??= await httpApi.templates.list())

export const hybridApi: Api = {
  ...mockApi,
  auth: {
    ...httpApi.auth,
    verify: async (b) => { const r = await httpApi.auth.verify(b); return { ...r, user: bridge(r.user) } },
  },
  me: {
    ...httpApi.me,
    get: async () => bridge(await httpApi.me.get()),
    update: async (b) => bridge(await httpApi.me.update(b)),
  },
  reference: httpApi.reference,
  files: httpApi.files,
  documents: {
    ...httpApi.documents,
    analysis: async (id, analysisId) => orElse(() => httpApi.documents.analysis(id, analysisId), async () => {
      const a = (await httpApi.documents.analyses(id)).find((x) => x.id === analysisId)
      return a ?? notReady('Tahlil')
    }),
  },
  chat: {
    ...httpApi.chat,
    get: async (id) => orElse(() => httpApi.chat.get(id), async () => (await httpApi.chat.list()).find((c) => c.id === id) ?? notReady('Suhbat')),
    rename: async (id, title) => orElse(() => httpApi.chat.rename(id, title), async () => notReady('Suhbatni qayta nomlash')),
    remove: async (id) => orElse(() => httpApi.chat.remove(id), async () => notReady('Suhbatni o‘chirish')),
    detach: async (id, docId) => orElse(() => httpApi.chat.detach(id, docId), async () => notReady('Hujjatni ajratish')),
    feedback: async (id, m, v, r) => orElse(() => httpApi.chat.feedback(id, m, v, r), async () => undefined),
    handoffPreview: async (id) => orElse(() => httpApi.chat.handoffPreview(id), async () => {
      // Built on the client until /handoff-preview ships: first question + lawyers from the catalogue.
      const msgs = await httpApi.chat.messages(id)
      const q = msgs.find((m) => m.role === 'user')?.content ?? ''
      const a = [...msgs].reverse().find((m) => m.role === 'assistant')?.content ?? ''
      const lawyers = await mockApi.lawyers.recommended({})
      const cats = await httpApi.reference.categories()
      return { title: q.slice(0, 80) || 'Huquqiy savol', summary: `Mijoz savoli: «${q}».${a ? ` AI javobi: ${a.slice(0, 260)}…` : ''}`, questions: q ? [q] : [], category: cats.find((c) => c.code === 'other') ?? cats[0] ?? { code: 'other', name: 'Boshqa' }, urgency: 'normal', documents: [], recommendedLawyers: lawyers, suggestedBudget: { min: 100000, max: 300000 } }
    }),
  },
  legal: {
    list: async (q) => { const r = await httpApi.legal.list(q); return r.length ? r : mockApi.legal.list(q) },
    get: async (id) => orElse(() => httpApi.legal.get(id), () => mockApi.legal.get(id)),
    search: async (query, limit) => orElse(() => httpApi.legal.search(query, limit), () => mockApi.legal.search(query, limit)),
  },
  templates: {
    list: async () => { const r = await templates(); return r.length ? r : mockApi.templates.list() },
    get: async (id) => orElse(() => httpApi.templates.get(id), async () => (await templates()).find((t) => t.id === id) ?? mockApi.templates.get(id)),
  },
  drafts: {
    ...httpApi.drafts,
    list: async () => { const t = await templates(); return (await httpApi.drafts.list()).map((d) => N.normDraft(d, t)) },
    create: async (b) => N.normDraft(await httpApi.drafts.create(b), await templates()),
    get: async (id) => orElse(() => httpApi.drafts.get(id), async () => (await hybridApi.drafts.list()).find((d) => d.id === id) ?? notReady('Loyiha')),
    update: async (id, b) => orElse(() => httpApi.drafts.update(id, b), async () => notReady('Loyihani tahrirlash')),
    remove: async (id) => orElse(() => httpApi.drafts.remove(id), async () => notReady('Loyihani o‘chirish')),
    confirm: async (id) => orElse(() => httpApi.drafts.confirm(id), async () => notReady('Loyihani tasdiqlash')),
    export: async (id, format) => orElse(() => httpApi.drafts.export(id, format), async () => {
      const d = await hybridApi.drafts.get(id)
      return new Blob([d.text], { type: 'text/plain;charset=utf-8' })
    }),
  },
}
