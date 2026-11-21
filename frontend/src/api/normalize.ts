// Tolerant mappers: accept both the current backend shapes (Swagger, 21.11.2026) and the
// target shapes in docs/BACKEND_API.md, so the UI keeps working while the backend catches up.
import type * as T from './types'

type Raw = Record<string, any> // eslint-disable-line @typescript-eslint/no-explicit-any

const NOTARY_BY_CODE: Record<string, T.NotaryRequirement> = {
  rent_apartment: 'optional', service_agreement: 'none', claim_letter: 'none', sale_agreement: 'conditional',
  lawsuit: 'none', appeal_letter: 'none', power_of_attorney: 'conditional', car_sale: 'required', alimony_agreement: 'required',
}
const NOTARY_NOTE: Record<T.NotaryRequirement, string> = {
  required: 'Bu hujjat notarial tasdiqlanishi shart. Loyihani tayyorlang va notariusga yoki e-notarius.uz’ga boring.',
  conditional: 'Ayrim hollarda notarial tasdiqlash kerak bo‘ladi. Muhim bitimdan oldin notariusdan so‘rang.',
  optional: 'Notarial tasdiqlash shart emas, lekin xohlasangiz tasdiqlatishingiz mumkin.',
  none: 'Oddiy yozma shaklda o‘zingiz tuzasiz, notarius kerak emas.',
}

export function normMe(x: Raw): T.Me {
  const rawRole = String(x.role ?? '').toLowerCase()
  const role: T.UserRole = rawRole === 'lawyer' || x.lawyerProfileId ? 'lawyer'
    : (['moderator', 'editor', 'admin'] as const).find((r) => r === rawRole) ?? 'client'
  return {
    id: x.id, name: x.name ?? '', phone: x.phone ?? '', email: x.email ?? null, avatarUrl: x.avatarUrl ?? null,
    language: (x.language ?? 'uz-Latn') as T.Language, role,
    lawyerStatus: (x.lawyerStatus ? String(x.lawyerStatus).toLowerCase() : role === 'lawyer' ? 'draft' : null) as T.LawyerStatus | null,
    lawyerProfileId: x.lawyerProfileId ?? null,
    workspace: x.workspace ?? { id: '', name: '', kind: 'Personal' },
    subscription: x.subscription ?? { planCode: 'client_free', planName: 'Bepul', status: 'active', currentPeriodEnd: null, cancelAtPeriodEnd: false },
    usage: (x.usage ?? []).map((u: Raw) => ({ metric: u.metric, used: u.used ?? 0, limit: u.limit ?? null, period: u.period ?? 'day', resetsAt: u.resetsAt ?? '' })),
    unreadNotifications: x.unreadNotifications ?? 0, createdAt: x.createdAt ?? new Date().toISOString(),
  }
}

export function normAuth(x: Raw): T.AuthTokens {
  return { ...(x as T.AuthTokens), user: normMe(x.user ?? { id: x.userId, role: x.role }) }
}

export function normDoc(x: Raw): T.DocumentItem {
  return {
    id: x.id, name: x.name ?? 'Hujjat', origin: x.origin ?? 'Uploaded', status: x.status ?? 'Saved',
    contentType: x.contentType ?? 'application/octet-stream', sizeBytes: x.sizeBytes ?? x.size ?? 0,
    tags: Array.isArray(x.tags) ? x.tags : String(x.tags ?? '').split(',').map((t) => t.trim()).filter(Boolean),
    createdAt: x.createdAt, lastAnalyzedAt: x.lastAnalyzedAt ?? null, pageCount: x.pageCount ?? null,
  }
}

function locator(l: unknown): T.Finding['location'] {
  if (l && typeof l === 'object') return l as T.Finding['location']
  const s = String(l ?? '')
  const page = /(\d+)\s*-?\s*(bet|sahifa|page)/i.exec(s)?.[1]
  const clause = /(\d+(?:\.\d+)+)/.exec(s)?.[1]
  return { page: page ? Number(page) : null, clause: clause ?? (s && !page ? s : null) }
}

export function normAnalysis(x: Raw, documentId: string): T.Analysis {
  const findings: T.Finding[] = (x.findings ?? []).map((f: Raw, i: number) => ({
    id: f.id ?? `f${i}`, title: f.title ?? '', severity: f.severity ?? 'Information', excerpt: f.excerpt ?? '',
    location: f.location ?? locator(f.locator), explanation: f.explanation ?? '',
    recommendation: f.recommendation ?? f.recommendedAction ?? '', citations: f.citations ?? [],
  }))
  const counts = { HighAttention: 0, NeedsReview: 0, Information: 0 } as Record<T.FindingSeverity, number>
  findings.forEach((f) => (counts[f.severity] = (counts[f.severity] ?? 0) + 1))
  return {
    id: x.id, documentId: x.documentId ?? documentId, documentVersionId: x.documentVersionId ?? '', status: x.status ?? 'Queued',
    purpose: x.purpose ?? '', userRole: x.userRole ?? null, candidateRoles: x.candidateRoles ?? [], summary: x.summary ?? x.error ?? null,
    parties: x.parties ?? [], obligations: x.obligations ?? [], paymentsAndDeadlines: x.paymentsAndDeadlines ?? [],
    findings, findingCounts: x.findingCounts ?? counts, missingInfo: x.missingInfo ?? [], suggestions: x.suggestions ?? [],
    limitations: x.limitations ?? (x.error ? [String(x.error)] : []), createdAt: x.createdAt, completedAt: x.completedAt ?? null,
  }
}

export function normConv(x: Raw): T.Conversation {
  return {
    id: x.id, title: x.title ?? 'Suhbat', mode: x.mode ?? 'client', category: x.category ?? null,
    lastMessagePreview: x.lastMessagePreview ?? null, messageCount: x.messageCount ?? 0, documents: x.documents ?? [],
    createdAt: x.createdAt, updatedAt: x.updatedAt ?? x.createdAt,
  }
}

export function normMsg(x: Raw): T.Message {
  return { id: x.id, role: String(x.role ?? 'assistant').toLowerCase() === 'user' ? 'user' : 'assistant', content: x.content ?? '', answer: x.answer ?? null, feedback: x.feedback ?? null, createdAt: x.createdAt }
}

export function normLegalItem(x: Raw): T.LegalListItem {
  return {
    id: x.id, title: x.title ?? '', type: x.type ?? '', number: x.number ?? null, issuedAt: x.issuedAt ?? null,
    status: x.status ?? 'in_force', category: x.category ?? null, sectionCount: x.sectionCount ?? 0, officialUrl: x.officialUrl ?? null,
  }
}
export function normLegalDetails(x: Raw): T.LegalDocumentDetails {
  const versions = (x.versions ?? []).map((v: Raw) => ({
    id: v.id, effectiveFrom: v.effectiveFrom ?? null, effectiveTo: v.effectiveTo ?? null, isCurrent: !!v.isCurrent,
    officialUrl: v.officialUrl ?? v.sourceUrl ?? null,
    sections: (v.sections ?? []).map((s: Raw) => ({ id: s.id, number: s.number ?? null, title: s.title ?? null, text: s.text ?? '', officialUrl: s.officialUrl ?? null })),
  }))
  const cur = versions.find((v: T.LegalDocumentDetails['versions'][number]) => v.isCurrent) ?? versions[0]
  return { ...normLegalItem(x), sectionCount: x.sectionCount ?? cur?.sections.length ?? 0, versions }
}

/** schemaJson may be `{steps:[...]}`, `{fields:[...]}`, a bare field array, or JSON-Schema `properties`. */
function parseSchema(raw: unknown): T.Template['schema'] {
  let s: Raw | Raw[] | null = null
  try { s = typeof raw === 'string' ? JSON.parse(raw) : (raw as Raw) } catch { s = null }
  const field = (f: Raw, key?: string): T.TemplateField => ({
    key: f.key ?? f.name ?? key ?? '', label: f.label ?? f.title ?? f.name ?? key ?? '', type: f.type === 'string' ? 'text' : f.type ?? 'text',
    required: !!f.required, hint: f.hint ?? f.description, example: f.example ?? f.placeholder, options: f.options,
  })
  if (!s) return { steps: [] }
  if (Array.isArray(s)) return { steps: [{ title: 'Ma’lumotlar', fields: s.map((f) => field(f)) }] }
  if (Array.isArray(s.steps)) return { steps: s.steps.map((st: Raw) => ({ title: st.title ?? 'Ma’lumotlar', fields: (st.fields ?? []).map((f: Raw) => field(f)) })) }
  if (Array.isArray(s.fields)) return { steps: [{ title: 'Ma’lumotlar', fields: s.fields.map((f: Raw) => field(f)) }] }
  if (s.properties && typeof s.properties === 'object') {
    const req: string[] = s.required ?? []
    return { steps: [{ title: 'Ma’lumotlar', fields: Object.entries(s.properties as Record<string, Raw>).map(([k, v]) => ({ ...field(v, k), required: req.includes(k) })) }] }
  }
  return { steps: [] }
}

export function normTemplate(x: Raw): T.Template {
  const notary: T.NotaryRequirement = x.notary ?? NOTARY_BY_CODE[x.code] ?? 'none'
  return {
    id: x.id, code: x.code ?? '', name: x.name ?? '', category: x.category ?? '', description: x.description ?? '',
    audience: x.audience ?? ['client', 'lawyer'], notary, notaryNote: x.notaryNote ?? NOTARY_NOTE[notary],
    schema: x.schema?.steps ? x.schema : parseSchema(x.schemaJson ?? x.schema),
  }
}

export function normDraft(x: Raw, templates: T.Template[] = []): T.Draft {
  let fields: Record<string, string | null> = x.fields ?? {}
  if (!x.fields && x.dataJson) { try { fields = JSON.parse(x.dataJson) } catch { fields = {} } }
  const text: string = x.text ?? x.renderedContent ?? ''
  const tpl = templates.find((t) => t.id === x.templateId)
  const required = tpl?.schema.steps.flatMap((s) => s.fields).filter((f) => f.required).map((f) => f.key) ?? []
  const missing = x.missingRequired ?? (required.length ? required.filter((k) => !fields[k]?.toString().trim()) : [...text.matchAll(/\[TO‘LDIRING: ([^\]]+)\]/g)].map((m) => m[1]))
  return {
    id: x.id, templateId: x.templateId, templateName: x.templateName ?? tpl?.name ?? 'Shablon', name: x.name ?? tpl?.name ?? 'Loyiha',
    fields, text, missingRequired: missing, status: x.status ?? 'draft', documentId: x.documentId ?? null,
    revision: x.revision ?? 1, createdAt: x.createdAt, updatedAt: x.updatedAt ?? x.createdAt,
  }
}
