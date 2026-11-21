// In-browser "database" for the mock backend, persisted to localStorage.
import type * as T from '../types'
import { DRAFT_BODIES, LAWYERS, REVIEW_TEXTS, SERVICES, TEMPLATES, cat } from './seed'

export interface DbUser {
  id: string; name: string; phone: string; email: string | null; role: T.UserRole; lawyerStatus: T.LawyerStatus | null
  lawyerProfileId: string | null; planCode: string; language: T.Language; createdAt: string
}
export interface DbLawyer {
  id: string; userId: string; type: T.LawyerType; headline: string; bio: string
  categories: { code: T.CategoryCode; isPrimary: boolean }[]; region: string; city: string; languages: T.Language[]
  workFormats: T.WorkFormat[]; experienceYears: number; rating: number; reviewCount: number; completedOrders: number
  responseTimeMinutes: number; isOnline: boolean; isPromoted: boolean; education: T.Education[]; licenseNumber: string | null
  officeAddress: string | null; status: T.LawyerStatus; rejectionReason: string | null; verifiedAt: string | null
  schedule: T.Schedule; verificationDocs: T.Verification['documents']; submittedAt: string | null; createdAt: string; hue: number
}
export interface DbService extends Omit<T.Service, 'category'> { category: T.CategoryCode }
export interface DbJob {
  id: string; clientId: string; title: string; description: string; aiSummary: string | null; category: T.CategoryCode
  serviceType: T.ServiceType | null; budgetMin: number | null; budgetMax: number | null; deadline: string | null
  region: string | null; format: 'online' | 'office' | 'any'; status: T.JobStatus; orderId: string | null
  sourceConversationId: string | null; sharedDocumentIds: string[]; shareConversation: boolean; createdAt: string
}
export interface DbOffer { id: string; jobId: string; lawyerId: string; price: number; deliveryDays: number; message: string; status: T.OfferStatus; createdAt: string }
export interface DbOrder {
  id: string; number: string; type: T.OrderType; status: T.OrderStatus; title: string; description: string
  category: T.CategoryCode | null; clientId: string; lawyerId: string; serviceId: string | null; jobId: string | null; offerId: string | null
  amount: number; commissionRate: number
  consultation: { start: string; end: string; format: T.ConsultationFormat } | null
  deliveryDays: number | null; acceptDueAt: string | null; deliveryDueAt: string | null; autoCompleteAt: string | null
  revisionCount: number; paymentId: string | null; sharedConversationId: string | null; sharedDocumentIds: string[]
  aiSummary: string | null; dispute: T.Order['dispute']; createdAt: string; updatedAt: string
}
export interface DbMessage extends T.OrderMessage {}
export interface DbReview { id: string; orderId: string | null; lawyerId: string; rating: number; text: string; clientName: string; serviceTitle: string; reply: string | null; createdAt: string }
export interface DbPayment extends T.Payment { userId: string; planCode?: string }
export interface DbConversation { id: string; userId: string; title: string; mode: 'client' | 'professional'; category: T.CategoryCode | null; documentIds: string[]; createdAt: string; updatedAt: string }
export interface DbChatMessage extends T.Message { conversationId: string }
export interface DbDocument extends T.DocumentItem { userId: string; text: string }
export interface DbAnalysis extends T.Analysis { userId: string }
export interface DbDraft extends T.Draft { userId: string }
export interface DbNotification extends T.Notification { userId: string }
export interface DbWalletTx extends T.WalletTransaction { lawyerId: string }
export interface DbPayoutMethod extends T.PayoutMethod { lawyerId: string }
export interface DbPayout extends T.Payout { lawyerId: string }
export interface DbFile extends T.FileRef { blobUrl?: string }

export interface Db {
  version: number; seq: number
  users: DbUser[]; lawyers: DbLawyer[]; services: DbService[]; jobs: DbJob[]; offers: DbOffer[]
  orders: DbOrder[]; messages: DbMessage[]; events: (T.OrderEvent & { orderId: string })[]; reviews: DbReview[]
  payments: DbPayment[]; conversations: DbConversation[]; chatMessages: DbChatMessage[]
  documents: DbDocument[]; analyses: DbAnalysis[]; drafts: DbDraft[]; notifications: DbNotification[]
  walletTx: DbWalletTx[]; payoutMethods: DbPayoutMethod[]; payouts: DbPayout[]; files: DbFile[]
  usage: Record<string, number>
}

const KEY = 'hq-mock-db'
const VERSION = 3

export const now = () => new Date().toISOString()
export const addH = (h: number, from = Date.now()) => new Date(from + h * 3600_000).toISOString()
const dayAt = (daysFromToday: number, hourTashkent: number, min = 0) => {
  const d = new Date()
  d.setUTCHours(hourTashkent - 5, min, 0, 0)
  d.setUTCDate(d.getUTCDate() + daysFromToday)
  return d.toISOString()
}

export function defaultSchedule(): T.Schedule {
  return {
    timezone: 'Asia/Tashkent', slotMinutes: 30, bufferMinutes: 0, minNoticeHours: 2, maxDaysAhead: 30, isAcceptingBookings: true,
    weekly: [1, 2, 3, 4, 5, 6, 7].map((weekday) => ({
      weekday,
      intervals: weekday <= 5 ? [{ start: '09:00', end: '13:00' }, { start: '14:00', end: '18:00' }] : weekday === 6 ? [{ start: '10:00', end: '14:00' }] : [],
    })),
    exceptions: [],
  }
}

function seed(): Db {
  const db: Db = {
    version: VERSION, seq: 10300, users: [], lawyers: [], services: [], jobs: [], offers: [], orders: [], messages: [], events: [],
    reviews: [], payments: [], conversations: [], chatMessages: [], documents: [], analyses: [], drafts: [], notifications: [],
    walletTx: [], payoutMethods: [], payouts: [], files: [], usage: {},
  }
  const created = addH(-24 * 200)
  db.users.push(
    { id: 'u-client', name: 'Aziza Karimova', phone: '+998901112233', email: null, role: 'client', lawyerStatus: null, lawyerProfileId: null, planCode: 'client_free', language: 'uz-Latn', createdAt: addH(-24 * 40) },
  )
  for (const l of LAWYERS) {
    db.users.push({ id: l.userId, name: l.name, phone: l.userId === 'u-lawyer' ? '+998907778899' : `+99890${Math.floor(1e6 + Math.random() * 8e6)}`, email: null, role: 'lawyer', lawyerStatus: 'verified', lawyerProfileId: l.id, planCode: l.id === 'lw-2' ? 'lawyer_pro' : 'lawyer_free', language: 'uz-Latn', createdAt: created })
    db.lawyers.push({
      id: l.id, userId: l.userId, type: l.type, headline: l.headline, bio: l.bio,
      categories: l.cats.map((code, i) => ({ code, isPrimary: i === 0 })), region: l.region, city: l.city, languages: l.languages,
      workFormats: l.workFormats, experienceYears: l.experienceYears, rating: l.rating, reviewCount: l.reviewCount,
      completedOrders: l.completedOrders, responseTimeMinutes: l.responseTimeMinutes, isOnline: l.isOnline, isPromoted: l.isPromoted,
      education: l.education, licenseNumber: l.licenseNumber, officeAddress: l.officeAddress, status: 'verified', rejectionReason: null,
      verifiedAt: addH(-24 * 180), schedule: defaultSchedule(), verificationDocs: [], submittedAt: addH(-24 * 182), createdAt: created, hue: l.hue,
    })
    REVIEW_TEXTS.forEach(([rating, text, name], i) => {
      if ((i + l.hue) % 3 === 0 && i > 2) return
      db.reviews.push({ id: `rv-${l.id}-${i}`, orderId: null, lawyerId: l.id, rating, text, clientName: name, serviceTitle: 'Konsultatsiya', reply: i === 0 ? 'Rahmat! Sizga yordam bera olganimdan xursandman.' : null, createdAt: addH(-24 * (i * 9 + 3)) })
    })
  }
  SERVICES.forEach(([lawyerId, type, c, title, description, price, priceType, durationMinutes, deliveryDays, formats, ordersCount], i) => {
    db.services.push({ id: `sv-${i + 1}`, lawyerId, type, category: c, title, description, price, priceType, durationMinutes, deliveryDays, formats, isActive: true, ordersCount, createdAt: addH(-24 * (100 - i)) })
  })

  // Client's documents & conversation
  db.documents.push(
    { id: 'doc-1', userId: 'u-client', name: 'Ijara shartnomasi Chilonzor.pdf', origin: 'Uploaded', status: 'Ready', contentType: 'application/pdf', sizeBytes: 182044, tags: ['ijara'], createdAt: addH(-24 * 6), lastAnalyzedAt: addH(-24 * 6 + 1), pageCount: 4, text: '' },
    { id: 'doc-2', userId: 'u-client', name: 'Bo‘shatish to‘g‘risida buyruq.jpg', origin: 'Chat', status: 'Saved', contentType: 'image/jpeg', sizeBytes: 912300, tags: ['mehnat'], createdAt: addH(-30), lastAnalyzedAt: null, pageCount: 1, text: '' },
  )
  db.analyses.push({
    id: 'an-1', userId: 'u-client', documentId: 'doc-1', documentVersionId: 'dv-1', status: 'Completed', purpose: 'Bekor qilish va garov bandlarini tekshirish', userRole: 'Men ijarachiman', candidateRoles: [],
    summary: 'Turar joy ijarasi shartnomasi: 12 oy muddatga, oylik to‘lov va garov belgilangan. Ijaraga beruvchiga bir tomonlama bekor qilish huquqi berilgan, ijarachi uchun esa bunday band yo‘q.',
    parties: [{ name: 'Karimov A.', role: 'Ijaraga beruvchi' }, { name: 'Karimova A.', role: 'Ijarachi' }],
    obligations: [{ party: 'Ijarachi', items: ['Har oyning 5-sanasigacha to‘lash', 'Uyni yaxshi holatda saqlash'] }, { party: 'Ijaraga beruvchi', items: ['Uyni yashashga yaroqli holatda topshirish'] }],
    paymentsAndDeadlines: [{ label: 'Oylik to‘lov', value: '3 000 000 so‘m, har oyning 5-sanasigacha' }, { label: 'Garov', value: '3 000 000 so‘m' }],
    findings: [
      { id: 'f1', title: 'Bir tomonlama bekor qilish', severity: 'HighAttention', excerpt: 'Ijaraga beruvchi shartnomani istalgan vaqtda bekor qilishga haqli.', location: { page: 2, clause: '5.3' }, explanation: 'Band faqat bir tomonga huquq beradi, ogohlantirish muddati ko‘rsatilmagan.', recommendation: 'Kamida 30 kunlik yozma ogohlantirish va ikki tomonga teng huquq talab qiling.', citations: [] },
      { id: 'f2', title: 'Garovni qaytarish muddati yo‘q', severity: 'NeedsReview', excerpt: 'Garov summasi shartnoma tugaganda qaytariladi.', location: { page: 3, clause: '6.1' }, explanation: 'Qaytarish muddati va ushlab qolish asoslari aniq emas.', recommendation: '«Shartnoma tugaganidan keyin 5 ish kuni ichida» deb aniqlashtiring.', citations: [] },
      { id: 'f3', title: 'Kommunal to‘lovlar', severity: 'Information', excerpt: 'Kommunal to‘lovlarni ijarachi to‘laydi.', location: { page: 2, clause: '4.2' }, explanation: 'Odatiy band.', recommendation: 'Hisoblagich ko‘rsatkichlarini topshirish dalolatnomasiga yozing.', citations: [] },
    ],
    findingCounts: { HighAttention: 1, NeedsReview: 1, Information: 1 }, missingInfo: ['Uyni topshirish-qabul qilish dalolatnomasi ilova qilinmagan'],
    suggestions: ['5.3-bandni ikki tomonlama qiling', 'Garov qaytarish muddatini yozing'], limitations: ['Demo tahlil: ma’lumotlar namuna.'],
    createdAt: addH(-24 * 6 + 1), completedAt: addH(-24 * 6 + 1),
  })

  // Jobs from other clients + Aziza's job with offers
  const otherClients = [
    ['u-c2', 'Jasur Toshmatov'], ['u-c3', 'Malika Rasulova'], ['u-c4', 'Otabek Nazarov'],
  ]
  otherClients.forEach(([id, name]) => db.users.push({ id, name, phone: `+99893${Math.floor(1e6 + Math.random() * 8e6)}`, email: null, role: 'client', lawyerStatus: null, lawyerProfileId: null, planCode: 'client_free', language: 'uz-Latn', createdAt: addH(-24 * 90) }))
  const jobs: [string, string, string, string, T.CategoryCode, T.ServiceType, number, number, string | null, 'online' | 'office' | 'any', number][] = [
    ['job-1', 'u-client', 'Ishga tiklash bo‘yicha da’vo arizasi kerak', 'Oktabr oxirida ogohlantirishsiz ishdan bo‘shatildim. Buyruq nusxasi bor. Sudga ariza tayyorlab, iloji bo‘lsa sudda vakillik qiladigan yurist kerak.', 'labor', 'document_drafting', 200000, 500000, 'tashkent_city', 'any', 30],
    ['job-2', 'u-c2', 'Kvartira oldi-sotdi hujjatlarini tekshirish', 'Ikkilamchi bozordan kvartira olmoqchiman. Kadastr va sotuvchi hujjatlarini tekshirib berish kerak.', 'housing', 'document_review', 150000, 300000, 'tashkent_city', 'online', 6],
    ['job-3', 'u-c3', 'Aliment miqdorini oshirish', 'Sobiq turmush o‘rtog‘im 2 yildan beri bir xil aliment to‘laydi. Miqdorni qayta ko‘rib chiqish mumkinmi?', 'family', 'consultation', 100000, 200000, 'samarkand', 'any', 3],
    ['job-4', 'u-c4', 'YaTT uchun shartnoma shablonlari', 'Dizayn xizmatlari ko‘rsataman, mijozlar bilan ishlash uchun shartnoma va dalolatnoma shablonlari kerak.', 'business', 'document_drafting', 300000, 600000, null, 'online', 10],
    ['job-5', 'u-c2', 'Sifatsiz telefon uchun pulni qaytarish', 'Do‘kon 2 haftada buzilgan telefonni qaytarib olmayapti. Talabnoma va keyingi qadamlar kerak.', 'consumer', 'question', 50000, 120000, 'tashkent_city', 'online', 1],
  ]
  for (const [id, clientId, title, description, c, st, min, max, region, format, hoursAgo] of jobs) {
    db.jobs.push({ id, clientId, title, description, aiSummary: null, category: c, serviceType: st, budgetMin: min, budgetMax: max, deadline: dayAt(10, 18).slice(0, 10), region, format, status: 'open', orderId: null, sourceConversationId: null, sharedDocumentIds: [], shareConversation: false, createdAt: addH(-hoursAgo) })
  }
  db.offers.push(
    { id: 'of-1', jobId: 'job-1', lawyerId: 'lw-8', price: 400000, deliveryDays: 4, message: 'Mehnat nizolari bo‘yicha katta tajribam bor. Arizani tayyorlab, sud majlisida ham qatnashishim mumkin (alohida kelishiladi).', status: 'pending', createdAt: addH(-20) },
    { id: 'of-2', jobId: 'job-1', lawyerId: 'lw-6', price: 300000, deliveryDays: 3, message: 'Buyruq nusxasi va mehnat shartnomasini ko‘rib, 3 kunda ariza tayyorlayman.', status: 'pending', createdAt: addH(-8) },
  )

  // Orders
  const mkOrder = (o: Partial<DbOrder> & Pick<DbOrder, 'id' | 'type' | 'status' | 'title' | 'clientId' | 'lawyerId' | 'amount'>): DbOrder => ({
    number: `HQ-${++db.seq}`, description: '', category: null, serviceId: null, jobId: null, offerId: null, commissionRate: 0.15, consultation: null,
    deliveryDays: null, acceptDueAt: null, deliveryDueAt: null, autoCompleteAt: null, revisionCount: 0, paymentId: null,
    sharedConversationId: null, sharedDocumentIds: [], aiSummary: null, dispute: null, createdAt: addH(-48), updatedAt: addH(-2), ...o,
  })
  const pay = (orderId: string, userId: string, amount: number, at: string): string => {
    const id = `pay-${orderId}`
    db.payments.push({ id, userId, purpose: 'order', orderId, amount, currency: 'UZS', provider: 'payme', status: 'paid', checkoutUrl: null, expiresAt: at, createdAt: at, paidAt: at, title: '', receiptUrl: null, refundedAmount: 0 })
    return id
  }
  const o1 = mkOrder({ id: 'ord-1', type: 'consultation', status: 'scheduled', title: 'Onlayn konsultatsiya, 30 daqiqa', description: 'Ishdan bo‘shatish masalasida maslahat kerak. Buyruq nusxasini ilova qildim.', category: 'labor', clientId: 'u-client', lawyerId: 'lw-1', serviceId: 'sv-1', amount: 150000,
    consultation: { start: dayAt(1, 11), end: dayAt(1, 11, 30), format: 'video' }, sharedDocumentIds: ['doc-2'], aiSummary: 'Mijoz oktabr oxirida ogohlantirishsiz ishdan bo‘shatilgan. Mehnat shartnomasi muddatsiz. Ishga tiklanish yoki kompensatsiya olish imkoniyatini bilmoqchi.', createdAt: addH(-26) })
  o1.paymentId = pay(o1.id, 'u-client', o1.amount, addH(-26))
  const o2 = mkOrder({ id: 'ord-2', type: 'service', status: 'delivered', title: 'Ijara shartnomasini tekshirish', description: 'Chilonzordagi kvartira uchun shartnoma. Imzolashdan oldin tekshirtirmoqchiman.', category: 'housing', clientId: 'u-client', lawyerId: 'lw-2', serviceId: 'sv-5', amount: 120000, commissionRate: 0.10,
    deliveryDays: 2, deliveryDueAt: addH(20), autoCompleteAt: addH(60), sharedDocumentIds: ['doc-1'], createdAt: addH(-40) })
  o2.paymentId = pay(o2.id, 'u-client', o2.amount, addH(-40))
  const o3 = mkOrder({ id: 'ord-3', type: 'question', status: 'completed', title: 'Tezkor yozma savol', description: 'Sinov muddatida ishdan bo‘shatish mumkinmi?', category: 'labor', clientId: 'u-client', lawyerId: 'lw-1', serviceId: 'sv-2', amount: 70000, createdAt: addH(-24 * 20), updatedAt: addH(-24 * 19) })
  o3.paymentId = pay(o3.id, 'u-client', o3.amount, addH(-24 * 20))
  const o4 = mkOrder({ id: 'ord-4', type: 'question', status: 'awaiting_acceptance', title: 'Tezkor yozma savol', description: 'Ish beruvchi oxirgi oylik maoshni bermayapti. Qayerga shikoyat qilsam bo‘ladi?', category: 'labor', clientId: 'u-c3', lawyerId: 'lw-1', serviceId: 'sv-2', amount: 70000, acceptDueAt: addH(21), createdAt: addH(-3) })
  o4.paymentId = pay(o4.id, 'u-c3', o4.amount, addH(-3))
  const o5 = mkOrder({ id: 'ord-5', type: 'consultation', status: 'scheduled', title: 'Onlayn konsultatsiya, 30 daqiqa', description: 'Ajrim jarayoni haqida maslahat', category: 'family', clientId: 'u-c4', lawyerId: 'lw-1', serviceId: 'sv-1', amount: 150000, consultation: { start: dayAt(0, 16), end: dayAt(0, 16, 30), format: 'audio' }, createdAt: addH(-30) })
  o5.paymentId = pay(o5.id, 'u-c4', o5.amount, addH(-30))
  const o6 = mkOrder({ id: 'ord-6', type: 'service', status: 'in_progress', title: 'Ishga tiklash bo‘yicha da’vo arizasi', description: 'Ishdan noqonuniy bo‘shatilgan, ariza kerak.', category: 'labor', clientId: 'u-c2', lawyerId: 'lw-1', serviceId: 'sv-3', amount: 350000, deliveryDays: 3, deliveryDueAt: addH(30), createdAt: addH(-42) })
  o6.paymentId = pay(o6.id, 'u-c2', o6.amount, addH(-42))
  db.orders.push(o1, o2, o3, o4, o5, o6)

  db.reviews.unshift({ id: 'rv-o3', orderId: 'ord-3', lawyerId: 'lw-1', rating: 5, text: 'Aniq va tushunarli javob, modda raqamlari bilan.', clientName: 'Aziza K.', serviceTitle: 'Tezkor yozma savol', reply: null, createdAt: addH(-24 * 19) })

  const sys = (orderId: string, text: string, at: string) => db.messages.push({ id: `m-${db.messages.length + 1}`, orderId, sender: null, kind: 'system', text, files: [], createdAt: at, readAt: at })
  const msg = (orderId: string, uid: string, name: string, role: 'client' | 'lawyer', text: string, at: string, kind: T.OrderMessage['kind'] = 'text') =>
    db.messages.push({ id: `m-${db.messages.length + 1}`, orderId, sender: { id: uid, name, role }, kind, text, files: [], createdAt: at, readAt: at })
  sys('ord-1', 'To‘lov qabul qilindi. Pul yurist ishni bajarguncha platformada saqlanadi.', addH(-26))
  sys('ord-1', 'Yurist buyurtmani qabul qildi.', addH(-25))
  msg('ord-1', 'u-lawyer', 'Dilshod Rahimov', 'lawyer', 'Assalomu alaykum, Aziza! Buyruq nusxasini ko‘rdim. Konsultatsiyaga mehnat shartnomangizni ham tayyorlab qo‘ying, iltimos.', addH(-24))
  msg('ord-1', 'u-client', 'Aziza Karimova', 'client', 'Vaalaykum assalom, albatta. Rahmat!', addH(-23))
  sys('ord-2', 'To‘lov qabul qilindi.', addH(-40))
  sys('ord-2', 'Yurist buyurtmani qabul qildi.', addH(-39))
  msg('ord-2', 'u-lw-2', 'Madina Yusupova', 'lawyer', 'Shartnomani ko‘rib chiqdim. Xulosa va tuzatilgan bandlar ilova qilindi. 5.3 va 6.1-bandlarga alohida e’tibor bering.', addH(-12), 'delivery')
  sys('ord-2', 'Yurist ishni topshirdi. Tasdiqlang yoki 72 soat ichida qayta ishlashni so‘rang.', addH(-12))
  sys('ord-4', 'To‘lov qabul qilindi. Yurist 24 soat ichida qabul qilishi kerak.', addH(-3))
  sys('ord-6', 'Yurist buyurtmani qabul qildi.', addH(-41))

  for (const o of db.orders) db.events.push({ id: `ev-${o.id}-1`, orderId: o.id, type: 'created', actor: 'client', text: 'Buyurtma yaratildi', createdAt: o.createdAt })

  // Lawyer wallet history (Dilshod)
  let bal = 0
  const tx = (type: T.WalletTransaction['type'], amount: number, desc: string, h: number, status: 'pending' | 'available' = 'available', orderNumber: string | null = null) => {
    bal += amount
    db.walletTx.push({ id: `tx-${db.walletTx.length + 1}`, lawyerId: 'lw-1', type, amount, balanceAfter: bal, orderId: null, orderNumber, payoutId: null, description: desc, status, availableAt: null, createdAt: addH(-h) })
  }
  ;[['HQ-10180', 250000, 400], ['HQ-10195', 150000, 300], ['HQ-10211', 350000, 200], ['HQ-10240', 150000, 120], ['HQ-10266', 700000, 90]].forEach(([n, a, h]) => {
    tx('order_income', a as number, `${n} · buyurtma`, h as number, 'available', n as string)
    tx('commission', -Math.round((a as number) * 0.15), `${n} · komissiya 15%`, h as number, 'available', n as string)
  })
  tx('payout', -900000, 'Pul yechish · 8600 •••• 4417', 60)
  tx('order_income', 70000, `${o3.number} · buyurtma`, 24 * 19, 'available', o3.number)
  tx('commission', -10500, `${o3.number} · komissiya 15%`, 24 * 19, 'available', o3.number)
  db.payoutMethods.push({ id: 'pm-1', lawyerId: 'lw-1', type: 'card', maskedNumber: '8600 •••• •••• 4417', holderName: 'DILSHOD RAHIMOV', bankName: 'Uzcard', isDefault: true, createdAt: addH(-24 * 100) })
  db.payouts.push({ id: 'po-1', lawyerId: 'lw-1', amount: 900000, fee: 0, status: 'paid', method: db.payoutMethods[0], requestedAt: addH(-62), paidAt: addH(-60), failureReason: null })

  db.notifications.push(
    { id: 'n-1', userId: 'u-client', type: 'order_delivered', title: 'Ish topshirildi', body: 'Madina Yusupova ijara shartnomasi tekshiruvini topshirdi.', link: { kind: 'order', id: 'ord-2' }, isRead: false, createdAt: addH(-12) },
    { id: 'n-2', userId: 'u-client', type: 'offer_received', title: 'Yangi taklif', body: 'E’loningizga Gulnora Saidova taklif yubordi: 300 000 so‘m.', link: { kind: 'job', id: 'job-1' }, isRead: false, createdAt: addH(-8) },
    { id: 'n-3', userId: 'u-lawyer', type: 'order_paid', title: 'Yangi buyurtma', body: 'Malika Rasulova tezkor savol yubordi. 24 soat ichida qabul qiling.', link: { kind: 'order', id: 'ord-4' }, isRead: false, createdAt: addH(-3) },
    { id: 'n-4', userId: 'u-lawyer', type: 'consultation_reminder', title: 'Bugun konsultatsiya', body: 'Otabek Nazarov bilan bugun 16:00 da audio konsultatsiya.', link: { kind: 'order', id: 'ord-5' }, isRead: false, createdAt: addH(-1) },
  )
  return db
}

let cache: Db | null = null
export function db(): Db {
  if (cache) return cache
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? (JSON.parse(raw) as Db) : null
    cache = parsed && parsed.version === VERSION ? parsed : seed()
  } catch {
    cache = seed()
  }
  return cache
}
export function save() {
  if (cache) localStorage.setItem(KEY, JSON.stringify(cache))
}
export function resetDb() {
  localStorage.removeItem(KEY)
  cache = null
}

/** Mock identity: a mock token in demo mode, or the real user bridged in hybrid mode. */
let bridged: string | null = null
export function setBridgedUser(id: string | null) { bridged = id }
export function mockUserId(token: string | undefined): string | null {
  if (token?.startsWith('mock:')) return token.slice(5)
  return bridged
}

export const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 10)}`
export const nextNumber = () => `HQ-${++db().seq}`
export { DRAFT_BODIES, TEMPLATES, cat }
