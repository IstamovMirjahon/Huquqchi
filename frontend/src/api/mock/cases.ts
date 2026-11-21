// Mock "Ishlarim" (Legal Case Assistant). Plans mirror what ai-service /v1/cases/plan returns
// (docs/AI_SERVICE_API.md §3.7); calculators mirror Core API §4a.6 (deterministic code, no AI).
import type { Api } from '../http'
import { ApiError, tokenStore } from '../http'
import type * as T from '../types'
import constitution from './constitution.json'
import { addH, db, mockUserId, now, save, uid } from './db'
import { cat } from './seed'

export interface DbCase {
  id: string; userId: string; title: string; category: T.CategoryCode; status: T.CaseStatus; summary: string
  facts: T.Case['facts']; steps: T.CaseStep[]; deadlines: T.CaseDeadline[]; events: T.CaseEvent[]
  amounts: T.Case['amounts']; linkIds: { conversations: string[]; documents: string[]; drafts: string[]; orders: string[] }
  createdAt: string; updatedAt: string
}

const DISCLAIMER = 'Reja AI tavsiyasi. Har bir qadamni siz tasdiqlaysiz. AI yakuniy yuridik qaror chiqarmaydi: sudga yoki davlat organiga murojaat qilish kabi muhim qadamlardan oldin yurist bilan maslahatlashing.'
const fail = (status: number, code: string, detail: string): never => { throw new ApiError({ status, code, detail }) }
const wait = (ms = 250) => new Promise((r) => setTimeout(r, ms))

type StepSeed = [T.CaseStepKind, string, string, T.CaseStepAction]
const PLANS: Record<string, { match: RegExp; category: T.CategoryCode; title: string; steps: StepSeed[]; deadlines: [string, number, T.CaseDeadline['kind'], string | null][] }> = {
  wages: { match: /(ish haqi|maosh|oylik).*(ber|to.?la)|to.?lanmagan|ololmay/i, category: 'labor', title: 'Ish haqini undirish',
    steps: [
      ['analyze', 'Vaziyatni tahlil qilish', 'AI vaziyatingizni va qo‘llanadigan qonunchilikni tushuntiradi.', { type: 'chat' }],
      ['check_document', 'Mehnat shartnomasini tekshirish', 'Shartnomadagi ish haqi miqdori, to‘lov muddati va tomonlar majburiyatlarini AI tekshiradi.', { type: 'analyze_document' }],
      ['collect', 'Dalillarni yig‘ish', 'Hisob-kitob varaqlari, bank ko‘chirmasi, buyruqlar, ish beruvchi bilan yozishmalar.', { type: 'upload_document' }],
      ['calculate', 'Talab summasini hisoblash', 'To‘lanmagan oylar va boshqa to‘lovlar bo‘yicha summa.', { type: 'calculator', calculator: 'unpaid_wages' }],
      ['draft', 'Ish beruvchiga talabnoma tayyorlash', 'Hisoblangan summa va muddat ko‘rsatilgan yozma talab.', { type: 'create_draft', templateCode: 'claim_letter' }],
      ['send', 'Talabnomani topshirish', 'Ikki nusxada topshiring, birinchisiga qabul qilinganini yozdirib oling. Topshirgan sanani belgilang.', { type: 'mark_sent' }],
      ['authority', 'Keyingi murojaat yo‘lini tanlash', 'Javob bo‘lmasa: mehnat inspeksiyasi yoki sudga murojaat. Qaysi yo‘l to‘g‘ri ekanini yurist bilan aniqlang.', { type: 'find_lawyer', serviceType: 'consultation' }],
      ['track', 'Natijani qayd etish', 'Pul to‘langanmi, qisman to‘langanmi: natijani yozing va ishni yoping.', { type: 'none' }],
    ],
    deadlines: [['Murojaat muddatini yurist bilan aniqlash', 7, 'legal', 'Mehnat nizolari bo‘yicha murojaat muddatlari cheklangan. Aniq muddatni tekshiring.']] },
  dismissal: { match: /bo.?shat|ishdan (chiqar|hayda)|ogohlantirmasdan/i, category: 'labor', title: 'Ishdan bo‘shatish ustidan nizo',
    steps: [
      ['analyze', 'Vaziyatni tahlil qilish', 'Bo‘shatish asosi va tartibi qonunga mosmi, AI dastlabki tahlil beradi.', { type: 'chat' }],
      ['collect', 'Buyruq va hujjatlarni yig‘ish', 'Bo‘shatish buyrug‘i, mehnat shartnomasi, mehnat daftarchasi yozuvi.', { type: 'upload_document' }],
      ['check_document', 'Buyruq va shartnomani tekshirish', 'AI buyruqdagi asos va shartnoma shartlarini solishtiradi.', { type: 'analyze_document' }],
      ['lawyer', 'Yurist bilan maslahatlashish', 'Ishga tiklanish yoki kompensatsiya: qaror yuridik oqibatga ega, yurist bilan hal qiling.', { type: 'find_lawyer', serviceType: 'consultation' }],
      ['draft', 'Ariza yoki talabnoma tayyorlash', 'Yurist bilan tanlangan yo‘l bo‘yicha hujjat.', { type: 'create_draft', templateCode: 'claim_letter' }],
      ['send', 'Hujjatni topshirish', 'Topshirgan sanani belgilang.', { type: 'mark_sent' }],
      ['track', 'Natijani qayd etish', 'Qaror va keyingi qadamlarni yozing.', { type: 'none' }],
    ],
    deadlines: [['Sudga murojaat muddatini yurist bilan aniqlash', 3, 'legal', 'Ishga tiklash bo‘yicha murojaat muddati qisqa bo‘lishi mumkin. Kechiktirmang.']] },
  deposit: { match: /garov|depozit|ijara/i, category: 'housing', title: 'Ijara garovini qaytarish',
    steps: [
      ['analyze', 'Vaziyatni tahlil qilish', 'AI ijara munosabatlari bo‘yicha huquqlaringizni tushuntiradi.', { type: 'chat' }],
      ['check_document', 'Ijara shartnomasini tekshirish', 'Garov, uni qaytarish va ushlab qolish shartlari.', { type: 'analyze_document' }],
      ['collect', 'Dalillarni yig‘ish', 'To‘lov cheklari, topshirish dalolatnomasi, uy holati suratlari, yozishmalar.', { type: 'upload_document' }],
      ['calculate', 'Qaytariladigan summani hisoblash', 'Garov va asosli ushlab qolishlar.', { type: 'calculator', calculator: 'deposit_return' }],
      ['draft', 'Ijaraga beruvchiga talabnoma', 'Summa va qaytarish muddati ko‘rsatilgan talab.', { type: 'create_draft', templateCode: 'claim_letter' }],
      ['send', 'Talabnomani yuborish', 'Yuborgan sanani belgilang.', { type: 'mark_sent' }],
      ['authority', 'Javob bo‘lmasa: sudga murojaat', 'Da’vo arizasini yurist bilan tayyorlang.', { type: 'find_lawyer', serviceType: 'document_drafting' }],
      ['track', 'Natijani qayd etish', '', { type: 'none' }],
    ],
    deadlines: [] },
  refund: { match: /tovar|do.?kon|sotuvchi|qaytar|sifatsiz|buzil/i, category: 'consumer', title: 'Sifatsiz tovar uchun pulni qaytarish',
    steps: [
      ['analyze', 'Vaziyatni tahlil qilish', 'Iste’molchi sifatidagi huquqlaringiz.', { type: 'chat' }],
      ['collect', 'Chek va kafolat talonini saqlash', 'Chek, kafolat taloni, nuqson suratlari, sotuvchi bilan yozishmalar.', { type: 'upload_document' }],
      ['calculate', 'Talab summasini hisoblash', 'Tovar narxi va bog‘liq xarajatlar.', { type: 'calculator', calculator: 'goods_refund' }],
      ['draft', 'Sotuvchiga talabnoma', 'Pulni qaytarish yoki almashtirish talabi.', { type: 'create_draft', templateCode: 'claim_letter' }],
      ['send', 'Talabnomani topshirish', 'Nusxasiga qabul belgisini qo‘ydiring.', { type: 'mark_sent' }],
      ['authority', 'Keyingi murojaat', 'Javob bo‘lmasa: iste’molchilar huquqlarini himoya qiluvchi organ yoki sud. Yo‘lni yurist bilan aniqlang.', { type: 'find_lawyer', serviceType: 'question' }],
      ['track', 'Natijani qayd etish', '', { type: 'none' }],
    ],
    deadlines: [] },
}
const GENERIC = { category: 'other' as T.CategoryCode, title: 'Huquqiy masala', steps: [
  ['analyze', 'Vaziyatni tahlil qilish', 'AI savollar berib, vaziyatni aniqlashtiradi.', { type: 'chat' }],
  ['collect', 'Hujjatlarni yig‘ish', 'Vaziyatga oid barcha hujjatlarni yuklang.', { type: 'upload_document' }],
  ['lawyer', 'Yurist bilan maslahatlashish', 'Keyingi yo‘lni mutaxassis bilan aniqlang.', { type: 'find_lawyer', serviceType: 'consultation' }],
  ['track', 'Natijani qayd etish', '', { type: 'none' }],
] as StepSeed[], deadlines: [] as [string, number, T.CaseDeadline['kind'], string | null][] }

function userId() {
  const id = mockUserId(tokenStore.get()?.accessToken)
  if (!id) fail(401, 'auth.unauthorized', 'Qayta kiring.')
  return id!
}
const store = () => ((db() as unknown as { cases?: DbCase[] }).cases ??= [])
function own(id: string) { const c = store().find((x) => x.id === id && x.userId === userId()); if (!c) fail(404, 'cases.not_found', 'Ish topilmadi.'); return c! }
const log = (c: DbCase, text: string, actor: T.CaseEvent['actor'] = 'user') => { c.events.unshift({ id: uid('ce'), text, actor, createdAt: now() }); c.updatedAt = now() }

export function buildCase(userIdArg: string, input: T.CaseInput, firstQuestion?: string): DbCase {
  const text = `${input.title ?? ''} ${input.situation} ${firstQuestion ?? ''}`
  const plan = Object.values(PLANS).find((p) => p.match.test(text)) ?? GENERIC
  const category = input.category ?? plan.category
  const c: DbCase = {
    id: uid('case'), userId: userIdArg, title: input.title?.trim() || plan.title, category, status: 'active',
    summary: input.situation.trim(),
    facts: [{ label: 'Ochilgan sana', value: new Date().toLocaleDateString('ru-RU') }],
    steps: plan.steps.map(([kind, title, description, action], i) => ({ id: uid('st'), order: i + 1, kind, title, description, action, status: 'todo', dueAt: null, completedAt: null, result: null, source: 'ai' })),
    deadlines: plan.deadlines.map(([title, days, kind, note]) => ({ id: uid('dl'), title, date: addH(24 * days).slice(0, 10), kind, done: false, note, source: 'ai' })),
    events: [], amounts: { claimed: null, recovered: null },
    linkIds: { conversations: input.sourceConversationId ? [input.sourceConversationId] : [], documents: [], drafts: [], orders: [] },
    createdAt: now(), updatedAt: now(),
  }
  if (input.sourceConversationId) { c.steps[0].status = 'done'; c.steps[0].completedAt = now(); c.steps[0].result = 'AI suhbatida tahlil qilindi' }
  log(c, 'Ish ochildi. AI bosqichma-bosqich reja tuzdi.', 'ai')
  return c
}

function toCase(c: DbCase): T.Case {
  const d = db()
  const live = c.steps.filter((s) => s.status !== 'skipped')
  const next = c.steps.find((s) => s.status === 'todo' || s.status === 'in_progress')
  const nearest = c.deadlines.filter((x) => !x.done).sort((a, b) => a.date.localeCompare(b.date))[0] ?? null
  return {
    id: c.id, title: c.title, category: cat(c.category), status: c.status,
    progress: { done: live.filter((s) => s.status === 'done').length, total: live.length },
    nextStep: next ? { id: next.id, title: next.title } : null, nearestDeadline: nearest, amountClaimed: c.amounts.claimed, updatedAt: c.updatedAt,
    summary: c.summary, facts: c.facts, steps: c.steps, deadlines: [...c.deadlines].sort((a, b) => a.date.localeCompare(b.date)), events: c.events, amounts: c.amounts,
    links: {
      conversations: c.linkIds.conversations.map((id) => d.conversations.find((x) => x.id === id)).filter(Boolean).map((x) => ({ id: x!.id, title: x!.title })),
      documents: c.linkIds.documents.map((id) => d.documents.find((x) => x.id === id)).filter(Boolean).map((x) => ({ id: x!.id, name: x!.name })),
      drafts: c.linkIds.drafts.map((id) => d.drafts.find((x) => x.id === id)).filter(Boolean).map((x) => ({ id: x!.id, name: x!.name })),
      orders: c.linkIds.orders.map((id) => d.orders.find((x) => x.id === id)).filter(Boolean).map((x) => ({ id: x!.id, number: x!.number, title: x!.title, status: x!.status })),
    },
    disclaimer: DISCLAIMER, createdAt: c.createdAt,
  }
}
const toItem = (c: DbCase): T.CaseListItem => { const { id, title, category, status, progress, nextStep, nearestDeadline, amountClaimed, updatedAt } = toCase(c); return { id, title, category, status, progress, nextStep, nearestDeadline, amountClaimed, updatedAt } }

const SECTIONS = (constitution as { sections: { id: string; n: string | null; t: string | null; x: string; from: string | null; url: string | null }[] }).sections
const cite = (n: string): T.Citation => { const s = SECTIONS.find((x) => x.n === n)!; return { sectionId: s.id, legalDocumentId: 'lexuz-6445145', versionId: 'lexuz-6445145-current', documentTitle: 'O‘zbekiston Respublikasi Konstitutsiyasi', articleNumber: s.n, articleTitle: s.t, editionDate: s.from, officialUrl: s.url, isRepealed: false, quote: s.x.slice(0, 300) } }

export function calculate(code: T.CalculatorCode, i: Record<string, number>): T.CalcResult {
  const n = (k: string) => Math.max(0, Math.round(i[k] || 0))
  if (code === 'unpaid_wages') {
    const wages = n('monthlySalary') * n('months')
    const breakdown = [{ label: `Ish haqi: ${n('monthlySalary').toLocaleString('ru-RU')} × ${n('months')} oy`, amount: wages }]
    if (n('otherUnpaid')) breakdown.push({ label: 'Boshqa to‘lanmagan summalar (mukofot, ta’til puli)', amount: n('otherUnpaid') })
    return { calculator: code, total: breakdown.reduce((s, x) => s + x.amount, 0), breakdown, citations: [cite('42')],
      notes: ['Summa soliq ushlanmasidan oldingi (hisoblangan) ish haqi asosida.', 'Ish haqi kechiktirilgani uchun qo‘shimcha kompensatsiya qonunchilikda nazarda tutilgan bo‘lishi mumkin. Uning miqdorini yurist bilan aniqlang: kalkulyator uni hisoblamaydi.'] }
  }
  if (code === 'deposit_return') {
    const total = Math.max(0, n('deposit') - n('deductions'))
    return { calculator: code, total, breakdown: [{ label: 'Garov summasi', amount: n('deposit') }, { label: 'Asosli ushlab qolishlar (zarar, qarz)', amount: -n('deductions') }], citations: [cite('47')],
      notes: ['Ushlab qolish faqat shartnomada yoki dalolatnomada asoslangan bo‘lsa to‘g‘ri hisoblanadi.'] }
  }
  return { calculator: code, total: n('price') + n('expenses'), breakdown: [{ label: 'Tovar narxi', amount: n('price') }, { label: 'Bog‘liq xarajatlar (yetkazish, ta’mir)', amount: n('expenses') }], citations: [cite('55')],
    notes: ['Chek va kafolat taloni asosiy dalil hisoblanadi.'] }
}

export const mockCases: Api['cases'] = {
  list: async (status) => { await wait(120); const u = userId(); return store().filter((c) => c.userId === u && (!status || c.status === status)).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).map(toItem) },
  create: async (b) => {
    await wait(900)
    if (b.situation.trim().length < 20) fail(400, 'validation', 'Vaziyatni batafsilroq yozing (kamida 20 belgi).')
    const firstQ = b.sourceConversationId ? db().chatMessages.find((m) => m.conversationId === b.sourceConversationId && m.role === 'user')?.content : undefined
    const c = buildCase(userId(), b, firstQ)
    store().push(c); save()
    return toCase(c)
  },
  get: async (id) => { await wait(80); return toCase(own(id)) },
  update: async (id, b) => {
    await wait(); const c = own(id)
    if (b.title) c.title = b.title
    if (b.amounts) c.amounts = { ...c.amounts, ...b.amounts }
    if (b.status && b.status !== c.status) { c.status = b.status; log(c, b.status === 'resolved' ? 'Ish hal qilindi deb belgilandi.' : b.status === 'active' ? 'Ish qayta ochildi.' : 'Ish yopildi.') }
    save(); return toCase(c)
  },
  updateStep: async (id, stepId, b) => {
    await wait(150); const c = own(id)
    const s = c.steps.find((x) => x.id === stepId) ?? fail(404, 'cases.step_not_found', 'Qadam topilmadi.')
    if (b.status) { s.status = b.status; s.completedAt = b.status === 'done' ? now() : null; log(c, `«${s.title}»: ${{ done: 'bajarildi', skipped: 'o‘tkazib yuborildi', todo: 'qayta ochildi', in_progress: 'boshlandi' }[b.status]}`) }
    if (b.result !== undefined) s.result = b.result
    if (b.dueAt !== undefined) s.dueAt = b.dueAt
    if (s.kind === 'send' && b.status === 'done' && !c.deadlines.some((d) => d.kind === 'response')) {
      c.deadlines.push({ id: uid('dl'), title: 'Talabnomaga javob muddati', date: addH(24 * 10).slice(0, 10), kind: 'response', done: false, note: 'Talabnomada ko‘rsatgan muddatingiz. Kerak bo‘lsa o‘zgartiring.', source: 'ai' })
    }
    save(); return toCase(c)
  },
  addStep: async (id, b) => { await wait(); const c = own(id); c.steps.push({ id: uid('st'), order: c.steps.length + 1, kind: 'custom', title: b.title, description: b.description ?? '', action: { type: 'none' }, status: 'todo', dueAt: null, completedAt: null, result: null, source: 'user' }); log(c, `Qadam qo‘shildi: «${b.title}»`); save(); return toCase(c) },
  addDeadline: async (id, b) => { await wait(); const c = own(id); c.deadlines.push({ id: uid('dl'), title: b.title, date: b.date, kind: b.kind, done: false, note: b.note ?? null, source: 'user' }); log(c, `Muddat qo‘shildi: «${b.title}»`); save(); return toCase(c) },
  updateDeadline: async (id, dlId, b) => { await wait(100); const c = own(id); const d = c.deadlines.find((x) => x.id === dlId); if (d) d.done = b.done; save(); return toCase(c) },
  link: async (id, b) => {
    await wait(120); const c = own(id)
    const key = ({ document: 'documents', conversation: 'conversations', draft: 'drafts', order: 'orders' } as const)[b.kind]
    if (!c.linkIds[key].includes(b.refId)) c.linkIds[key].push(b.refId)
    if (b.stepId) { const s = c.steps.find((x) => x.id === b.stepId); if (s && s.status !== 'done') { s.status = 'done'; s.completedAt = now(); log(c, `«${s.title}»: bajarildi`) } }
    save(); return toCase(c)
  },
  calculate: async (id, b) => {
    await wait(300); const c = own(id)
    const r = calculate(b.calculator, b.inputs)
    c.amounts.claimed = r.total
    if (b.stepId) { const s = c.steps.find((x) => x.id === b.stepId); if (s) { s.status = 'done'; s.completedAt = now(); s.result = `${r.total.toLocaleString('ru-RU')} so‘m` } }
    log(c, `Talab summasi hisoblandi: ${r.total.toLocaleString('ru-RU')} so‘m`)
    save(); return r
  },
  replan: async (id) => { await wait(800); const c = own(id); log(c, 'AI rejani ko‘rib chiqdi: o‘zgartirish talab qilinmadi.', 'ai'); save(); return toCase(c) },
}

/** Seed one case for the demo client. */
export function seedCases() {
  const list = store()
  if (list.some((c) => c.userId === 'u-client')) return
  const c = buildCase('u-client', { title: 'Ishdan bo‘shatish va oxirgi oylik', situation: 'Oktabr oxirida ogohlantirishsiz ishdan bo‘shatildim, oxirgi ikki oylik ish haqi ham berilmagan. Mehnat shartnomam muddatsiz.', category: 'labor' }, 'maosh to‘lanmagan')
  c.steps[0].status = 'done'; c.steps[0].completedAt = addH(-28); c.steps[0].result = 'AI suhbatida tahlil qilindi'
  c.steps[2].status = 'done'; c.steps[2].completedAt = addH(-27)
  c.linkIds.documents.push('doc-2'); c.linkIds.orders.push('ord-1')
  c.createdAt = addH(-30)
  log(c, 'Yurist bilan konsultatsiya bron qilindi (HQ-10301).')
  list.push(c)
}
