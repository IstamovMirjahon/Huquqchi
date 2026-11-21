// Mock: lawyer AI Pro, advocate requests, gov integrations (docs/INTEGRATSIYALAR.md).
import type { Api } from '../http'
import { ApiError, tokenStore } from '../http'
import type * as T from '../types'
import constitution from './constitution.json'
import { db, mockUserId, now, save, uid } from './db'

const wait = (ms = 300) => new Promise((r) => setTimeout(r, ms))
const fail = (status: number, code: string, detail: string): never => { throw new ApiError({ status, code, detail }) }
function userId() { const id = mockUserId(tokenStore.get()?.accessToken); if (!id) fail(401, 'auth.unauthorized', 'Qayta kiring.'); return id! }
type Ext = { requests?: (T.AdvocateRequest & { userId: string })[]; filings?: (T.Filing & { userId: string })[] }
const ext = () => db() as unknown as Ext

const SECTIONS = (constitution as { sections: { id: string; n: string | null; t: string | null; x: string; from: string | null; url: string | null }[] }).sections
const cite = (n: string): T.Citation => { const s = SECTIONS.find((x) => x.n === n)!; return { sectionId: s.id, legalDocumentId: 'lexuz-6445145', versionId: 'lexuz-6445145-current', documentTitle: 'O‘zbekiston Respublikasi Konstitutsiyasi', articleNumber: s.n, articleTitle: s.t, editionDate: s.from, officialUrl: s.url, isRepealed: false, quote: s.x.slice(0, 260) } }
const DISCLAIMER = 'AI tavsiyasi. Sudga yoki davlat organiga yuborishdan oldin yurist tekshiradi va javobgar bo‘ladi.'

/** Catalogue from the 21.11.2026 research (docs/INTEGRATSIYALAR.md §1). Nothing here is "live". */
export const INTEGRATIONS: T.Integration[] = [
  { code: 'my_sud', name: 'my.sud.uz (E-XSUD)', category: 'court', description: 'Sudga da’vo, ariza va shikoyatni elektron topshirish; ish holati va majlis jadvali.', status: 'assisted', mode: 'Platforma paket tayyorlaydi, topshirishni siz portalda bajarasiz.', officialUrl: 'https://my.sud.uz', platformProvides: ['Da’vo arizasi yoki shikoyat (PDF)', 'Ilovalar ro‘yxati', 'Portalda qadamlar', 'Topshirgandan keyin raqam va muddatlarni kuzatish'], requiresContract: false, sources: ['https://www.lex.uz/docs/-4953647'] },
  { code: 'my_gov', name: 'my.gov.uz (Yagona interaktiv davlat xizmatlari portali)', category: 'gov_services', description: '500+ davlat organi xizmatlari: ariza, ma’lumotnoma, to‘lov.', status: 'assisted', mode: 'Kerakli xizmatga havola va tayyorlanadigan hujjatlar ro‘yxati.', officialUrl: 'https://my.gov.uz', platformProvides: ['Xizmatni topish', 'Hujjatlar ro‘yxati', 'Natijani ishga biriktirish'], requiresContract: false, sources: ['https://uz.wikipedia.org/wiki/YIDXP'] },
  { code: 'e_notarius', name: 'e-notarius.uz', category: 'justice', description: 'Onlayn notarial harakatlar: OneID, Face-ID, ERI yoki SMS bilan imzolash.', status: 'assisted', mode: 'Hujjat loyihasini tayyorlaymiz, notarial harakatni siz portalda rasmiylashtirasiz.', officialUrl: 'https://e-notarius.uz', platformProvides: ['Ishonchnoma yoki shartnoma loyihasi', 'Kerakli ma’lumotlar ro‘yxati'], requiresContract: false, sources: ['https://www.gazeta.uz/oz/2021/12/27/e-notarius/'] },
  { code: 'murojaat', name: 'murojaat.gov.uz', category: 'appeals', description: 'Davlat organlariga murojaatlar bilan ishlash yagona platformasi.', status: 'assisted', mode: 'Murojaat matnini tayyorlaymiz, siz yuborasiz va raqamni kiritasiz.', officialUrl: 'https://murojaat.gov.uz', platformProvides: ['Murojaat matni', 'Javob muddatini kuzatish'], requiresContract: false, sources: ['https://murojaat.gov.uz/oz'] },
  { code: 'mib', name: 'Majburiy ijro byurosi (mib.uz)', category: 'enforcement', description: 'Qarzdorlik, chiqish taqiqi, mulkka cheklovni tekshirish; Majburiyatlar reyestri.', status: 'planned', mode: 'Hozir: rasmiy saytda o‘zingiz tekshirasiz. Keyin: mijoz roziligi bilan avtomatik tekshiruv (kelishuv kerak).', officialUrl: 'https://mib.uz', platformProvides: ['Ijro hujjati raqamini ishga biriktirish'], requiresContract: true, sources: ['https://kun.uz/news/2026/02/23/mibdan-qarzdorlikni-qanday-tekshirish-mumkin'] },
  { code: 'e_advokat', name: 'e-advokat.uz («Yuridik yordam» axborot tizimi)', category: 'justice', description: 'Advokatlar tizimi; elektron orderlarni Mobile-ID bilan tasdiqlash.', status: 'negotiating', mode: 'Litsenziyani avtomatik tekshirish uchun Adliya vazirligi bilan kelishuv kerak. Hozir moderator qo‘lda tekshiradi.', officialUrl: 'https://e-advokat.uz', platformProvides: ['«Tasdiqlangan advokat» belgisi'], requiresContract: true, sources: ['https://e-advokat.uz/'] },
  { code: 'oneid', name: 'OneID', category: 'identity', description: 'Yagona identifikatsiya tizimi: davlat va tijorat xizmatlariga kirish.', status: 'planned', mode: 'Tadbirkorlik subyektlari uchun shartnoma asosida pullik ulanadi.', officialUrl: 'https://e-gov.uz/en/projects/one-id', platformProvides: ['OneID bilan kirish', 'Shaxsni tasdiqlash'], requiresContract: true, sources: ['https://e-gov.uz/en/projects/one-id'] },
  { code: 'myid', name: 'MyID', category: 'identity', description: 'Biometrik masofaviy identifikatsiya (REST API, SDK).', status: 'planned', mode: 'Yurist KYC va mijoz identifikatsiyasi uchun, UZINFOCOM bilan shartnoma.', officialUrl: 'https://myid.uz', platformProvides: ['Yurist tekshiruvini tezlashtirish'], requiresContract: true, sources: ['https://myid.uz/en/produkty'] },
  { code: 'e_imzo', name: 'E-IMZO (ERI)', category: 'signature', description: 'Hujjatlarni elektron raqamli imzo bilan imzolash.', status: 'planned', mode: 'Brauzerda imzolash va imzoni tekshirish, provayder orqali.', officialUrl: 'https://e-imzo.uz', platformProvides: ['Shartnoma va arizalarni imzolash'], requiresContract: true, sources: ['https://edoline.uz/en/features/e-signature'] },
  { code: 'vakolat', name: 'vakolat.uz (elektron ishonchnomalar)', category: 'justice', description: 'Adliya vazirligining elektron ishonchnoma platformasi (2026-yildan rejalashtirilgan).', status: 'planned', mode: 'Ishga tushgani tasdiqlangach baholanadi.', officialUrl: 'https://vakolat.uz', platformProvides: ['Mijozdan yuristga ishonchnoma'], requiresContract: true, sources: ['https://www.spot.uz/oz/2025/12/27/vakolat-uz'] },
  { code: 'lex', name: 'lex.uz va sud qarorlari bazasi', category: 'legal_data', description: 'Milliy qonunchilik bazasi va sud qarorlari qidiruvi.', status: 'negotiating', mode: 'Qonun matnlari import qilinmoqda; foydalanish shartlari va sud qarorlari uchun Adliya vazirligi bilan kelishuv.', officialUrl: 'https://lex.uz', platformProvides: ['AI javoblaridagi moddalar', 'O‘xshash sud qarorlari (keyin)'], requiresContract: true, sources: ['https://lex.uz/uz/statistic'] },
  { code: 'kadastr', name: 'Kadastr agentligi (my.gov.uz orqali)', category: 'property', description: 'Ko‘chmas mulk ko‘chirmasi va ro‘yxatdan o‘tkazish.', status: 'assisted', mode: 'my.gov.uz’dagi xizmatga havola va kerakli hujjatlar.', officialUrl: 'https://gov.uz/oz/kadastr', platformProvides: ['Ko‘chirmani ishga biriktirish'], requiresContract: false, sources: ['https://gov.uz/oz/kadastr/sections/elektron-hukumat'] },
]

const PORTAL_STEPS: Record<string, string[]> = {
  my_sud: ['my.sud.uz ga OneID bilan kiring', 'Ish turini tanlang (fuqarolik, iqtisodiy, ma’muriy)', 'Tomonlar ma’lumotlarini to‘liq kiriting', 'Da’vo arizasi PDF va ilovalarni yuklang', 'Davlat bojini portalda ko‘rsatilgan summada to‘lang', 'Yuborgach, ariza raqamini shu yerga kiriting'],
  my_gov: ['my.gov.uz ga OneID bilan kiring', 'Tashkilot va xizmatni qidiring', 'Ariza shaklini to‘ldiring va hujjatlarni yuklang', 'Ariza raqamini shu yerga kiriting'],
  e_notarius: ['e-notarius.uz ga OneID bilan kiring', 'Notarial harakat turini tanlang', 'Face-ID bilan shaxsni tasdiqlang', 'ERI yoki SMS kod bilan imzolang va to‘lang'],
  murojaat: ['murojaat.gov.uz ga kiring', 'Organni tanlang', 'Murojaat matnini joylang va ilovalarni yuklang', 'Murojaat raqamini shu yerga kiriting'],
}

export const mockIntegrations: Api['integrations'] = {
  list: async () => { await wait(150); return INTEGRATIONS },
  filings: async () => { await wait(120); const u = userId(); return (ext().filings ?? []).filter((f) => f.userId === u).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) },
  createFiling: async (b) => {
    await wait(500)
    const it = INTEGRATIONS.find((x) => x.code === b.portal && x.status === 'assisted') ?? fail(422, 'integrations.not_assisted', 'Bu portal uchun paket tayyorlab bo‘lmaydi.')
    const doc = b.documentId ? db().documents.find((d) => d.id === b.documentId) : null
    const draft = b.draftId ? db().drafts.find((d) => d.id === b.draftId) : null
    const name = doc?.name ?? (draft ? `${draft.name}.pdf` : 'Hujjat.pdf')
    const f = {
      id: uid('fl'), userId: userId(), portal: it.code, status: 'prepared' as const, title: `${it.name}: ${name}`,
      package: {
        files: [{ id: uid('f'), name, mime: 'application/pdf', size: 120000, url: '#' }],
        checklist: [{ label: `${name}`, done: true }, { label: 'Tomonlarning to‘liq rekvizitlari', done: false }, { label: 'Ilovalar (dalillar) PDF formatida', done: false }, ...(it.code === 'my_sud' ? [{ label: 'Davlat boji to‘lov kvitansiyasi', done: false }] : [])],
        steps: PORTAL_STEPS[it.code] ?? [],
        stateFee: { amount: null, basis: null, note: 'Davlat boji stavkasi yuridik muharrir tasdiqlagan konfiguratsiyada hali yo‘q. Portalda ko‘rsatilgan summani to‘lang.' },
      },
      externalRef: null, submittedAt: null, createdAt: now(), orderId: b.orderId ?? null, caseId: b.caseId ?? null,
    }
    ;(ext().filings ??= []).push(f); save()
    return f
  },
  updateFiling: async (id, b) => {
    await wait(150)
    const f = (ext().filings ?? []).find((x) => x.id === id && x.userId === userId()) ?? fail(404, 'filings.not_found', 'Paket topilmadi.')
    if (b.status) f.status = b.status
    if (b.externalRef !== undefined) f.externalRef = b.externalRef
    if (b.submittedAt !== undefined) f.submittedAt = b.submittedAt
    if (b.checklist) f.package.checklist = b.checklist
    save(); return f
  },
}

export const mockPro: Api['pro'] = {
  bundleAnalysis: async (b) => {
    await wait(1600)
    if (!b.documentIds.length) fail(400, 'validation', 'Kamida bitta hujjat tanlang.')
    const docs = b.documentIds.map((id) => db().documents.find((d) => d.id === id)).filter(Boolean)
    const first = docs[0]!.id
    return {
      id: uid('ba'), status: 'completed',
      timeline: [
        { date: '2026-08-01', event: 'Mehnat shartnomasi tuzilgan (demo)', source: { documentId: first, page: 1 } },
        { date: '2026-09-05', event: 'Avgust oyi ish haqi to‘lanmagan (demo)', source: null },
        { date: '2026-10-28', event: 'Ishdan bo‘shatish buyrug‘i (demo)', source: { documentId: docs.at(-1)!.id, page: 1 } },
      ],
      parties: [{ name: '«Alfa» MChJ (demo)', role: 'Ish beruvchi' }, { name: 'Mijoz', role: 'Xodim' }],
      amounts: [{ label: 'To‘lanmagan ish haqi (demo)', value: '12 000 000 so‘m', source: null }],
      contradictions: docs.length > 1 ? [{ text: 'Buyruqdagi bo‘shatish asosi shartnomadagi lavozim majburiyatlariga mos kelmaydi (demo)', sources: docs.slice(0, 2).map((d) => ({ documentId: d!.id, page: 1 })) }] : [],
      missingEvidence: ['Ish haqi to‘langanligi haqida bank ko‘chirmasi', 'Ogohlantirish xati yoki uning yo‘qligi haqida dalil', 'Ish beruvchi bilan yozishmalar'],
      citations: [cite('42')],
      limitations: ['Demo rejim: hujjat matni o‘qilmadi, natija namuna. Haqiqiy tahlilda har bir fakt hujjat sahifasiga bog‘lanadi.'],
      disclaimer: DISCLAIMER,
    }
  },
  position: async (b) => {
    await wait(1400)
    if (!(b.text?.trim() || b.orderId || b.caseId)) fail(400, 'validation', 'Ish mazmunini yozing yoki buyurtmani tanlang.')
    return {
      summary: 'Mijoz pozitsiyasi: mehnat huquqlari buzilgan, ish haqi va kompensatsiya undirilishi kerak. Pozitsiya kuchi asosan yozma dalillarga bog‘liq (demo).',
      arguments: [
        { claim: 'Mehnat uchun haq olish huquqi buzilgan', basis: [cite('42')], evidenceNeeded: ['Mehnat shartnomasi', 'Bank ko‘chirmasi'], counter: 'Ish beruvchi ish haqi naqd to‘langanini da’vo qilishi mumkin: imzolangan vedomostni so‘rang.', strength: 'strong' },
        { claim: 'Huquqlarni himoya qilish va malakali yuridik yordam olish', basis: [cite('55'), cite('29')], evidenceNeeded: ['Ish beruvchiga yuborilgan talabnoma'], counter: 'Talabnoma yuborilmagan bo‘lsa, ish beruvchi nizoni kutilmagan deb ko‘rsatishi mumkin.', strength: 'medium' },
      ],
      risks: ['Murojaat muddatini o‘tkazib yuborish xavfi: aniq muddatni tekshiring', 'Norasmiy to‘langan qismni isbotlash qiyin'],
      nextSteps: ['Advokat so‘rovi orqali ish haqi hisob-kitobini so‘rang', 'Talabnoma yuboring va javob muddatini belgilang', 'Da’vo arizasi loyihasini tayyorlang'],
      confidence: 'medium', disclaimer: DISCLAIMER,
    }
  },
  requests: async () => {
    await wait(120); const u = userId()
    const list = (ext().requests ?? []).filter((r) => r.userId === u)
    const today = new Date().toISOString().slice(0, 10)
    list.forEach((r) => { if (r.status === 'sent' && r.dueAt && r.dueAt < today) r.status = 'overdue' })
    return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  },
  createRequest: async (b) => {
    await wait(); if (!b.recipient.name.trim() || !b.subject.trim()) fail(400, 'validation', 'Qabul qiluvchi va mavzuni kiriting.')
    const r = { id: uid('rq'), userId: userId(), recipient: { name: b.recipient.name, address: b.recipient.address ?? null }, subject: b.subject, questions: b.questions.filter(Boolean), text: '', status: 'draft' as const, sentAt: null, dueAt: null, answerFiles: [], orderId: b.orderId ?? null, caseId: null, createdAt: now() }
    ;(ext().requests ??= []).push(r); save(); return r
  },
  requestDraft: async (id) => {
    await wait(1200)
    const r = (ext().requests ?? []).find((x) => x.id === id && x.userId === userId()) ?? fail(404, 'requests.not_found', 'So‘rov topilmadi.')
    const lawyer = db().users.find((u) => u.id === userId())!
    const lp = db().lawyers.find((l) => l.userId === lawyer.id)
    r.text = `${r.recipient.name} rahbariga\n${r.recipient.address ? `${r.recipient.address}\n` : ''}\nADVOKAT SO‘ROVI\n\nMen, advokat ${lawyer.name}${lp?.licenseNumber ? ` (litsenziya № ${lp.licenseNumber})` : ''}, ishonch bildiruvchim manfaatlarini himoya qilish maqsadida quyidagi ma’lumot va hujjatlarni taqdim etishingizni so‘rayman:\n\n${r.questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}\n\nMavzu: ${r.subject}.\n\nJavobni yozma shaklda quyidagi manzilga yuborishingizni so‘rayman: ____________.\n\nIlova: ishonchnoma (order) nusxasi.\n\nSana: ____________   Imzo: ____________\n\n[TO‘LDIRING: so‘rov yuborish huquqining qonuniy asosi va javob muddati yuridik muharrir tasdiqlagan matndan qo‘yiladi]`
    save(); return r
  },
  updateRequest: async (id, b) => {
    await wait(150)
    const r = (ext().requests ?? []).find((x) => x.id === id && x.userId === userId()) ?? fail(404, 'requests.not_found', 'So‘rov topilmadi.')
    Object.assign(r, Object.fromEntries(Object.entries(b).filter(([, v]) => v !== undefined)))
    if (b.status === 'sent' && !r.sentAt) r.sentAt = now()
    save(); return r
  },
  deleteRequest: async (id) => {
    await wait(100); const u = userId()
    const r = (ext().requests ?? []).find((x) => x.id === id && x.userId === u)
    if (r && r.status !== 'draft') fail(409, 'requests.not_draft', 'Yuborilgan so‘rovni o‘chirib bo‘lmaydi.')
    ext().requests = (ext().requests ?? []).filter((x) => x.id !== id); save()
  },
}
