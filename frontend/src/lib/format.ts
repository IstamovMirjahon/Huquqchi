import type { ConsultationFormat, DocumentStatus, FindingSeverity, LawyerType, OrderStatus, OrderType, PaymentStatus, ServiceType, WorkFormat } from '../api/types'

export const money = (n: number | null | undefined) => (n == null ? '—' : `${Math.round(n).toLocaleString('ru-RU').replace(/,/g, ' ')} so‘m`)
export const moneyShort = (n: number) => (n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString('ru-RU', { maximumFractionDigits: 1 })} mln` : `${Math.round(n / 1000)} ming`)

const MONTHS = ['yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun', 'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr']
const WD = ['Yak', 'Dush', 'Sesh', 'Chor', 'Pay', 'Jum', 'Shan']
const tz = (iso: string) => new Date(new Date(iso).getTime() + 5 * 3600_000) // Asia/Tashkent
export const time = (iso: string) => tz(iso).toISOString().slice(11, 16)
export const date = (iso: string) => { const d = tz(iso.length === 10 ? `${iso}T00:00:00Z` : iso); return `${d.getUTCDate()}-${MONTHS[d.getUTCMonth()]}` }
export const dateFull = (iso: string) => { const d = tz(iso.length === 10 ? `${iso}T00:00:00Z` : iso); return `${d.getUTCDate()}-${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` }
export const dateTime = (iso: string) => `${date(iso)}, ${time(iso)}`
export const weekday = (isoDate: string) => WD[new Date(`${isoDate}T00:00:00Z`).getUTCDay()]
export const dayNum = (isoDate: string) => Number(isoDate.slice(8, 10))
export const todayTashkent = () => tz(new Date().toISOString()).toISOString().slice(0, 10)
export const addDays = (isoDate: string, n: number) => new Date(Date.parse(`${isoDate}T00:00:00Z`) + n * 86400_000).toISOString().slice(0, 10)

export function ago(iso: string) {
  const s = (Date.now() - Date.parse(iso)) / 1000
  if (s < 60) return 'hozirgina'
  if (s < 3600) return `${Math.floor(s / 60)} daqiqa oldin`
  if (s < 86400) return `${Math.floor(s / 3600)} soat oldin`
  if (s < 86400 * 7) return `${Math.floor(s / 86400)} kun oldin`
  return dateFull(iso)
}
export function until(iso: string) {
  const s = (Date.parse(iso) - Date.now()) / 1000
  if (s <= 0) return 'muddati o‘tdi'
  if (s < 3600) return `${Math.ceil(s / 60)} daqiqa`
  if (s < 86400) return `${Math.floor(s / 3600)} soat`
  return `${Math.floor(s / 86400)} kun`
}
export const fileSize = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${(b / 1024).toFixed(0)} KB` : `${(b / 1048576).toFixed(1)} MB`)
export const initials = (name: string) => name.split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase()
export const hueOf = (s: string) => [...s].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)
export const plural = (n: number, word: string) => `${n.toLocaleString('ru-RU')} ta ${word}`

type Tone = 'lapis' | 'gold' | 'success' | 'warning' | 'danger' | 'teal' | '' | 'ink'
export const ORDER_STATUS: Record<OrderStatus, [string, Tone]> = {
  pending_payment: ['To‘lov kutilmoqda', 'warning'],
  awaiting_acceptance: ['Yurist javobini kutmoqda', 'lapis'],
  scheduled: ['Rejalashtirilgan', 'teal'],
  in_progress: ['Jarayonda', 'lapis'],
  delivered: ['Topshirildi', 'gold'],
  revision_requested: ['Qayta ishlashda', 'warning'],
  completed: ['Yakunlandi', 'success'],
  cancelled: ['Bekor qilindi', ''],
  declined: ['Rad etildi', 'danger'],
  expired: ['Muddati o‘tdi', ''],
  disputed: ['Nizo', 'danger'],
  refunded: ['Pul qaytarildi', ''],
}
export const ORDER_TYPE: Record<OrderType, string> = { consultation: 'Konsultatsiya', question: 'Tezkor savol', service: 'Xizmat', job: 'E’lon bo‘yicha' }
export const SERVICE_TYPE: Record<ServiceType, string> = {
  consultation: 'Konsultatsiya', question: 'Tezkor savol', document_review: 'Hujjat tekshirish',
  document_drafting: 'Hujjat tuzish', representation: 'Sudda vakillik', other: 'Boshqa xizmat',
}
export const FORMAT: Record<ConsultationFormat, string> = { video: 'Video', audio: 'Audio', chat: 'Chat', office: 'Ofisda' }
export const WORK_FORMAT: Record<WorkFormat, string> = { online: 'Onlayn', office: 'Ofisda', court: 'Sudda vakillik' }
export const LAWYER_TYPE: Record<LawyerType, string> = { advocate: 'Advokat', legal_consultant: 'Yuridik maslahatchi' }
export const LANG: Record<string, string> = { 'uz-Latn': 'O‘zbekcha', 'uz-Cyrl': 'Ўзбекча', ru: 'Ruscha' }
export const PAYMENT_STATUS: Record<PaymentStatus, [string, Tone]> = {
  pending: ['Kutilmoqda', 'warning'], paid: ['To‘langan', 'success'], failed: ['Muvaffaqiyatsiz', 'danger'],
  cancelled: ['Bekor qilingan', ''], refunded: ['Qaytarilgan', ''], partially_refunded: ['Qisman qaytarilgan', 'gold'],
}
export const DOC_STATUS: Record<DocumentStatus, [string, Tone]> = {
  Saved: ['Saqlangan', ''], Processing: ['Tahlil qilinmoqda', 'lapis'], Ready: ['Tahlil tayyor', 'success'],
  Failed: ['Xatolik', 'danger'], Draft: ['Loyiha', 'gold'], Deleted: ['O‘chirilgan', ''],
}
export const SEVERITY: Record<FindingSeverity, [string, Tone]> = {
  HighAttention: ['Yuqori e’tibor', 'danger'], NeedsReview: ['Tekshirish kerak', 'warning'], Information: ['Ma’lumot', 'lapis'],
}
export const PROVIDERS = [
  { code: 'payme' as const, name: 'Payme', color: '#33cccc' },
  { code: 'click' as const, name: 'Click', color: '#0074ff' },
  { code: 'uzum' as const, name: 'Uzum Bank', color: '#7000ff' },
]
