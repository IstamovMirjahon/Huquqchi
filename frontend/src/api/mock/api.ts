// Mock backend: implements the same `Api` surface as http.ts against localStorage.
// Business rules mirror docs/PLATFORMA.md §5–§6 so the UI behaves like the real thing.
import type { Api, StreamHandlers } from '../http'
import { ApiError, tokenStore } from '../http'
import type * as T from '../types'
import constitution from './constitution.json'
import {
  addH, cat, db, defaultSchedule, DRAFT_BODIES, mockUserId, now, nextNumber, save, TEMPLATES, uid,
  type DbJob, type DbLawyer, type DbOffer, type DbOrder, type DbUser,
} from './db'
import { CATEGORIES, PLANS, REGIONS, reg } from './seed'
import { mockCases, seedCases } from './cases'
import { mockIntegrations, mockPro } from './pro'

seedCases()
save()

const wait = (ms = 220) => new Promise((r) => setTimeout(r, ms + Math.random() * 120))
const fail = (status: number, code: string, detail: string): never => { throw new ApiError({ status, code, detail }) }

// ---- Session --------------------------------------------------------------------
function currentUserId(): string | null {
  return mockUserId(tokenStore.get()?.accessToken)
}
function me(): DbUser {
  const id = currentUserId()
  const u = id && db().users.find((x) => x.id === id)
  if (!u) fail(401, 'auth.unauthorized', 'Qayta kiring.')
  return u as DbUser
}
function myLawyer(): DbLawyer {
  const u = me()
  const l = db().lawyers.find((x) => x.userId === u.id)
  if (!l) fail(403, 'auth.forbidden_role', 'Faqat yuristlar uchun.')
  return l as DbLawyer
}
const userById = (id: string) => db().users.find((u) => u.id === id)!
const lawyerById = (id: string) => db().lawyers.find((l) => l.id === id)

function usageFor(u: DbUser): T.Usage[] {
  const plan = PLANS.find((p) => p.code === u.planCode) ?? PLANS[0]
  const tomorrow = new Date(); tomorrow.setHours(24, 0, 0, 0)
  const nextMonth = new Date(); nextMonth.setMonth(nextMonth.getMonth() + 1, 1); nextMonth.setHours(0, 0, 0, 0)
  return Object.entries(plan.limits).map(([metric, l]) => ({
    metric, used: db().usage[`${u.id}:${metric}`] ?? 0, limit: l.limit, period: l.period,
    resetsAt: (l.period === 'day' ? tomorrow : nextMonth).toISOString(),
  }))
}
function consume(metric: string) {
  const u = me()
  const usage = usageFor(u).find((x) => x.metric === metric)
  if (usage && usage.limit !== null && usage.used >= usage.limit) {
    throw new ApiError({ status: 402, code: `limits.${metric}_exceeded`, detail: metric === 'ai_questions' ? `Bugungi ${usage.limit} ta bepul savol tugadi. Ertaga tiklanadi yoki Plus tarifiga o‘ting.` : 'Tarif limiti tugadi. Plus tarifiga o‘ting.', resetsAt: usage.resetsAt, upgradePlanCode: 'client_plus' })
  }
  db().usage[`${u.id}:${metric}`] = (db().usage[`${u.id}:${metric}`] ?? 0) + 1
}

function toMe(u: DbUser): T.Me {
  const plan = PLANS.find((p) => p.code === u.planCode) ?? PLANS[0]
  return {
    id: u.id, name: u.name, phone: u.phone, email: u.email, avatarUrl: null, language: u.language, role: u.role,
    lawyerStatus: u.role === 'lawyer' ? (db().lawyers.find((l) => l.userId === u.id)?.status ?? 'draft') : null,
    lawyerProfileId: u.lawyerProfileId, workspace: { id: `ws-${u.id}`, name: 'Shaxsiy', kind: 'Personal' },
    subscription: { planCode: plan.code, planName: plan.name, status: 'active', currentPeriodEnd: plan.prices[0].amount ? addH(24 * 30) : null, cancelAtPeriodEnd: false },
    usage: usageFor(u), unreadNotifications: db().notifications.filter((n) => n.userId === u.id && !n.isRead).length, createdAt: u.createdAt,
  }
}

function notify(userId: string, type: string, title: string, body: string, link: T.Notification['link']) {
  db().notifications.unshift({ id: uid('n'), userId, type, title, body, link, isRead: false, createdAt: now() })
}

// ---- Mappers --------------------------------------------------------------------
function minPrice(lawyerId: string) {
  const s = db().services.filter((x) => x.lawyerId === lawyerId && x.isActive)
  return s.length ? Math.min(...s.map((x) => x.price)) : 0
}
function toCard(l: DbLawyer): T.LawyerCard {
  const u = userById(l.userId)
  return {
    id: l.id, userId: l.userId, name: u.name, avatarUrl: null, type: l.type, headline: l.headline, isVerified: l.status === 'verified',
    categories: [...l.categories].sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary)).map((c) => cat(c.code)),
    region: reg(l.region), city: l.city, languages: l.languages, workFormats: l.workFormats, experienceYears: l.experienceYears,
    rating: l.rating, reviewCount: l.reviewCount, completedOrders: l.completedOrders, responseTimeMinutes: l.responseTimeMinutes,
    priceFrom: minPrice(l.id), nextAvailableAt: nextSlot(l), isOnline: l.isOnline, isPromoted: l.isPromoted,
  }
}
function toService(s: (typeof db extends () => infer D ? D : never)['services'][number]): T.Service {
  return { ...s, category: cat(s.category) }
}
function reviewsOf(lawyerId: string): T.Review[] {
  return db().reviews.filter((r) => r.lawyerId === lawyerId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((r) => ({
    id: r.id, orderId: r.orderId ?? '', rating: r.rating, text: r.text, client: { name: r.clientName, avatarUrl: null },
    serviceTitle: r.serviceTitle, lawyerReply: r.reply ? { text: r.reply, createdAt: r.createdAt } : null, createdAt: r.createdAt,
  }))
}
function toProfile(l: DbLawyer): T.LawyerProfile {
  const rv = db().reviews.filter((r) => r.lawyerId === l.id)
  const total = l.reviewCount
  const seedShare = (n: number) => Math.round(total * n)
  return {
    ...toCard(l), bio: l.bio, education: l.education, licenseNumber: l.licenseNumber ? `•••${l.licenseNumber.slice(-4)}` : null,
    verifiedAt: l.verifiedAt, officeAddress: l.officeAddress,
    services: db().services.filter((s) => s.lawyerId === l.id && s.isActive).map(toService),
    ratingBreakdown: rv.length ? { '5': seedShare(0.82), '4': seedShare(0.13), '3': seedShare(0.04), '2': seedShare(0.01), '1': 0 } : { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 },
    memberSince: l.createdAt,
  }
}

// ---- Slots (§8.4) ---------------------------------------------------------------
const TZ_OFFSET_H = 5
function tashkentDate(d: Date) { return new Date(d.getTime() + TZ_OFFSET_H * 3600_000).toISOString().slice(0, 10) }
function slotsFor(l: DbLawyer, from: string, to: string, duration: number): T.SlotsResponse {
  const s = l.schedule
  const busy = db().orders.filter((o) => o.lawyerId === l.id && o.consultation && !['cancelled', 'declined', 'expired', 'refunded'].includes(o.status))
    .map((o) => [Date.parse(o.consultation!.start), Date.parse(o.consultation!.end)] as const)
  const minStart = Date.now() + s.minNoticeHours * 3600_000
  const days: T.SlotsResponse['days'] = []
  for (let d = new Date(`${from}T00:00:00Z`); tashkentDate(d) <= to && days.length < 31; d = new Date(d.getTime() + 86400_000)) {
    const date = d.toISOString().slice(0, 10)
    const weekday = ((d.getUTCDay() + 6) % 7) + 1
    const ex = s.exceptions.find((e) => e.date === date)
    const intervals = ex ? (ex.isAvailable ? ex.intervals : []) : (s.weekly.find((w) => w.weekday === weekday)?.intervals ?? [])
    const slots: T.Slot[] = []
    if (s.isAcceptingBookings) {
      for (const iv of intervals) {
        const [sh, sm] = iv.start.split(':').map(Number)
        const [eh, em] = iv.end.split(':').map(Number)
        let t = Date.parse(`${date}T00:00:00Z`) + ((sh - TZ_OFFSET_H) * 60 + sm) * 60_000
        const end = Date.parse(`${date}T00:00:00Z`) + ((eh - TZ_OFFSET_H) * 60 + em) * 60_000
        while (t + duration * 60_000 <= end) {
          const e = t + duration * 60_000
          if (t >= minStart && !busy.some(([bs, be]) => t < be && e > bs)) slots.push({ start: new Date(t).toISOString(), end: new Date(e).toISOString() })
          t += (s.slotMinutes + s.bufferMinutes) * 60_000
        }
      }
    }
    days.push({ date, slots })
  }
  return { timezone: s.timezone, days }
}
function nextSlot(l: DbLawyer): string | null {
  const today = tashkentDate(new Date())
  const to = tashkentDate(new Date(Date.now() + 7 * 86400_000))
  for (const d of slotsFor(l, today, to, l.schedule.slotMinutes).days) if (d.slots.length) return d.slots[0].start
  return null
}

// ---- Orders (§11) ---------------------------------------------------------------
const ACTIVE: T.OrderStatus[] = ['pending_payment', 'awaiting_acceptance', 'scheduled', 'in_progress', 'delivered', 'revision_requested', 'disputed']
function allowedActions(o: DbOrder, asLawyer: boolean): T.OrderAction[] {
  const a: T.OrderAction[] = []
  const meetingOpen = o.consultation && Date.now() >= Date.parse(o.consultation.start) - 10 * 60_000 && Date.now() <= Date.parse(o.consultation.end) + 30 * 60_000
  const hasReview = db().reviews.some((r) => r.orderId === o.id)
  switch (o.status) {
    case 'pending_payment': if (!asLawyer) a.push('pay', 'cancel'); break
    case 'awaiting_acceptance': a.push(...(asLawyer ? (['accept', 'decline'] as const) : (['cancel'] as const))); break
    case 'scheduled': a.push('cancel'); if (meetingOpen) a.push('join_meeting'); if (asLawyer && meetingOpen) a.push('deliver'); break
    case 'in_progress': a.push(...(asLawyer ? (['deliver', 'cancel'] as const) : (['dispute'] as const))); if (meetingOpen) a.push('join_meeting'); break
    case 'delivered': if (!asLawyer) { a.push('complete'); if (o.revisionCount < 2 && o.type !== 'consultation') a.push('request_revision'); a.push('dispute') } break
    case 'revision_requested': a.push(...(asLawyer ? (['deliver'] as const) : (['dispute'] as const))); break
    case 'completed': if (!asLawyer && !hasReview) a.push('review'); break
  }
  return a
}
function toOrder(o: DbOrder): T.Order {
  const u = me()
  const l = lawyerById(o.lawyerId)!
  const lu = userById(l.userId)
  const c = userById(o.clientId)
  const asLawyer = l.userId === u.id
  const fee = Math.round(o.amount * o.commissionRate)
  const p = o.paymentId ? db().payments.find((x) => x.id === o.paymentId) : null
  const svc = o.serviceId ? db().services.find((s) => s.id === o.serviceId) : null
  const r = db().reviews.find((x) => x.orderId === o.id)
  const lastRead = db().messages.filter((m) => m.orderId === o.id && m.sender && m.sender.id !== u.id && !m.readAt).length
  return {
    id: o.id, number: o.number, type: o.type, status: o.status, title: o.title, description: o.description,
    category: o.category ? cat(o.category) : null, client: { id: c.id, name: c.name, avatarUrl: null },
    lawyer: { id: l.id, userId: l.userId, name: lu.name, avatarUrl: null, type: l.type, rating: l.rating },
    service: svc ? { id: svc.id, title: svc.title, type: svc.type } : null, jobId: o.jobId, offerId: o.offerId,
    price: { amount: o.amount, platformFee: asLawyer ? fee : null, lawyerPayout: asLawyer ? o.amount - fee : null, currency: 'UZS' },
    consultation: o.consultation ? { ...o.consultation, meetingAvailableAt: addH(-1 / 6, Date.parse(o.consultation.start)), officeAddress: o.consultation.format === 'office' ? l.officeAddress : null } : null,
    deliveryDays: o.deliveryDays, acceptDueAt: o.acceptDueAt, deliveryDueAt: o.deliveryDueAt, autoCompleteAt: o.autoCompleteAt,
    revisionCount: o.revisionCount, maxRevisions: 2,
    payment: p ? { id: p.id, status: p.status, provider: p.provider, paidAt: p.paidAt } : null,
    allowedActions: allowedActions(o, asLawyer), unreadMessages: lastRead, createdAt: o.createdAt, updatedAt: o.updatedAt,
    shared: {
      conversation: o.sharedConversationId ? { id: o.sharedConversationId, title: db().conversations.find((x) => x.id === o.sharedConversationId)?.title ?? 'Suhbat' } : null,
      documents: o.sharedDocumentIds.map((id) => db().documents.find((d) => d.id === id)).filter(Boolean).map((d) => ({ id: d!.id, name: d!.name, contentType: d!.contentType })),
      aiSummary: o.aiSummary,
    },
    dispute: o.dispute,
    review: r ? reviewsOf(o.lawyerId).find((x) => x.id === r.id) ?? null : null,
  }
}
function getOrder(id: string): DbOrder {
  const u = me()
  const o = db().orders.find((x) => x.id === id)
  const l = o && lawyerById(o.lawyerId)
  if (!o || (o.clientId !== u.id && l?.userId !== u.id)) fail(404, 'orders.not_found', 'Buyurtma topilmadi.')
  return o as DbOrder
}
function sysMsg(orderId: string, text: string) {
  db().messages.push({ id: uid('m'), orderId, sender: null, kind: 'system', text, files: [], createdAt: now(), readAt: null })
}
function event(orderId: string, type: string, actor: T.OrderEvent['actor'], text: string) {
  db().events.push({ id: uid('ev'), orderId, type, actor, text, createdAt: now() })
}
function release(o: DbOrder) {
  const fee = Math.round(o.amount * o.commissionRate)
  const last = db().walletTx.filter((t) => t.lawyerId === o.lawyerId).at(-1)?.balanceAfter ?? 0
  db().walletTx.push(
    { id: uid('tx'), lawyerId: o.lawyerId, type: 'order_income', amount: o.amount, balanceAfter: last + o.amount, orderId: o.id, orderNumber: o.number, payoutId: null, description: `${o.number} · buyurtma`, status: 'available', availableAt: now(), createdAt: now() },
    { id: uid('tx'), lawyerId: o.lawyerId, type: 'commission', amount: -fee, balanceAfter: last + o.amount - fee, orderId: o.id, orderNumber: o.number, payoutId: null, description: `${o.number} · komissiya ${Math.round(o.commissionRate * 100)}%`, status: 'available', availableAt: now(), createdAt: now() },
  )
  const l = lawyerById(o.lawyerId)!
  l.completedOrders++
}
function refund(o: DbOrder, amount: number) {
  const p = o.paymentId && db().payments.find((x) => x.id === o.paymentId)
  if (p && amount > 0) { p.refundedAmount = (p.refundedAmount ?? 0) + amount; p.status = amount >= p.amount ? 'refunded' : 'partially_refunded' }
}
function refreshTimers() {
  // What the backend's background jobs do (BACKEND_API §A.4), run lazily on read.
  const t = Date.now()
  for (const o of db().orders) {
    if (o.status === 'pending_payment' && Date.parse(o.createdAt) + 30 * 60_000 < t) { o.status = 'cancelled'; sysMsg(o.id, 'To‘lov 30 daqiqada amalga oshmadi, buyurtma bekor qilindi.') }
    if (o.status === 'awaiting_acceptance' && o.acceptDueAt && Date.parse(o.acceptDueAt) < t) { o.status = 'expired'; refund(o, o.amount); sysMsg(o.id, 'Yurist 24 soat ichida javob bermadi. Pul to‘liq qaytarildi.') }
    if (o.status === 'scheduled' && o.consultation && Date.parse(o.consultation.start) <= t) { o.status = 'in_progress' }
    if (o.status === 'delivered' && o.autoCompleteAt && Date.parse(o.autoCompleteAt) < t) { o.status = 'completed'; release(o); sysMsg(o.id, 'Buyurtma avtomatik tasdiqlandi.') }
  }
}

// ---- Jobs (§10) -----------------------------------------------------------------
function toOffer(of: DbOffer): T.Offer {
  return { id: of.id, jobId: of.jobId, lawyer: toCard(lawyerById(of.lawyerId)!), price: of.price, deliveryDays: of.deliveryDays, message: of.message, status: of.status, createdAt: of.createdAt, jobTitle: db().jobs.find((j) => j.id === of.jobId)?.title }
}
function toJob(j: DbJob, full = false): T.Job {
  const c = userById(j.clientId)
  const u = currentUserId()
  const l = u ? db().lawyers.find((x) => x.userId === u) : null
  const mine = l ? db().offers.find((o) => o.jobId === j.id && o.lawyerId === l.id) : null
  return {
    id: j.id, title: j.title, description: j.description, aiSummary: j.aiSummary, category: cat(j.category), serviceType: j.serviceType,
    budgetMin: j.budgetMin, budgetMax: j.budgetMax, deadline: j.deadline, region: j.region ? reg(j.region) : null, format: j.format,
    status: j.status, offersCount: db().offers.filter((o) => o.jobId === j.id && o.status !== 'withdrawn').length,
    attachments: full ? [] : undefined,
    client: { id: c.id, name: shortName(c.name), avatarUrl: null, memberSince: c.createdAt, ordersCount: db().orders.filter((o) => o.clientId === c.id).length },
    orderId: j.orderId, createdAt: j.createdAt, expiresAt: addH(24 * 14, Date.parse(j.createdAt)), myOffer: mine ? toOffer(mine) : null,
  }
}
const shortName = (n: string) => { const [a, b] = n.split(' '); return b ? `${a} ${b[0]}.` : a }
const hideContacts = (s: string) => s.replace(/(\+?998[\d\s-]{9,12})|(@[a-z0-9_]{4,})|([\w.-]+@[\w-]+\.\w+)/gi, '•••')

function paged<X>(items: X[], page = 1, pageSize = 20): T.Paged<X> {
  return { items: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: items.length }
}

// ---- AI (demo) ------------------------------------------------------------------
type Sec = { id: string; n: string | null; t: string | null; x: string; from: string | null; url: string | null }
const SECTIONS = (constitution as { sections: Sec[] }).sections
const art = (n: string) => SECTIONS.find((s) => s.n === n)!
const toCitation = (s: Sec): T.Citation => ({
  sectionId: s.id, legalDocumentId: 'lexuz-6445145', versionId: 'lexuz-6445145-current', documentTitle: 'O‘zbekiston Respublikasi Konstitutsiyasi',
  articleNumber: s.n, articleTitle: s.t, editionDate: s.from, officialUrl: s.url, isRepealed: false, quote: s.x.length > 380 ? `${s.x.slice(0, 380).replace(/\s\S*$/, '')} …` : s.x,
})
const TOPICS: { code: T.CategoryCode; re: RegExp; arts: string[]; summary: string; steps: string[]; missing: string[]; escalate: boolean; urgency: T.Urgency; draft?: string }[] = [
  { code: 'labor', re: /ish(dan)?|mehnat|maosh|oylik|bo.?shat|ish beruvchi|xodim/i, arts: ['42', '45'], escalate: true, urgency: 'high',
    summary: 'Konstitutsiya har kimga munosib mehnat qilish, ishsizlikdan himoyalanish va mehnati uchun haq olish huquqini kafolatlaydi. Ishdan bo‘shatish tartibi, ogohlantirish muddatlari va kompensatsiyalar Mehnat kodeksida batafsil belgilangan. Bu kodeks hozir bazaga yuklanmagani uchun uning aniq moddalarini ko‘rsata olmayman.',
    steps: ['Bo‘shatish to‘g‘risidagi buyruq nusxasini yozma ravishda so‘rang.', 'Mehnat shartnomasi, oylik to‘lov hujjatlari va yozishmalarni saqlab qo‘ying.', 'Nizoni hal qilish muddatlari cheklangan bo‘lishi mumkin. Kechiktirmasdan yurist bilan maslahatlashing.'],
    missing: ['Ishdan qachon bo‘shatildingiz?', 'Mehnat shartnomasi muddatlimi yoki muddatsizmi?'], draft: 'claim_letter' },
  { code: 'housing', re: /ijara|kvartira|uy|xonadon|turar joy|uy-joy/i, arts: ['47', '41'], escalate: false, urgency: 'normal',
    summary: 'Konstitutsiyaga ko‘ra har kim uy-joyli bo‘lish huquqiga ega va hech kim sud qarorisiz hamda qonunga zid tarzda uy-joyidan mahrum etilishi mumkin emas. Ijara munosabatlari asosan Fuqarolik kodeksi va tomonlar tuzgan shartnoma bilan tartibga solinadi. Avvalo shartnoma bandlarini tekshirish kerak.',
    steps: ['Ijara shartnomasini qayta o‘qing: muddat, to‘lov va bekor qilish bandlari.', 'Shartnomani «Hujjatlarim»ga yuklab, AI tahlilidan o‘tkazing.', 'Kelishuvlarni yozma shaklda rasmiylashtiring.'],
    missing: ['Yozma ijara shartnomasi bormi?', 'Siz ijarachimisiz yoki ijaraga beruvchi?'], draft: 'rent_apartment' },
  { code: 'family', re: /oila|nikoh|ajrim|aliment|farzand|bola|er-xotin/i, arts: ['76', '78'], escalate: true, urgency: 'normal',
    summary: 'Oila jamiyat va davlat muhofazasida, farzandlar ota-onasining fuqarolik holatidan qat’i nazar qonun oldida teng. Ajrim, aliment va bola bilan bog‘liq masalalar Oila kodeksida tartibga solingan. Bunday ishlarda vaziyat tafsilotlari natijaga kuchli ta’sir qiladi.',
    steps: ['Nikoh va farzandlar tug‘ilganlik guvohnomalarini tayyorlang.', 'Daromad va xarajatlarni tasdiqlovchi hujjatlarni yig‘ing.', 'Murosa imkoniyatini ko‘rib chiqing, kerak bo‘lsa oilaviy nizolar bo‘yicha yurist bilan maslahatlashing.'],
    missing: ['Nikoh rasman qayd etilganmi?', 'Voyaga yetmagan farzandlar bormi?'] },
  { code: 'criminal', re: /jinoyat|tergov|hibs|politsiya|ayblov|militsiya|chaqiruv/i, arts: ['27', '28', '29'], escalate: true, urgency: 'high',
    summary: 'Har kim erkinlik va shaxsiy daxlsizlik huquqiga ega. Ayblanuvchi aybi sudda isbotlanmaguncha aybdor hisoblanmaydi va malakali yuridik yordam olish huquqi kafolatlanadi. Jinoyat ishlarida birinchi daqiqalardan himoyachi ishtiroki muhim.',
    steps: ['Advokatsiz ko‘rsatma berishga majbur emasligingizni yodda tuting.', 'Chaqiruv qog‘ozi yoki bayonnoma nusxasini saqlang.', 'Imkon qadar tezroq advokat bilan bog‘laning.'],
    missing: ['Siz qaysi maqomdasiz: guvoh, gumonlanuvchi yoki ayblanuvchi?'] },
  { code: 'business', re: /biznes|tadbirkor|firma|mchj|yatt|shartnoma|kontragent/i, arts: ['67', '65'], escalate: false, urgency: 'low',
    summary: 'Davlat qulay ishbilarmonlik muhitini ta’minlaydi, tadbirkorlar qonunchilikda taqiqlanmagan har qanday faoliyatni erkin amalga oshirishi mumkin. Shartnomaviy munosabatlar Fuqarolik kodeksi bilan tartibga solinadi.',
    steps: ['Kelishuvni yozma shartnoma bilan rasmiylashtiring.', '«Hujjat yaratish» bo‘limidagi shablondan foydalaning.', 'Katta summali shartnomani imzolashdan oldin yuristga tekshirtiring.'],
    missing: ['Tomonlar jismoniy shaxsmi yoki yuridik shaxs?'], draft: 'service_agreement' },
  { code: 'inheritance', re: /meros|vasiyat|marhum/i, arts: ['41'], escalate: true, urgency: 'normal',
    summary: 'Konstitutsiya mulk huquqini va meros huquqini muhofaza qiladi. Meros ochilishi, merosxo‘rlar navbati va merosni qabul qilish muddatlari Fuqarolik kodeksida belgilangan. Muddatlar o‘tkazib yuborilmasligi muhim.',
    steps: ['O‘lim to‘g‘risidagi guvohnoma va qarindoshlikni tasdiqlovchi hujjatlarni tayyorlang.', 'Notariusga murojaat qiling.', 'Nizo bo‘lsa yurist bilan maslahatlashing.'], missing: ['Meros qachon ochilgan?', 'Vasiyatnoma bormi?'] },
]
const GENERIC = {
  code: 'other' as T.CategoryCode, arts: ['29', '55'], escalate: false, urgency: 'normal' as T.Urgency,
  summary: 'Konstitutsiyaga ko‘ra har kim o‘z huquq va erkinliklarini qonunda taqiqlanmagan barcha usullar bilan himoya qilishga va malakali yuridik yordam olishga haqli. Aniqroq javob berish uchun vaziyatingiz haqida ko‘proq ma’lumot kerak.',
  steps: ['Vaziyatni sanalar bilan qisqacha yozing.', 'Tegishli hujjatlarni «Hujjatlarim»ga yuklang.'], missing: ['Voqea qachon va qayerda bo‘lgan?', 'Qanday hujjatlar bor?'],
}
function demoAnswer(q: string, mode: 'client' | 'professional'): T.ChatAnswer {
  const t = TOPICS.find((x) => x.re.test(q)) ?? GENERIC
  const secs = t.arts.map(art).filter(Boolean)
  const cits = secs.map(toCitation)
  return {
    kind: 'answer',
    summary: mode === 'professional' ? `${t.summary} (Professional rejim, demo.)` : t.summary,
    legalBasis: secs.map((s) => ({ statement: firstSentence(s.x), citations: [s.id] })),
    legalBasisVerified: true, steps: t.steps, missingInfo: t.missing, clarifyingQuestions: [],
    limitations: ['Demo rejim: bazada hozircha faqat Konstitutsiya bor. Sohaviy kodekslar yuklangach javob aniqroq bo‘ladi.'],
    citations: cits,
    suggestedActions: [
      ...('draft' in t && t.draft ? [{ type: 'create_draft' as const, label: 'Hujjat tayyorlash', templateCode: String(t.draft) }] : []),
      { type: 'find_lawyer' as const, label: 'Yurist topish' },
    ],
    eventDate: null, disclaimer: 'AI javobi. Muhim qaror oldidan mutaxassis bilan tekshiring.',
    confidence: t.escalate ? 'medium' : 'high', category: t.code,
    escalation: { recommended: t.escalate, reason: t.escalate ? (t.urgency === 'high' ? 'Bunday ishlarda muddatlar cheklangan. Yurist bilan tez maslahatlashish tavsiya etiladi.' : 'Vaziyat tafsilotlari natijaga ta’sir qiladi. Yurist bilan maslahatlashing.') : null, urgency: t.urgency },
  }
}
const firstSentence = (x: string) => (x.split(/(?<=\.)\s/)[0] ?? x).slice(0, 220)

// ---- Mock API -------------------------------------------------------------------
async function mutate<R>(f: () => R | Promise<R>, ms?: number): Promise<R> {
  await wait(ms)
  refreshTimers()
  const r = await f()
  save()
  return r
}

export const mockApi: Api = {
  auth: {
    requestCode: (phone) => mutate(() => {
      if (!/^\+998\d{9}$/.test(phone)) fail(400, 'auth.invalid_phone', 'Telefon raqam +998XXXXXXXXX ko‘rinishida bo‘lishi kerak.')
      return { message: 'Demo rejim: istalgan 6 xonali kodni kiriting.', deliveryChannel: 'telegram', telegramBotUrl: 'https://t.me/huquqchi_bot', isNewUser: !db().users.some((u) => u.phone === phone), resendAfterSeconds: 60 } as T.CodeRequestResult
    }),
    verify: (b) => mutate(() => {
      if (!/^\d{6}$/.test(b.code)) fail(401, 'auth.invalid_code', 'Kod 6 ta raqamdan iborat bo‘lishi kerak.')
      let u = db().users.find((x) => x.phone === b.phone)
      if (!u) {
        if (!b.name?.trim()) fail(400, 'auth.name_required', 'Ismingizni kiriting.')
        if (!b.acceptTerms) fail(400, 'auth.terms_required', 'Foydalanish shartlariga rozilik bering.')
        u = { id: uid('u'), name: b.name!.trim(), phone: b.phone, email: null, role: b.role ?? 'client', lawyerStatus: b.role === 'lawyer' ? 'draft' : null, lawyerProfileId: null, planCode: b.role === 'lawyer' ? 'lawyer_free' : 'client_free', language: 'uz-Latn', createdAt: now() }
        db().users.push(u)
        if (u.role === 'lawyer') {
          const lw: DbLawyer = { id: uid('lw'), userId: u.id, type: 'advocate', headline: '', bio: '', categories: [], region: 'tashkent_city', city: 'Toshkent', languages: ['uz-Latn'], workFormats: ['online'], experienceYears: 0, rating: 0, reviewCount: 0, completedOrders: 0, responseTimeMinutes: 0, isOnline: true, isPromoted: false, education: [], licenseNumber: null, officeAddress: null, status: 'draft', rejectionReason: null, verifiedAt: null, schedule: defaultSchedule(), verificationDocs: [], submittedAt: null, createdAt: now(), hue: Math.floor(Math.random() * 360) }
          db().lawyers.push(lw)
          u.lawyerProfileId = lw.id
        }
      }
      const tokens = { accessToken: `mock:${u.id}`, refreshToken: `mock-r:${u.id}`, accessTokenExpiresAt: addH(24 * 30) }
      tokenStore.set(tokens)
      return { ...tokens, refreshTokenExpiresAt: addH(24 * 30), userId: u.id, workspaceId: `ws-${u.id}`, role: u.role, user: toMe(u) }
    }),
    logout: async () => { await wait(50) },
    sessions: async () => [{ id: 's1', device: navigator.userAgent.includes('Mac') ? 'Safari · macOS' : 'Chrome · Brauzer', ip: '84.54.•••.•••', city: 'Toshkent', createdAt: addH(-5), lastActiveAt: now(), isCurrent: true }],
    revokeSession: async () => { await wait() },
    logoutAll: async () => { await wait() },
  },
  me: {
    get: () => mutate(() => toMe(me()), 80),
    update: (b) => mutate(() => { const u = me(); Object.assign(u, Object.fromEntries(Object.entries(b).filter(([, v]) => v !== undefined))); return toMe(u) }),
    deleteAccount: () => mutate(() => { fail(422, 'me.has_active_orders', 'Demo rejimda hisobni o‘chirib bo‘lmaydi.') }),
  },
  reference: {
    categories: async () => CATEGORIES.map((c) => ({ ...c, lawyerCount: db().lawyers.filter((l) => l.status === 'verified' && l.categories.some((x) => x.code === c.code)).length })),
    regions: async () => REGIONS,
  },
  files: {
    upload: (file, _purpose) => mutate(() => {
      if (file.size > 25 * 1024 * 1024) fail(413, 'files.too_large', 'Fayl 25 MB dan katta.')
      const f = { id: uid('f'), name: file.name, mime: file.type || 'application/octet-stream', size: file.size, url: URL.createObjectURL(file) }
      db().files.push(f)
      return f
    }, 400),
  },

  // ---- Chat ----
  chat: {
    list: (search) => mutate(() => {
      const u = me()
      return db().conversations.filter((c) => c.userId === u.id && (!search || c.title.toLowerCase().includes(search.toLowerCase())))
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(toConv)
    }, 100),
    create: (title, mode = 'client') => mutate(() => {
      const c = { id: uid('cv'), userId: me().id, title: title || 'Yangi suhbat', mode, category: null, documentIds: [], createdAt: now(), updatedAt: now() }
      db().conversations.push(c)
      return toConv(c)
    }, 100),
    get: (id) => mutate(() => toConv(conv(id)), 60),
    rename: (id, title) => mutate(() => { const c = conv(id); c.title = title; return toConv(c) }),
    remove: (id) => mutate(() => { const d = db(); d.conversations = d.conversations.filter((c) => c.id !== conv(id).id); d.chatMessages = d.chatMessages.filter((m) => m.conversationId !== id) }),
    messages: (id) => mutate(() => { conv(id); return db().chatMessages.filter((m) => m.conversationId === id) }, 80),
    send: async (id: string, req: T.SendMessageRequest, h: StreamHandlers, signal?: AbortSignal) => {
      const c = conv(id)
      const u = me()
      consume(u.role === 'lawyer' ? 'ai_pro_questions' : 'ai_questions')
      const userMsg: T.Message = { id: uid('msg'), role: 'user', content: req.content, answer: null, feedback: null, createdAt: now() }
      db().chatMessages.push({ ...userMsg, conversationId: id })
      if (db().chatMessages.filter((m) => m.conversationId === id).length === 1) c.title = req.content.slice(0, 60)
      save()
      h.onUser?.(userMsg)
      const answer = demoAnswer(req.content, c.mode)
      const abortable = (ms: number) => new Promise<void>((res, rej) => {
        const t = setTimeout(res, ms)
        signal?.addEventListener('abort', () => { clearTimeout(t); rej(new DOMException('Aborted', 'AbortError')) }, { once: true })
      })
      for (const stage of ['planning', 'searching', 'writing'] as const) { h.onStatus?.(stage); await abortable(450) }
      const words = answer.summary.split(' ')
      for (let i = 0; i < words.length; i += 3) { h.onDelta?.(words.slice(i, i + 3).join(' ') + ' '); await abortable(45) }
      h.onStatus?.('verifying'); await abortable(350)
      const msg: T.Message = { id: uid('msg'), role: 'assistant', content: answer.summary, answer, feedback: null, createdAt: now() }
      db().chatMessages.push({ ...msg, conversationId: id })
      c.category = answer.category; c.updatedAt = now()
      save()
      return msg
    },
    feedback: (id, messageId, value) => mutate(() => { const m = db().chatMessages.find((x) => x.conversationId === id && x.id === messageId); if (m) m.feedback = value }),
    attach: (id, documentId) => mutate(() => { const c = conv(id); if (!c.documentIds.includes(documentId)) c.documentIds.push(documentId) }),
    detach: (id, documentId) => mutate(() => { const c = conv(id); c.documentIds = c.documentIds.filter((d) => d !== documentId) }),
    handoffPreview: (id) => mutate(() => {
      const c = conv(id)
      const msgs = db().chatMessages.filter((m) => m.conversationId === id)
      const firstQ = msgs.find((m) => m.role === 'user')?.content ?? c.title
      const last = [...msgs].reverse().find((m) => m.answer)?.answer
      const code = c.category ?? 'other'
      const recs = db().lawyers.filter((l) => l.status === 'verified').map((l) => ({ l, s: (l.categories.find((x) => x.code === code) ? (l.categories.find((x) => x.code === code)!.isPrimary ? 1 : 0.6) : 0) * 0.5 + l.rating / 10 + (l.isOnline ? 0.05 : 0) }))
        .sort((a, b) => b.s - a.s).slice(0, 3).map((x) => toCard(x.l))
      return {
        title: c.title.slice(0, 80), summary: `Mijoz savoli: «${firstQ}». ${last ? `AI dastlabki javobi: ${last.summary.slice(0, 260)}…` : ''}`,
        questions: [firstQ], category: cat(code), urgency: last?.escalation.urgency ?? 'normal',
        documents: c.documentIds.map((d) => db().documents.find((x) => x.id === d)).filter(Boolean).map((d) => ({ id: d!.id, name: d!.name })),
        recommendedLawyers: recs, suggestedBudget: { min: 100000, max: 300000 },
      } satisfies T.HandoffPreview
    }, 700),
  },

  // ---- Documents ----
  documents: {
    list: (q = {}) => mutate(() => {
      const u = me()
      return db().documents.filter((d) => d.userId === u.id && (!q.origin || d.origin === q.origin) && (!q.search || `${d.name} ${d.tags.join(' ')}`.toLowerCase().includes(q.search.toLowerCase())))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(stripDoc)
    }, 100),
    get: (id) => mutate(() => stripDoc(doc(id)), 60),
    upload: (file, origin = 'Uploaded') => mutate(() => {
      const ok = /\.(pdf|docx|jpe?g|png)$/i.test(file.name)
      if (!ok) fail(415, 'documents.invalid_type', 'Faqat PDF, DOCX, JPG yoki PNG.')
      if (file.size > 25 * 1024 * 1024) fail(413, 'documents.invalid_size', 'Fayl 25 MB dan oshmasligi kerak.')
      const u = me()
      if (db().documents.some((d) => d.userId === u.id && d.name === file.name && d.sizeBytes === file.size)) fail(409, 'documents.duplicate', 'Bu fayl allaqachon saqlangan.')
      const d = { id: uid('doc'), userId: u.id, name: file.name, origin, status: 'Saved' as const, contentType: file.type || 'application/octet-stream', sizeBytes: file.size, tags: [], createdAt: now(), lastAnalyzedAt: null, pageCount: null, text: '' }
      db().documents.push(d)
      return stripDoc(d)
    }, 600),
    update: (id, b) => mutate(() => { const d = doc(id); d.name = b.name; d.tags = b.tags }),
    remove: (id) => mutate(() => { const d = doc(id); db().documents = db().documents.filter((x) => x.id !== d.id) }),
    download: async (id) => { const d = doc(id); return new Blob([`Demo fayl: ${d.name}`], { type: 'text/plain' }) },
    analyses: (id) => mutate(() => { doc(id); return db().analyses.filter((a) => a.documentId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) }, 80),
    analysis: (id, analysisId) => mutate(() => {
      doc(id)
      const a = db().analyses.find((x) => x.id === analysisId)
      if (!a) fail(404, 'analyses.not_found', 'Tahlil topilmadi.')
      if (a!.status === 'Processing' && Date.parse(a!.createdAt) + 4000 < Date.now()) completeAnalysis(a!)
      return a!
    }, 80),
    analyze: (id, b) => mutate(() => {
      const d = doc(id)
      if (!b.purpose.trim()) fail(400, 'documents.empty_analysis_purpose', 'Tekshiruv maqsadini yozing.')
      if (!b.userRole) {
        return { ...blankAnalysis(d.id, b.purpose), status: 'NeedsRole' as const, candidateRoles: ['Men birinchi tomonman (masalan, ijarachi / xodim / xaridor)', 'Men ikkinchi tomonman (masalan, ijaraga beruvchi / ish beruvchi / sotuvchi)'] }
      }
      consume('analyses')
      const a = { ...blankAnalysis(d.id, b.purpose), userId: me().id, status: 'Processing' as const, userRole: b.userRole }
      db().analyses.push(a)
      d.status = 'Processing'
      return a
    }, 400),
  },

  // ---- Legal ----
  legal: {
    list: (q = {}) => mutate(() => {
      const item: T.LegalListItem = { id: 'lexuz-6445145', title: 'O‘zbekiston Respublikasi Konstitutsiyasi', type: 'Konstitutsiya', number: null, issuedAt: '2023-04-30', status: 'in_force', category: null, sectionCount: SECTIONS.length, officialUrl: 'https://lex.uz/docs/6445145' }
      const qq = (q.query ?? '').toLowerCase()
      return !qq || 'konstitutsiya asosiy qonun'.includes(qq) || SECTIONS.some((s) => s.x.toLowerCase().includes(qq)) ? [item] : []
    }, 120),
    get: (id) => mutate(() => {
      if (id !== 'lexuz-6445145') fail(404, 'legal_documents.not_found', 'Qonun hujjati topilmadi.')
      return {
        id, title: 'O‘zbekiston Respublikasi Konstitutsiyasi', type: 'Konstitutsiya', number: null, issuedAt: '2023-04-30', status: 'in_force', category: null, sectionCount: SECTIONS.length, officialUrl: 'https://lex.uz/docs/6445145',
        versions: [{ id: 'lexuz-6445145-current', effectiveFrom: '2023-05-01', effectiveTo: null, isCurrent: true, officialUrl: 'https://lex.uz/docs/6445145', sections: SECTIONS.map((s) => ({ id: s.id, number: s.n, title: s.t, text: s.x, officialUrl: s.url })) }],
      } satisfies T.LegalDocumentDetails
    }, 150),
    search: (query, limit = 10) => mutate(() => {
      const terms = query.toLowerCase().replace(/[‘’`ʻʼ']/g, "'").split(/\s+/).filter((w) => w.length > 2).map((w) => w.slice(0, Math.max(4, w.length - 2)))
      return SECTIONS.map((s) => {
        const x = s.x.toLowerCase().replace(/[‘’`ʻʼ']/g, "'")
        const score = terms.reduce((acc, t) => acc + (x.includes(t) ? 1 : 0), 0) / Math.max(terms.length, 1)
        return { s, score }
      }).filter((r) => r.score > 0).sort((a, b) => b.score - a.score).slice(0, limit).map(({ s, score }) => ({
        sectionId: s.id, legalDocumentId: 'lexuz-6445145', documentTitle: 'Konstitutsiya', articleNumber: s.n, articleTitle: s.t,
        snippet: s.x.slice(0, 240), editionDate: s.from, isCurrent: true, officialUrl: s.url, score,
      }))
    }, 250),
  },

  // ---- Templates & drafts ----
  templates: {
    list: async () => { await wait(80); return TEMPLATES },
    get: async (id) => { await wait(60); return TEMPLATES.find((t) => t.id === id) ?? fail(404, 'templates.not_found', 'Shablon topilmadi.') },
  },
  drafts: {
    list: () => mutate(() => db().drafts.filter((d) => d.userId === me().id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)), 80),
    get: (id) => mutate(() => draft(id), 60),
    create: (b) => mutate(() => {
      const tpl = TEMPLATES.find((t) => t.id === b.templateId) ?? fail(404, 'templates.not_found', 'Shablon topilmadi.')
      consume('drafts')
      const d = { id: uid('dr'), userId: me().id, templateId: tpl.id, templateName: tpl.name, name: b.name || tpl.name, fields: b.fields, ...render(tpl, b.fields), status: 'draft' as const, documentId: null, revision: 1, createdAt: now(), updatedAt: now() }
      db().drafts.push(d)
      return d
    }, 500),
    update: (id, b) => mutate(() => {
      const d = draft(id)
      const tpl = TEMPLATES.find((t) => t.id === d.templateId)!
      if (b.name) d.name = b.name
      if (b.fields) Object.assign(d, { fields: b.fields }, render(tpl, b.fields))
      if (b.text !== undefined) d.text = b.text
      d.revision++; d.updatedAt = now()
      return d
    }),
    remove: (id) => mutate(() => { draft(id); db().drafts = db().drafts.filter((d) => d.id !== id) }),
    confirm: (id) => mutate(() => {
      const d = draft(id)
      if (d.missingRequired.length) fail(422, 'drafts.missing_required', 'Avval barcha majburiy maydonlarni to‘ldiring.')
      if (!d.documentId) {
        const docId = uid('doc')
        db().documents.push({ id: docId, userId: d.userId, name: `${d.name}.docx`, origin: 'Generated', status: 'Draft', contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', sizeBytes: d.text.length * 2, tags: ['loyiha'], createdAt: now(), lastAnalyzedAt: null, pageCount: 1, text: d.text })
        d.documentId = docId
      }
      d.status = 'confirmed'
      return d
    }),
    export: async (id) => { const d = draft(id); return new Blob([d.text], { type: 'text/plain;charset=utf-8' }) },
  },

  // ---- Lawyers (public) ----
  lawyers: {
    list: (q) => mutate(() => {
      const cats = ([] as unknown[]).concat(q.category ?? []).map(String)
      let ls = db().lawyers.filter((l) => l.status === 'verified')
      if (q.search) { const s = String(q.search).toLowerCase(); ls = ls.filter((l) => `${userById(l.userId).name} ${l.headline} ${db().services.filter((x) => x.lawyerId === l.id).map((x) => x.title).join(' ')}`.toLowerCase().includes(s)) }
      if (cats.length) ls = ls.filter((l) => l.categories.some((c) => cats.includes(c.code)))
      if (q.region) ls = ls.filter((l) => l.region === q.region)
      if (q.type) ls = ls.filter((l) => l.type === q.type)
      if (q.format) ls = ls.filter((l) => l.workFormats.includes(q.format as T.WorkFormat))
      if (q.language) ls = ls.filter((l) => l.languages.includes(q.language as T.Language))
      if (q.ratingMin) ls = ls.filter((l) => l.rating >= Number(q.ratingMin))
      if (q.priceMax) ls = ls.filter((l) => minPrice(l.id) <= Number(q.priceMax))
      if (q.serviceType) ls = ls.filter((l) => db().services.some((s) => s.lawyerId === l.id && s.isActive && s.type === q.serviceType))
      let cards = ls.map(toCard)
      if (q.availableWithin) cards = cards.filter((c) => c.nextAvailableAt && Date.parse(c.nextAvailableAt) < Date.now() + Number(q.availableWithin) * 3600_000)
      const sorters: Record<string, (a: T.LawyerCard, b: T.LawyerCard) => number> = {
        rating: (a, b) => b.rating - a.rating, price_asc: (a, b) => a.priceFrom - b.priceFrom, price_desc: (a, b) => b.priceFrom - a.priceFrom,
        experience: (a, b) => b.experienceYears - a.experienceYears, reviews: (a, b) => b.reviewCount - a.reviewCount,
        recommended: (a, b) => (Number(b.isPromoted) - Number(a.isPromoted)) || (b.rating * Math.log10(b.completedOrders + 10) - a.rating * Math.log10(a.completedOrders + 10)),
      }
      cards.sort(sorters[String(q.sort ?? 'recommended')] ?? sorters.recommended)
      return paged(cards, Number(q.page ?? 1), Number(q.pageSize ?? 20))
    }, 200),
    get: (id) => mutate(() => toProfile(lawyerById(id) ?? fail(404, 'lawyers.not_found', 'Yurist topilmadi.')), 150),
    slots: (id, q) => mutate(() => {
      const l = lawyerById(id) ?? fail(404, 'lawyers.not_found', 'Yurist topilmadi.')
      const svc = q.serviceId ? db().services.find((s) => s.id === q.serviceId) : null
      return slotsFor(l, q.from, q.to, svc?.durationMinutes ?? l.schedule.slotMinutes)
    }, 150),
    reviews: (id, page = 1) => mutate(() => paged(reviewsOf(id), page, 10), 100),
    recommended: (q) => mutate(() => {
      const code = q.category ?? (q.conversationId ? db().conversations.find((c) => c.id === q.conversationId)?.category : null) ?? 'other'
      return db().lawyers.filter((l) => l.status === 'verified').sort((a, b) => Number(!!b.categories.find((c) => c.code === code)) - Number(!!a.categories.find((c) => c.code === code)) || b.rating - a.rating).slice(0, 3).map(toCard)
    }, 150),
  },

  // ---- Lawyer cabinet ----
  lawyer: {
    profile: () => mutate(() => ownProfile(myLawyer()), 100),
    updateProfile: (b) => mutate(() => {
      const l = myLawyer()
      if (b.type === 'legal_consultant' && b.workFormats.includes('court')) fail(422, 'lawyer.court_requires_advocate', 'Sudda vakillik faqat advokatlar uchun.')
      if (!b.categories.length) fail(400, 'validation', 'Kamida bitta yo‘nalish tanlang.')
      Object.assign(l, { ...b, headline: hideContacts(b.headline), bio: hideContacts(b.bio) })
      return ownProfile(l)
    }),
    verification: () => mutate(() => verification(myLawyer()), 80),
    addVerificationDoc: (kind, fileId) => mutate(() => {
      const l = myLawyer()
      const f = db().files.find((x) => x.id === fileId)!
      l.verificationDocs = l.verificationDocs.filter((d) => d.kind !== kind)
      l.verificationDocs.push({ id: uid('vd'), kind, status: 'uploaded', file: f, comment: null })
      return {}
    }),
    submitVerification: () => mutate(() => {
      const l = myLawyer()
      const v = verification(l)
      const missing = v.requiredKinds.filter((k) => !l.verificationDocs.some((d) => d.kind === k))
      if (missing.length) fail(422, 'lawyer.verification_incomplete', 'Barcha majburiy hujjatlarni yuklang.')
      if (!l.headline || !l.categories.length) fail(422, 'lawyer.profile_incomplete', 'Avval profilni to‘ldiring: sarlavha va yo‘nalishlar.')
      l.status = 'pending'; l.submittedAt = now()
      // Demo: auto-approve after a few seconds so the whole flow can be tried.
      setTimeout(() => { l.status = 'verified'; l.verifiedAt = now(); l.verificationDocs.forEach((d) => (d.status = 'approved')); userById(l.userId).lawyerStatus = 'verified'; notify(l.userId, 'verification_approved', 'Profil tasdiqlandi', 'Endi siz katalogda ko‘rinasiz va buyurtma olishingiz mumkin.', { kind: 'verification', id: l.id }); save() }, 6000)
      return verification(l)
    }),
    dashboard: () => mutate(() => {
      const l = myLawyer()
      const os = db().orders.filter((o) => o.lawyerId === l.id)
      const tx = db().walletTx.filter((t) => t.lawyerId === l.id)
      const month = new Date().toISOString().slice(0, 7)
      const earned = tx.filter((t) => t.createdAt.startsWith(month) && (t.type === 'order_income' || t.type === 'commission')).reduce((s, t) => s + t.amount, 0)
      const w = wallet(l)
      return {
        stats: { earningsThisMonth: earned, earningsLastMonth: 1980000, walletAvailable: w.available, walletPending: w.pending, activeOrders: os.filter((o) => ACTIVE.includes(o.status)).length, completedThisMonth: os.filter((o) => o.status === 'completed' && o.updatedAt.startsWith(month)).length, rating: l.rating, reviewCount: l.reviewCount, responseRate: 0.97, profileViews30d: 642 },
        actionRequired: os.filter((o) => ['awaiting_acceptance', 'revision_requested', 'in_progress'].includes(o.status)).map(toOrder),
        upcomingConsultations: os.filter((o) => o.status === 'scheduled').sort((a, b) => a.consultation!.start.localeCompare(b.consultation!.start)).map(toOrder),
        matchingJobs: db().jobs.filter((j) => j.status === 'open' && l.categories.some((c) => c.code === j.category)).slice(0, 4).map((j) => toJob(j)),
        verificationStatus: l.status,
      }
    }, 150),
    services: () => mutate(() => db().services.filter((s) => s.lawyerId === myLawyer().id).map(toService), 80),
    createService: (b) => mutate(() => {
      const l = myLawyer()
      validateService(l, b)
      const s = { ...b, id: uid('sv'), lawyerId: l.id, title: hideContacts(b.title), description: hideContacts(b.description), isActive: b.isActive ?? true, ordersCount: 0, createdAt: now() }
      db().services.push(s)
      return toService(s)
    }),
    updateService: (id, b) => mutate(() => {
      const s = db().services.find((x) => x.id === id && x.lawyerId === myLawyer().id) ?? fail(404, 'services.not_found', 'Xizmat topilmadi.')
      Object.assign(s, b)
      return toService(s)
    }),
    deleteService: (id) => mutate(() => {
      const l = myLawyer()
      if (db().orders.some((o) => o.serviceId === id && ACTIVE.includes(o.status))) fail(409, 'services.has_active_orders', 'Bu xizmat bo‘yicha faol buyurtmalar bor. Uni o‘chirish o‘rniga to‘xtatib qo‘ying.')
      db().services = db().services.filter((s) => !(s.id === id && s.lawyerId === l.id))
    }),
    schedule: () => mutate(() => myLawyer().schedule, 80),
    saveSchedule: (b) => mutate(() => {
      for (const d of [...b.weekly.map((w) => w.intervals), ...b.exceptions.map((e) => e.intervals)]) {
        const s = [...d].sort((x, y) => x.start.localeCompare(y.start))
        s.forEach((iv, i) => {
          if (iv.start >= iv.end) fail(422, 'schedule.invalid_interval', `Noto‘g‘ri oraliq: ${iv.start}–${iv.end}`)
          if (i && s[i - 1].end > iv.start) fail(422, 'schedule.overlap', 'Vaqt oraliqlari ustma-ust tushmasligi kerak.')
        })
      }
      myLawyer().schedule = b
      return b
    }),
    calendar: (from, to) => mutate(() => {
      const l = myLawyer()
      const free = slotsFor(l, from, to, l.schedule.slotMinutes)
      return { days: free.days.map((d) => ({ date: d.date, free: d.slots, booked: db().orders.filter((o) => o.lawyerId === l.id && o.consultation && tashkentDate(new Date(o.consultation.start)) === d.date && ACTIVE.concat('completed').includes(o.status)).map((o) => ({ orderId: o.id, start: o.consultation!.start, end: o.consultation!.end, clientName: shortName(userById(o.clientId).name), format: o.consultation!.format, status: o.status })) })) }
    }, 150),
    jobs: (q) => mutate(() => {
      const l = myLawyer()
      if (l.status !== 'verified') fail(403, 'lawyer.not_verified', 'E’lonlarni ko‘rish uchun profilingiz tasdiqlanishi kerak.')
      let js = db().jobs.filter((j) => j.status === 'open' && j.clientId !== l.userId)
      if (q.category) js = js.filter((j) => j.category === q.category)
      if (q.region) js = js.filter((j) => j.region === q.region)
      if (q.matching) js = js.filter((j) => l.categories.some((c) => c.code === j.category))
      if (q.search) js = js.filter((j) => `${j.title} ${j.description}`.toLowerCase().includes(String(q.search).toLowerCase()))
      return paged(js.sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((j) => toJob(j)))
    }, 150),
    job: (id) => mutate(() => toJob(db().jobs.find((j) => j.id === id) ?? fail(404, 'jobs.not_found', 'E’lon topilmadi.')), 100),
    sendOffer: (jobId, b) => mutate(() => {
      const l = myLawyer()
      const j = db().jobs.find((x) => x.id === jobId) ?? fail(404, 'jobs.not_found', 'E’lon topilmadi.')
      if (j.status !== 'open') fail(409, 'jobs.not_open', 'E’lon yopilgan.')
      if (db().offers.some((o) => o.jobId === jobId && o.lawyerId === l.id && o.status !== 'withdrawn')) fail(409, 'offers.already_exists', 'Siz bu e’longa taklif yuborgansiz.')
      if (b.price < 10000) fail(400, 'validation', 'Narx kamida 10 000 so‘m.')
      const of: DbOffer = { id: uid('of'), jobId, lawyerId: l.id, price: b.price, deliveryDays: b.deliveryDays, message: hideContacts(b.message), status: 'pending', createdAt: now() }
      db().offers.push(of)
      notify(j.clientId, 'offer_received', 'Yangi taklif', `${userById(l.userId).name} taklif yubordi: ${b.price.toLocaleString('ru-RU')} so‘m.`, { kind: 'job', id: j.id })
      return toOffer(of)
    }),
    withdrawOffer: (id) => mutate(() => { const o = db().offers.find((x) => x.id === id && x.lawyerId === myLawyer().id) ?? fail(404, 'offers.not_found', 'Taklif topilmadi.'); if (o.status !== 'pending') fail(409, 'offers.not_pending', 'Taklif allaqachon ko‘rib chiqilgan.'); o.status = 'withdrawn'; return toOffer(o) }),
    offers: () => mutate(() => db().offers.filter((o) => o.lawyerId === myLawyer().id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map(toOffer), 80),
    aiDraft: (orderId) => mutate(() => {
      const o = getOrder(orderId)
      const a = demoAnswer(`${o.title} ${o.description} ${o.category ?? ''}`, 'professional')
      return { text: `Assalomu alaykum, ${userById(o.clientId).name.split(' ')[0]}!\n\nSavolingiz bo‘yicha: ${a.summary}\n\nTavsiyalarim:\n${a.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\nQo‘shimcha savollar bo‘lsa, shu yerda yozing.`, citations: a.citations, confidence: a.confidence, warnings: ['AI qoralamasi. Yuborishdan oldin tekshiring va tahrirlang.'] }
    }, 900),
    reviews: () => mutate(() => paged(reviewsOf(myLawyer().id)), 80),
  },

  // ---- Jobs (client) ----
  jobs: {
    create: (b) => mutate(() => {
      if (b.title.trim().length < 8) fail(400, 'validation', 'Sarlavha kamida 8 ta belgidan iborat bo‘lsin.')
      if (b.description.trim().length < 30) fail(400, 'validation', 'Vaziyatni batafsilroq yozing (kamida 30 belgi).')
      const j: DbJob = { id: uid('job'), clientId: me().id, title: hideContacts(b.title), description: hideContacts(b.description), aiSummary: null, category: b.category, serviceType: b.serviceType ?? null, budgetMin: b.budgetMin ?? null, budgetMax: b.budgetMax ?? null, deadline: b.deadline ?? null, region: b.region ?? null, format: b.format, status: 'open', orderId: null, sourceConversationId: b.sourceConversationId ?? null, sharedDocumentIds: b.sharedDocumentIds ?? [], shareConversation: !!b.shareConversation, createdAt: now() }
      db().jobs.push(j)
      return toJob(j, true)
    }),
    mine: () => mutate(() => paged(db().jobs.filter((j) => j.clientId === me().id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((j) => toJob(j))), 100),
    get: (id) => mutate(() => toJob(myJob(id), true), 80),
    close: (id) => mutate(() => { const j = myJob(id); j.status = 'closed'; return toJob(j, true) }),
    offers: (id) => mutate(() => { myJob(id); return db().offers.filter((o) => o.jobId === id && o.status !== 'withdrawn').sort((a, b) => a.price - b.price).map(toOffer) }, 100),
    acceptOffer: (id, offerId) => mutate(() => {
      const j = myJob(id)
      const of = db().offers.find((o) => o.id === offerId && o.jobId === id) ?? fail(404, 'offers.not_found', 'Taklif topilmadi.')
      if (j.status !== 'open' || of.status !== 'pending') fail(409, 'offers.not_pending', 'Bu taklifni qabul qilib bo‘lmaydi.')
      const lp = PLANS.find((p) => p.code === userById(lawyerById(of.lawyerId)!.userId).planCode)
      const o: DbOrder = { id: uid('ord'), number: nextNumber(), type: 'job', status: 'pending_payment', title: j.title, description: j.description, category: j.category, clientId: j.clientId, lawyerId: of.lawyerId, serviceId: null, jobId: j.id, offerId: of.id, amount: of.price, commissionRate: lp?.code === 'lawyer_pro' ? 0.1 : 0.15, consultation: null, deliveryDays: of.deliveryDays, acceptDueAt: null, deliveryDueAt: null, autoCompleteAt: null, revisionCount: 0, paymentId: null, sharedConversationId: j.shareConversation ? j.sourceConversationId : null, sharedDocumentIds: j.sharedDocumentIds, aiSummary: j.aiSummary, dispute: null, createdAt: now(), updatedAt: now() }
      db().orders.push(o)
      of.status = 'accepted'
      db().offers.filter((x) => x.jobId === id && x.id !== offerId && x.status === 'pending').forEach((x) => (x.status = 'rejected'))
      j.status = 'in_progress'; j.orderId = o.id
      event(o.id, 'created', 'client', 'Taklif qabul qilindi, buyurtma yaratildi')
      return toOrder(o)
    }),
    rejectOffer: (id, offerId) => mutate(() => { myJob(id); const of = db().offers.find((o) => o.id === offerId)!; of.status = 'rejected'; return toOffer(of) }),
  },

  // ---- Orders ----
  orders: {
    create: (b) => mutate(() => {
      const u = me()
      const s = db().services.find((x) => x.id === b.serviceId && x.isActive) ?? fail(422, 'orders.service_unavailable', 'Xizmat hozir mavjud emas.')
      const l = lawyerById(s.lawyerId)!
      if (l.userId === u.id) fail(422, 'orders.self_order', 'O‘zingizga buyurtma bera olmaysiz.')
      if ((b.shareConversation || b.sharedDocumentIds?.length) && !b.shareConsent) fail(422, 'orders.consent_required', 'Materiallarni ulashishga rozilik bering.')
      let consultation: DbOrder['consultation'] = null
      if (s.type === 'consultation') {
        if (!b.slotStart) fail(400, 'validation', 'Vaqtni tanlang.')
        const start = Date.parse(b.slotStart!)
        const end = start + (s.durationMinutes ?? 30) * 60_000
        const date = tashkentDate(new Date(start))
        const free = slotsFor(l, date, date, s.durationMinutes ?? 30).days[0]?.slots ?? []
        if (!free.some((x) => Date.parse(x.start) === start)) fail(409, 'orders.slot_taken', 'Bu vaqt band bo‘lib qoldi. Boshqa vaqtni tanlang.')
        consultation = { start: new Date(start).toISOString(), end: new Date(end).toISOString(), format: b.format ?? s.formats[0] }
      }
      const lp = PLANS.find((p) => p.code === userById(l.userId).planCode)
      const o: DbOrder = { id: uid('ord'), number: nextNumber(), type: s.type === 'consultation' ? 'consultation' : s.type === 'question' ? 'question' : 'service', status: 'pending_payment', title: s.title, description: b.description, category: s.category, clientId: u.id, lawyerId: l.id, serviceId: s.id, jobId: null, offerId: null, amount: s.price, commissionRate: lp?.code === 'lawyer_pro' ? 0.1 : 0.15, consultation, deliveryDays: s.deliveryDays, acceptDueAt: null, deliveryDueAt: null, autoCompleteAt: null, revisionCount: 0, paymentId: null, sharedConversationId: b.shareConversation ? b.sourceConversationId ?? null : null, sharedDocumentIds: b.sharedDocumentIds ?? [], aiSummary: null, dispute: null, createdAt: now(), updatedAt: now() }
      if (o.sharedConversationId) {
        const c = db().conversations.find((x) => x.id === o.sharedConversationId)
        o.aiSummary = c ? `AI suhbatidan: «${c.title}»` : null
      }
      db().orders.push(o)
      event(o.id, 'created', 'client', 'Buyurtma yaratildi')
      if (b.caseId) {
        const cs = (db() as unknown as { cases?: { id: string; userId: string; linkIds: { orders: string[] }; events: T.CaseEvent[] }[] }).cases?.find((x) => x.id === b.caseId && x.userId === u.id)
        if (cs) { cs.linkIds.orders.push(o.id); cs.events.unshift({ id: uid('ce'), text: `Yurist bilan buyurtma: ${o.number}`, actor: 'user', createdAt: now() }) }
      }
      return toOrder(o)
    }),
    list: (q) => mutate(() => {
      const u = me()
      const l = db().lawyers.find((x) => x.userId === u.id)
      const groups: Record<string, T.OrderStatus[]> = { active: ACTIVE, completed: ['completed'], cancelled: ['cancelled', 'declined', 'expired', 'refunded'] }
      let os = db().orders.filter((o) => (u.role === 'lawyer' && l ? o.lawyerId === l.id : o.clientId === u.id))
      if (q.group) os = os.filter((o) => groups[q.group!].includes(o.status))
      if (q.search) os = os.filter((o) => `${o.number} ${o.title}`.toLowerCase().includes(q.search!.toLowerCase()))
      return paged(os.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(toOrder), q.page ?? 1)
    }, 120),
    get: (id) => mutate(() => toOrder(getOrder(id)), 80),
    events: (id) => mutate(() => { getOrder(id); return db().events.filter((e) => e.orderId === id) }, 60),
    action: (id, action, body) => mutate(() => {
      const o = getOrder(id)
      const asLawyer = lawyerById(o.lawyerId)!.userId === me().id
      const map: Record<string, T.OrderAction> = { accept: 'accept', decline: 'decline', deliver: 'deliver', 'request-revision': 'request_revision', complete: 'complete', dispute: 'dispute', 'no-show': 'mark_no_show' }
      if (!allowedActions(o, asLawyer).includes(map[action])) fail(409, 'orders.invalid_transition', 'Bu amalni hozir bajarib bo‘lmaydi.')
      const bb = (body ?? {}) as { reason?: string; message?: string; fileIds?: string[]; description?: string }
      const clientName = userById(o.clientId).name
      const lawyerName = userById(lawyerById(o.lawyerId)!.userId).name
      switch (action) {
        case 'accept':
          o.status = o.type === 'consultation' ? 'scheduled' : 'in_progress'
          if (o.deliveryDays) o.deliveryDueAt = addH(24 * o.deliveryDays)
          sysMsg(o.id, 'Yurist buyurtmani qabul qildi.'); event(o.id, 'accepted', 'lawyer', 'Yurist qabul qildi')
          notify(o.clientId, 'order_accepted', 'Buyurtma qabul qilindi', `${lawyerName} ${o.number} buyurtmangizni qabul qildi.`, { kind: 'order', id: o.id })
          break
        case 'decline':
          o.status = 'declined'; refund(o, o.amount)
          sysMsg(o.id, `Yurist buyurtmani rad etdi${bb.reason ? `: ${bb.reason}` : '.'} Pul to‘liq qaytarildi.`); event(o.id, 'declined', 'lawyer', 'Yurist rad etdi')
          notify(o.clientId, 'order_declined', 'Buyurtma rad etildi', `${o.number}: pul to‘liq qaytariladi.`, { kind: 'order', id: o.id })
          break
        case 'deliver': {
          o.status = 'delivered'; o.autoCompleteAt = addH(o.type === 'consultation' ? 24 : 72)
          const files = (bb.fileIds ?? []).map((fid) => db().files.find((f) => f.id === fid)).filter(Boolean) as T.FileRef[]
          db().messages.push({ id: uid('m'), orderId: o.id, sender: { id: me().id, name: lawyerName, role: 'lawyer' }, kind: 'delivery', text: bb.message || (o.type === 'consultation' ? 'Konsultatsiya o‘tkazildi.' : 'Ish topshirildi.'), files, createdAt: now(), readAt: null })
          sysMsg(o.id, `Yurist ishni topshirdi. Tasdiqlang yoki ${o.type === 'consultation' ? '24' : '72'} soat ichida e’tiroz bildiring, aks holda buyurtma avtomatik yopiladi.`)
          event(o.id, 'delivered', 'lawyer', 'Ish topshirildi')
          notify(o.clientId, 'order_delivered', 'Ish topshirildi', `${lawyerName} ${o.number} bo‘yicha natijani yubordi.`, { kind: 'order', id: o.id })
          break
        }
        case 'request-revision':
          if (!bb.message?.trim()) fail(400, 'validation', 'Nimani qayta ishlash kerakligini yozing.')
          o.status = 'revision_requested'; o.revisionCount++; o.autoCompleteAt = null
          db().messages.push({ id: uid('m'), orderId: o.id, sender: { id: me().id, name: clientName, role: 'client' }, kind: 'text', text: bb.message!, files: [], createdAt: now(), readAt: null })
          sysMsg(o.id, `Mijoz qayta ishlashni so‘radi (${o.revisionCount}/2).`); event(o.id, 'revision', 'client', 'Qayta ishlash so‘raldi')
          break
        case 'complete':
          o.status = 'completed'; release(o)
          sysMsg(o.id, 'Mijoz ishni tasdiqladi. Pul yurist hisobiga o‘tkazildi.'); event(o.id, 'completed', 'client', 'Buyurtma yakunlandi')
          notify(lawyerById(o.lawyerId)!.userId, 'order_completed', 'Buyurtma yakunlandi', `${o.number}: pul hamyoningizga tushdi.`, { kind: 'wallet', id: o.id })
          break
        case 'dispute':
          o.status = 'disputed'; o.dispute = { id: uid('dp'), status: 'open', reason: bb.reason ?? 'other', openedBy: asLawyer ? 'lawyer' : 'client' }
          sysMsg(o.id, 'Nizo ochildi. Moderator 2 ish kuni ichida ko‘rib chiqadi. Pul shu vaqtgacha platformada saqlanadi.'); event(o.id, 'dispute', asLawyer ? 'lawyer' : 'client', 'Nizo ochildi')
          break
        case 'no-show':
          sysMsg(o.id, 'Kelmaganlik qayd etildi. Moderator tekshiradi.')
          break
      }
      o.updatedAt = now()
      return toOrder(o)
    }),
    cancelPreview: (id) => mutate(() => cancelPolicy(getOrder(id)), 80),
    cancel: (id, reason) => mutate(() => {
      const o = getOrder(id)
      const asLawyer = lawyerById(o.lawyerId)!.userId === me().id
      if (!allowedActions(o, asLawyer).includes('cancel')) fail(409, 'orders.invalid_transition', 'Bu buyurtmani bekor qilib bo‘lmaydi.')
      const { refundAmount } = asLawyer ? { refundAmount: o.paymentId ? o.amount : 0 } : cancelPolicy(o)
      const paid = !!o.paymentId
      o.status = paid ? (refundAmount >= o.amount ? 'refunded' : 'cancelled') : 'cancelled'
      refund(o, refundAmount)
      if (paid && refundAmount < o.amount) { o.amount = o.amount - refundAmount; release(o) }
      sysMsg(o.id, `${asLawyer ? 'Yurist' : 'Mijoz'} buyurtmani bekor qildi${reason ? `: ${reason}` : '.'}${paid ? ` Qaytariladi: ${refundAmount.toLocaleString('ru-RU')} so‘m.` : ''}`)
      event(o.id, 'cancelled', asLawyer ? 'lawyer' : 'client', 'Bekor qilindi')
      o.updatedAt = now()
      return { order: toOrder(o), refundAmount }
    }),
    meeting: (id) => mutate(() => { getOrder(id); return { url: `https://meet.jit.si/huquqchi-demo-${id}`, token: 'demo', expiresAt: addH(1) } }),
    messages: (id, after) => mutate(() => {
      getOrder(id)
      const all = db().messages.filter((m) => m.orderId === id)
      const i = after ? all.findIndex((m) => m.id === after) : -1
      return all.slice(i + 1)
    }, 40),
    send: (id, b) => mutate(() => {
      const o = getOrder(id)
      if (['pending_payment', 'cancelled', 'declined', 'expired', 'refunded'].includes(o.status)) fail(409, 'orders.chat_closed', 'Bu buyurtma chati yopiq.')
      const u = me()
      const isLawyer = lawyerById(o.lawyerId)!.userId === u.id
      const files = b.fileIds.map((fid) => db().files.find((f) => f.id === fid)).filter(Boolean) as T.FileRef[]
      const m = { id: uid('m'), orderId: id, sender: { id: u.id, name: u.name, role: isLawyer ? 'lawyer' as const : 'client' as const }, kind: files.length && !b.text ? 'file' as const : 'text' as const, text: b.text, files, createdAt: now(), readAt: null }
      db().messages.push(m)
      o.updatedAt = now()
      return m
    }, 120),
    read: (id, lastMessageId) => mutate(() => {
      const u = me()
      const all = db().messages.filter((m) => m.orderId === id)
      const upto = all.findIndex((m) => m.id === lastMessageId)
      all.slice(0, upto + 1).forEach((m) => { if (m.sender?.id !== u.id && !m.readAt) m.readAt = now() })
    }, 20),
    sharedConversation: (id) => mutate(() => { const o = getOrder(id); return o.sharedConversationId ? db().chatMessages.filter((m) => m.conversationId === o.sharedConversationId) : [] }),
    review: (id, b) => mutate(() => {
      const o = getOrder(id)
      if (o.status !== 'completed') fail(409, 'reviews.order_not_completed', 'Sharh faqat yakunlangan buyurtmaga yoziladi.')
      if (db().reviews.some((r) => r.orderId === id)) fail(409, 'reviews.already_exists', 'Siz sharh yozgansiz.')
      if (!Number.isInteger(b.rating) || b.rating < 1 || b.rating > 5) fail(400, 'reviews.invalid_rating', 'Baho 1 dan 5 gacha.')
      const l = lawyerById(o.lawyerId)!
      const r = { id: uid('rv'), orderId: id, lawyerId: l.id, rating: b.rating, text: b.text, clientName: shortName(userById(o.clientId).name), serviceTitle: o.title, reply: null, createdAt: now() }
      db().reviews.unshift(r)
      l.rating = Math.round(((l.rating * l.reviewCount + b.rating) / (l.reviewCount + 1)) * 10) / 10
      l.reviewCount++
      notify(l.userId, 'review_received', 'Yangi sharh', `${r.clientName}: ${'★'.repeat(b.rating)}`, { kind: 'review', id: r.id })
      return reviewsOf(l.id).find((x) => x.id === r.id)!
    }),
  },
  reviews: {
    reply: (id, text) => mutate(() => {
      const r = db().reviews.find((x) => x.id === id && x.lawyerId === myLawyer().id) ?? fail(404, 'reviews.not_found', 'Sharh topilmadi.')
      if (r.reply) fail(409, 'reviews.reply_exists', 'Siz javob yozgansiz.')
      r.reply = text
      return reviewsOf(r.lawyerId).find((x) => x.id === id)!
    }),
  },

  // ---- Payments ----
  payments: {
    create: (b) => mutate(() => {
      const u = me()
      let amount = 0
      let title = ''
      if (b.purpose === 'order') {
        const o = getOrder(b.orderId!)
        if (o.status !== 'pending_payment') fail(409, 'orders.invalid_transition', 'Buyurtma to‘lov kutmayapti.')
        amount = o.amount; title = `${o.number} · ${o.title}`
      } else if (b.purpose === 'subscription') {
        const p = PLANS.find((x) => x.code === b.planCode) ?? fail(404, 'plans.not_found', 'Tarif topilmadi.')
        amount = p.prices.find((x) => x.period === (b.period ?? 'month'))?.amount ?? p.prices[0].amount; title = `Obuna · ${p.name}`
      }
      const id = uid('pay')
      const url = new URL(b.returnUrl)
      url.searchParams.set('paymentId', id)
      const p = { id, userId: u.id, purpose: b.purpose, orderId: b.orderId ?? null, amount, currency: 'UZS' as const, provider: b.provider, status: 'pending' as const, checkoutUrl: `/pay/mock?paymentId=${id}&return=${encodeURIComponent(url.toString())}`, expiresAt: addH(0.5), createdAt: now(), paidAt: null, title, receiptUrl: null, refundedAmount: 0, planCode: b.planCode }
      db().payments.push(p)
      return p
    }, 400),
    get: (id) => mutate(() => db().payments.find((p) => p.id === id && p.userId === me().id) ?? fail(404, 'payments.not_found', 'To‘lov topilmadi.'), 80),
    list: () => mutate(() => paged(db().payments.filter((p) => p.userId === me().id && p.status !== 'pending').sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((p) => ({ ...p, title: p.title || (p.orderId ? `${db().orders.find((o) => o.id === p.orderId)?.number} · ${db().orders.find((o) => o.id === p.orderId)?.title}` : 'To‘lov') }))), 100),
  },

  // ---- Wallet ----
  wallet: {
    get: () => mutate(() => wallet(myLawyer()), 100),
    transactions: () => mutate(() => paged(db().walletTx.filter((t) => t.lawyerId === myLawyer().id).slice().reverse()), 100),
    methods: () => mutate(() => db().payoutMethods.filter((m) => m.lawyerId === myLawyer().id), 60),
    addMethod: (b) => mutate(() => {
      const digits = b.cardNumber.replace(/\D/g, '')
      if (!/^(8600|9860|5614|4)\d{12,15}$/.test(digits)) fail(400, 'validation', 'Karta raqami noto‘g‘ri.')
      const l = myLawyer()
      const m = { id: uid('pm'), lawyerId: l.id, type: 'card' as const, maskedNumber: `${digits.slice(0, 4)} •••• •••• ${digits.slice(-4)}`, holderName: b.holderName.toUpperCase(), bankName: digits.startsWith('9860') ? 'Humo' : digits.startsWith('8600') || digits.startsWith('5614') ? 'Uzcard' : 'Visa', isDefault: !db().payoutMethods.some((x) => x.lawyerId === l.id), createdAt: now() }
      db().payoutMethods.push(m)
      return m
    }),
    removeMethod: (id) => mutate(() => { db().payoutMethods = db().payoutMethods.filter((m) => !(m.id === id && m.lawyerId === myLawyer().id)) }),
    payouts: () => mutate(() => paged(db().payouts.filter((p) => p.lawyerId === myLawyer().id).slice().reverse()), 80),
    requestPayout: (b) => mutate(() => {
      const l = myLawyer()
      const w = wallet(l)
      if (b.amount < w.minPayout) fail(422, 'wallet.below_minimum', `Minimal summa ${w.minPayout.toLocaleString('ru-RU')} so‘m.`)
      if (b.amount > w.available) fail(422, 'wallet.insufficient_funds', 'Hisobda yetarli mablag‘ yo‘q.')
      const m = db().payoutMethods.find((x) => x.id === b.payoutMethodId && x.lawyerId === l.id) ?? fail(404, 'wallet.method_not_found', 'Karta topilmadi.')
      const p = { id: uid('po'), lawyerId: l.id, amount: b.amount, fee: 0, status: 'requested' as const, method: m, requestedAt: now(), paidAt: null, failureReason: null }
      db().payouts.push(p)
      const last = db().walletTx.filter((t) => t.lawyerId === l.id).at(-1)?.balanceAfter ?? 0
      db().walletTx.push({ id: uid('tx'), lawyerId: l.id, type: 'payout', amount: -b.amount, balanceAfter: last - b.amount, orderId: null, orderNumber: null, payoutId: p.id, description: `Pul yechish · ${m.maskedNumber}`, status: 'available', availableAt: now(), createdAt: now() })
      return p
    }),
  },
  plans: {
    list: async (audience) => { await wait(60); return PLANS.filter((p) => p.audience === audience) },
    subscribe: async (b) => mockApi.payments.create({ purpose: 'subscription', planCode: b.planCode, period: b.period, provider: b.provider, returnUrl: b.returnUrl }),
    cancel: () => mutate(() => { const u = me(); u.planCode = u.role === 'lawyer' ? 'lawyer_free' : 'client_free' }),
  },
  cases: mockCases,
  pro: mockPro,
  integrations: mockIntegrations,
  notifications: {
    list: () => mutate(() => paged(db().notifications.filter((n) => n.userId === me().id)), 60),
    read: (id) => mutate(() => { const n = db().notifications.find((x) => x.id === id); if (n) n.isRead = true }, 20),
    readAll: () => mutate(() => { const u = me(); db().notifications.forEach((n) => { if (n.userId === u.id) n.isRead = true }) }, 20),
  },
}

// ---- Mock-only helpers ----------------------------------------------------------
/** What the provider webhook does: marks paid and moves the order forward. */
export function mockCompletePayment(paymentId: string, success: boolean) {
  refreshTimers()
  const p = db().payments.find((x) => x.id === paymentId)
  if (!p || p.status !== 'pending') return
  if (!success) { p.status = 'failed'; save(); return }
  p.status = 'paid'; p.paidAt = now()
  if (p.purpose === 'order' && p.orderId) {
    const o = db().orders.find((x) => x.id === p.orderId)!
    o.paymentId = p.id; o.status = 'awaiting_acceptance'
    o.acceptDueAt = o.consultation ? new Date(Math.min(Date.parse(o.consultation.start), Date.now() + 24 * 3600_000)).toISOString() : addH(24)
    sysMsg(o.id, 'To‘lov qabul qilindi. Pul yurist ishni bajarguncha platformada saqlanadi.')
    event(o.id, 'paid', 'client', 'To‘lov qabul qilindi')
    const l = lawyerById(o.lawyerId)!
    notify(l.userId, 'order_paid', 'Yangi buyurtma', `${userById(o.clientId).name}: ${o.title}. 24 soat ichida qabul qiling.`, { kind: 'order', id: o.id })
  }
  if (p.purpose === 'subscription' && p.planCode) userById(p.userId).planCode = p.planCode
  save()
}
export function mockPayment(paymentId: string) { return db().payments.find((x) => x.id === paymentId) ?? null }

// ---- Small internals ------------------------------------------------------------
function conv(id: string) {
  const c = db().conversations.find((x) => x.id === id && x.userId === me().id)
  if (!c) fail(404, 'conversations.not_found', 'Suhbat topilmadi.')
  return c!
}
function toConv(c: ReturnType<typeof conv>): T.Conversation {
  const msgs = db().chatMessages.filter((m) => m.conversationId === c.id)
  return {
    id: c.id, title: c.title, mode: c.mode, category: c.category, lastMessagePreview: msgs.at(-1)?.content.slice(0, 120) ?? null, messageCount: msgs.length,
    documents: c.documentIds.map((d) => db().documents.find((x) => x.id === d)).filter(Boolean).map((d) => ({ id: d!.id, name: d!.name, status: d!.status })),
    createdAt: c.createdAt, updatedAt: c.updatedAt,
  }
}
function doc(id: string) {
  const d = db().documents.find((x) => x.id === id && x.userId === me().id)
  if (!d) fail(404, 'documents.not_found', 'Hujjat topilmadi.')
  return d!
}
const stripDoc = ({ userId: _u, text: _t, ...d }: ReturnType<typeof doc>): T.DocumentItem => d
function blankAnalysis(documentId: string, purpose: string): T.Analysis {
  return { id: uid('an'), documentId, documentVersionId: `dv-${documentId}`, status: 'Queued', purpose, userRole: null, candidateRoles: [], summary: null, parties: [], obligations: [], paymentsAndDeadlines: [], findings: [], findingCounts: { HighAttention: 0, NeedsReview: 0, Information: 0 }, missingInfo: [], suggestions: [], limitations: [], createdAt: now(), completedAt: null }
}
function completeAnalysis(a: T.Analysis) {
  const d = db().documents.find((x) => x.id === a.documentId)
  Object.assign(a, {
    status: 'Completed', completedAt: now(),
    summary: `«${d?.name ?? 'Hujjat'}» bo‘yicha demo tahlil. Haqiqiy backendda matn OCR orqali olinadi va AI har bir topilmani hujjatdagi aniq parchaga bog‘laydi.`,
    findings: [
      { id: uid('f'), title: 'Javobgarlik bandi bir tomonlama', severity: 'NeedsReview', excerpt: '(demo parcha)', location: { page: 1 }, explanation: 'Tomonlarning javobgarligi teng belgilanmagan bo‘lishi mumkin.', recommendation: 'Bandni ikki tomonlama qilib qayta yozing.', citations: [] },
      { id: uid('f'), title: 'Rekvizitlar to‘liq emas', severity: 'Information', excerpt: '(demo parcha)', location: { page: 1 }, explanation: 'Pasport yoki STIR ma’lumotlari yetishmaydi.', recommendation: 'Rekvizitlarni to‘ldiring.', citations: [] },
    ],
    findingCounts: { HighAttention: 0, NeedsReview: 1, Information: 1 },
    missingInfo: ['Imzolangan sana'], suggestions: ['Shartnomani imzolashdan oldin yuristga ko‘rsating'], limitations: ['Demo rejim: haqiqiy matn o‘qilmadi.'],
  })
  if (d) { d.status = 'Ready'; d.lastAnalyzedAt = now() }
}
function draft(id: string) {
  const d = db().drafts.find((x) => x.id === id && x.userId === me().id)
  if (!d) fail(404, 'drafts.not_found', 'Loyiha topilmadi.')
  return d!
}
function render(tpl: T.Template, fields: Record<string, string | null>) {
  const all = tpl.schema.steps.flatMap((s) => s.fields)
  const text = (DRAFT_BODIES[tpl.code] ?? '').replace(/\{(\w+)\}/g, (_, k: string) => {
    const f = all.find((x) => x.key === k)
    let v = fields[k]
    if (v && f?.type === 'money') v = Number(v).toLocaleString('ru-RU')
    if (v && f?.type === 'select') v = f.options?.find((o) => o.value === v)?.label ?? v
    return v?.trim() ? v : `[TO‘LDIRING: ${f?.label ?? k}]`
  })
  return { text, missingRequired: all.filter((f) => f.required && !fields[f.key]?.trim()).map((f) => f.key) }
}
function ownProfile(l: DbLawyer): T.OwnLawyerProfile {
  return { ...toProfile(l), licenseNumber: l.licenseNumber, services: db().services.filter((s) => s.lawyerId === l.id).map(toService), status: l.status, rejectionReason: l.rejectionReason, categoryPrimary: l.categories.find((c) => c.isPrimary)?.code ?? null }
}
function verification(l: DbLawyer): T.Verification {
  return { status: l.status, rejectionReason: l.rejectionReason, submittedAt: l.submittedAt, reviewedAt: l.verifiedAt, requiredKinds: l.type === 'advocate' ? ['passport', 'diploma', 'license', 'selfie'] : ['passport', 'diploma', 'selfie'], documents: l.verificationDocs }
}
function validateService(l: DbLawyer, b: T.ServiceInput) {
  if (b.price < 10000) fail(400, 'validation', 'Narx kamida 10 000 so‘m bo‘lishi kerak.')
  if (b.type === 'consultation' && !b.durationMinutes) fail(400, 'validation', 'Konsultatsiya davomiyligini tanlang.')
  if (b.type !== 'consultation' && !b.deliveryDays) fail(400, 'validation', 'Bajarish muddatini kiriting.')
  if (b.type === 'representation' && l.type !== 'advocate') fail(422, 'lawyer.court_requires_advocate', 'Sudda vakillik xizmati faqat advokatlar uchun.')
  const active = db().services.filter((s) => s.lawyerId === l.id && s.isActive).length
  if (userById(l.userId).planCode === 'lawyer_free' && active >= 5) fail(402, 'limits.services_exceeded', 'Standart tarifda 5 tagacha faol xizmat. Yurist Pro’ga o‘ting.')
}
function wallet(l: DbLawyer): T.Wallet {
  const tx = db().walletTx.filter((t) => t.lawyerId === l.id)
  const available = tx.at(-1)?.balanceAfter ?? 0
  const pending = db().orders.filter((o) => o.lawyerId === l.id && o.paymentId && ['awaiting_acceptance', 'scheduled', 'in_progress', 'delivered', 'revision_requested', 'disputed'].includes(o.status)).reduce((s, o) => s + Math.round(o.amount * (1 - o.commissionRate)), 0)
  const inPayout = db().payouts.filter((p) => p.lawyerId === l.id && ['requested', 'processing'].includes(p.status)).reduce((s, p) => s + p.amount, 0)
  const pro = userById(l.userId).planCode === 'lawyer_pro'
  return {
    currency: 'UZS', available, pending, inPayout,
    totalEarned: tx.filter((t) => t.type === 'order_income' || t.type === 'commission').reduce((s, t) => s + t.amount, 0),
    totalWithdrawn: -tx.filter((t) => t.type === 'payout').reduce((s, t) => s + t.amount, 0),
    minPayout: 50000, commissionRate: pro ? 0.1 : 0.15, canWithdraw: l.status === 'verified', withdrawBlockedReason: l.status === 'verified' ? null : 'Profil tasdiqlanmagan',
  }
}
function cancelPolicy(o: DbOrder) {
  if (!o.paymentId) return { refundAmount: 0, policy: 'To‘lov qilinmagan. Buyurtma shunchaki bekor qilinadi.' }
  if (o.status === 'awaiting_acceptance') return { refundAmount: o.amount, policy: 'Yurist hali qabul qilmagan: pul 100% qaytariladi.' }
  if (o.consultation) {
    const h = (Date.parse(o.consultation.start) - Date.now()) / 3600_000
    if (h > 24) return { refundAmount: o.amount, policy: 'Konsultatsiyaga 24 soatdan ko‘p vaqt bor: 100% qaytariladi.' }
    if (h > 2) return { refundAmount: Math.round(o.amount / 2), policy: 'Konsultatsiyaga 2–24 soat qoldi: 50% qaytariladi, 50% yuristga o‘tadi.' }
    return { refundAmount: 0, policy: 'Konsultatsiyaga 2 soatdan kam qoldi: pul qaytarilmaydi.' }
  }
  return { refundAmount: 0, policy: 'Ish boshlangan. Bekor qilish faqat yurist roziligi yoki nizo orqali.' }
}
function myJob(id: string) {
  const j = db().jobs.find((x) => x.id === id && x.clientId === me().id)
  if (!j) fail(404, 'jobs.not_found', 'E’lon topilmadi.')
  return j!
}
