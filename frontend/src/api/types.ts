// Wire types — one-to-one with docs/BACKEND_API.md. Change the doc first, then this file.

export type ID = string
export type ISODate = string

// ---- Enums (§C) ---------------------------------------------------------------
export type UserRole = 'client' | 'lawyer' | 'moderator' | 'editor' | 'admin'
export type LawyerStatus = 'draft' | 'pending' | 'verified' | 'rejected' | 'suspended'
export type LawyerType = 'advocate' | 'legal_consultant'
export type Language = 'uz-Latn' | 'uz-Cyrl' | 'ru'
export type CategoryCode =
  | 'labor' | 'family' | 'housing' | 'consumer' | 'business' | 'tax' | 'criminal'
  | 'administrative' | 'inheritance' | 'land' | 'migration' | 'civil' | 'other'
export type WorkFormat = 'online' | 'office' | 'court'
export type ConsultationFormat = 'video' | 'audio' | 'chat' | 'office'
export type ServiceType = 'consultation' | 'question' | 'document_review' | 'document_drafting' | 'representation' | 'other'
export type PriceType = 'fixed' | 'from' | 'hourly'
export type JobStatus = 'open' | 'in_progress' | 'closed' | 'cancelled'
export type OfferStatus = 'pending' | 'accepted' | 'rejected' | 'withdrawn'
export type OrderType = 'consultation' | 'question' | 'service' | 'job'
export type OrderStatus =
  | 'pending_payment' | 'awaiting_acceptance' | 'scheduled' | 'in_progress' | 'delivered'
  | 'revision_requested' | 'completed' | 'cancelled' | 'declined' | 'expired' | 'disputed' | 'refunded'
export type OrderAction =
  | 'pay' | 'cancel' | 'accept' | 'decline' | 'deliver' | 'request_revision' | 'complete'
  | 'dispute' | 'review' | 'join_meeting' | 'mark_no_show'
export type PaymentProvider = 'payme' | 'click' | 'uzum'
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'refunded' | 'partially_refunded'
export type Confidence = 'high' | 'medium' | 'low'
export type Urgency = 'low' | 'normal' | 'high'
export type DocumentOrigin = 'Uploaded' | 'Chat' | 'Generated'
export type DocumentStatus = 'Saved' | 'Processing' | 'Ready' | 'Failed' | 'Draft' | 'Deleted'
export type AnalysisStatus = 'Queued' | 'Processing' | 'Completed' | 'Failed' | 'NeedsRole'
export type FindingSeverity = 'Information' | 'NeedsReview' | 'HighAttention'

// ---- Common (§B.3) ------------------------------------------------------------
export interface Paged<T> { items: T[]; page: number; pageSize: number; total: number }
export interface UserShort { id: ID; name: string; avatarUrl: string | null }
export interface FileRef { id: ID; name: string; mime: string; size: number; url: string }
export interface Category { code: CategoryCode; name: string; icon?: string; lawyerCount?: number }
export interface Region { code: string; name: string }
export interface Money { amount: number; platformFee: number | null; lawyerPayout: number | null; currency: 'UZS' }

export interface ProblemDetails {
  type?: string; title?: string; status: number; detail?: string; code?: string
  errors?: Record<string, string[]>; resetsAt?: string; upgradePlanCode?: string
}

// ---- Auth & Me (§1, §2) -------------------------------------------------------
export interface CodeRequestResult {
  message: string; deliveryChannel: 'telegram' | 'sms'; telegramBotUrl?: string
  isNewUser: boolean; resendAfterSeconds: number
}
export interface VerifyRequest {
  phone: string; code: string; name?: string; role?: 'client' | 'lawyer'
  workspaceKind?: 'Personal' | 'Business'; acceptTerms?: boolean
}
export interface AuthTokens {
  accessToken: string; accessTokenExpiresAt: ISODate; refreshToken: string; refreshTokenExpiresAt: ISODate
  userId: ID; workspaceId: ID; role: UserRole; user: Me
}
export interface Usage { metric: string; used: number; limit: number | null; period: 'day' | 'month'; resetsAt: ISODate }
export interface SubscriptionInfo {
  planCode: string; planName: string; status: 'active' | 'past_due' | 'cancelled' | 'expired'
  currentPeriodEnd: ISODate | null; cancelAtPeriodEnd: boolean
}
export interface Me {
  id: ID; name: string; phone: string; email: string | null; avatarUrl: string | null; language: Language
  role: UserRole; lawyerStatus: LawyerStatus | null; lawyerProfileId: ID | null
  workspace: { id: ID; name: string; kind: 'Personal' | 'Business' }
  subscription: SubscriptionInfo; usage: Usage[]; unreadNotifications: number; createdAt: ISODate
}
export interface Session { id: ID; device: string; ip: string; city: string | null; createdAt: ISODate; lastActiveAt: ISODate; isCurrent: boolean }

// ---- AI chat (§4) -------------------------------------------------------------
export interface Citation {
  sectionId: ID; legalDocumentId: ID; versionId: ID; documentTitle: string
  articleNumber: string | null; articleTitle: string | null; editionDate: string | null
  officialUrl: string | null; isRepealed: boolean; quote: string
}
export interface SuggestedAction { type: 'create_draft' | 'open_law' | 'find_lawyer' | 'analyze_document'; label: string; templateCode?: string; legalDocumentId?: string }
export interface ChatAnswer {
  kind: 'answer' | 'clarification' | 'out_of_scope'
  summary: string
  legalBasis: { statement: string; citations: ID[] }[]
  legalBasisVerified: boolean
  steps: string[]; missingInfo: string[]; clarifyingQuestions: string[]; limitations: string[]
  citations: Citation[]; suggestedActions: SuggestedAction[]
  eventDate: string | null; disclaimer: string
  confidence: Confidence; category: CategoryCode | null
  escalation: { recommended: boolean; reason: string | null; urgency: Urgency }
}
export interface Conversation {
  id: ID; title: string; mode: 'client' | 'professional'; category: CategoryCode | null
  lastMessagePreview: string | null; messageCount: number
  documents: { id: ID; name: string; status: DocumentStatus }[]
  createdAt: ISODate; updatedAt: ISODate
}
export interface Message {
  id: ID; role: 'user' | 'assistant'; content: string; answer: ChatAnswer | null
  feedback: 'up' | 'down' | null; createdAt: ISODate
}
export interface SendMessageRequest { content: string; answerStyle?: 'short' | 'detailed'; plainLanguage?: boolean; eventDate?: string | null }
export type ChatStage = 'planning' | 'searching' | 'writing' | 'verifying'
export interface HandoffPreview {
  title: string; summary: string; questions: string[]; category: Category; urgency: Urgency
  documents: { id: ID; name: string }[]; recommendedLawyers: LawyerCard[]
  suggestedBudget: { min: number; max: number }
}

// ---- Documents (§5) -----------------------------------------------------------
export interface DocumentItem {
  id: ID; name: string; origin: DocumentOrigin; status: DocumentStatus; contentType: string
  sizeBytes: number; tags: string[]; createdAt: ISODate; lastAnalyzedAt: ISODate | null; pageCount: number | null
}
export interface Finding {
  id: ID; title: string; severity: FindingSeverity; excerpt: string
  location: { page?: number | null; clause?: string | null }
  explanation: string; recommendation: string; citations: Citation[]
}
export interface Analysis {
  id: ID; documentId: ID; documentVersionId: ID; status: AnalysisStatus; purpose: string
  userRole: string | null; candidateRoles: string[]; summary: string | null
  parties: { name: string; role: string }[]
  obligations: { party: string; items: string[] }[]
  paymentsAndDeadlines: { label: string; value: string }[]
  findings: Finding[]; findingCounts: Record<FindingSeverity, number>
  missingInfo: string[]; suggestions: string[]; limitations: string[]
  createdAt: ISODate; completedAt: ISODate | null
}

// ---- Legal (§6) ---------------------------------------------------------------
export interface LegalListItem {
  id: ID; title: string; type: string; number: string | null; issuedAt: string | null
  status: 'in_force' | 'repealed'; category: CategoryCode | null; sectionCount: number; officialUrl: string | null
}
export interface LegalSection { id: ID; number: string | null; title: string | null; text: string; officialUrl: string | null }
export interface LegalDocumentDetails extends LegalListItem {
  versions: { id: ID; effectiveFrom: string | null; effectiveTo: string | null; isCurrent: boolean; officialUrl: string | null; sections: LegalSection[] }[]
}
export interface LegalSearchHit {
  sectionId: ID; legalDocumentId: ID; documentTitle: string; articleNumber: string | null; articleTitle: string | null
  snippet: string; editionDate: string | null; isCurrent: boolean; officialUrl: string | null; score: number
}

// ---- Templates & drafts (§7) --------------------------------------------------
export interface TemplateField {
  key: string; label: string; type: 'text' | 'textarea' | 'number' | 'money' | 'date' | 'select' | 'phone' | 'passport'
  required: boolean; hint?: string; example?: string; options?: { value: string; label: string }[]
}
export type NotaryRequirement = 'required' | 'conditional' | 'optional' | 'none'
export interface Template {
  id: ID; code: string; name: string; category: string; description: string; audience: ('client' | 'lawyer')[]
  notary: NotaryRequirement; notaryNote: string
  schema: { steps: { title: string; fields: TemplateField[] }[] }
}
export interface Draft {
  id: ID; templateId: ID; templateName: string; name: string; fields: Record<string, string | null>
  text: string; missingRequired: string[]; status: 'draft' | 'confirmed'; documentId: ID | null
  revision: number; createdAt: ISODate; updatedAt: ISODate
}

// ---- Lawyers (§8, §9) ---------------------------------------------------------
export interface LawyerCard {
  id: ID; userId: ID; name: string; avatarUrl: string | null; type: LawyerType; headline: string
  isVerified: boolean; categories: Category[]; region: Region; city: string; languages: Language[]
  workFormats: WorkFormat[]; experienceYears: number; rating: number; reviewCount: number
  completedOrders: number; responseTimeMinutes: number; priceFrom: number
  nextAvailableAt: ISODate | null; isOnline: boolean; isPromoted: boolean
}
export interface Education { institution: string; degree: string; year: number }
export interface LawyerProfile extends LawyerCard {
  bio: string; education: Education[]; licenseNumber: string | null; verifiedAt: ISODate | null
  officeAddress: string | null; services: Service[]; ratingBreakdown: Record<'1' | '2' | '3' | '4' | '5', number>
  memberSince: ISODate
}
export interface Service {
  id: ID; lawyerId: ID; type: ServiceType; category: Category; title: string; description: string
  price: number; priceType: PriceType; durationMinutes: number | null; deliveryDays: number | null
  formats: ConsultationFormat[]; isActive: boolean; ordersCount: number; createdAt: ISODate
}
export type ServiceInput = Omit<Service, 'id' | 'lawyerId' | 'category' | 'isActive' | 'ordersCount' | 'createdAt'> & { category: CategoryCode; isActive?: boolean }
export interface Slot { start: ISODate; end: ISODate }
export interface SlotsResponse { timezone: string; days: { date: string; slots: Slot[] }[] }

export interface OwnLawyerProfile extends LawyerProfile { status: LawyerStatus; rejectionReason: string | null; categoryPrimary: CategoryCode | null }
export interface LawyerProfileInput {
  type: LawyerType; headline: string; bio: string; experienceYears: number
  categories: { code: CategoryCode; isPrimary: boolean }[]; region: string; city: string
  languages: Language[]; workFormats: WorkFormat[]; officeAddress: string | null
  licenseNumber: string | null; education: Education[]
}
export type VerificationKind = 'passport' | 'diploma' | 'license' | 'selfie'
export interface Verification {
  status: LawyerStatus; rejectionReason: string | null; submittedAt: ISODate | null; reviewedAt: ISODate | null
  requiredKinds: VerificationKind[]
  documents: { id: ID; kind: VerificationKind; status: 'uploaded' | 'approved' | 'rejected'; file: FileRef; comment: string | null }[]
}
export interface TimeInterval { start: string; end: string }
export interface Schedule {
  timezone: string; slotMinutes: number; bufferMinutes: number; minNoticeHours: number; maxDaysAhead: number
  isAcceptingBookings: boolean
  weekly: { weekday: number; intervals: TimeInterval[] }[]
  exceptions: { date: string; isAvailable: boolean; intervals: TimeInterval[]; note: string | null }[]
}
export interface CalendarDay {
  date: string; free: Slot[]
  booked: { orderId: ID; start: ISODate; end: ISODate; clientName: string; format: ConsultationFormat; status: OrderStatus }[]
}
export interface LawyerDashboard {
  stats: {
    earningsThisMonth: number; earningsLastMonth: number; walletAvailable: number; walletPending: number
    activeOrders: number; completedThisMonth: number; rating: number; reviewCount: number
    responseRate: number; profileViews30d: number
  }
  actionRequired: OrderListItem[]; upcomingConsultations: OrderListItem[]; matchingJobs: Job[]
  verificationStatus: LawyerStatus
}

// ---- Jobs & offers (§10) ------------------------------------------------------
export interface Job {
  id: ID; title: string; description: string; aiSummary: string | null; category: Category
  serviceType: ServiceType | null; budgetMin: number | null; budgetMax: number | null; deadline: string | null
  region: Region | null; format: 'online' | 'office' | 'any'; status: JobStatus; offersCount: number
  attachments?: FileRef[]
  client: UserShort & { memberSince: ISODate; ordersCount: number }
  orderId: ID | null; createdAt: ISODate; expiresAt: ISODate
  myOffer?: Offer | null
}
export interface JobInput {
  title: string; description: string; category: CategoryCode; serviceType?: ServiceType | null
  budgetMin?: number | null; budgetMax?: number | null; deadline?: string | null; region?: string | null
  format: 'online' | 'office' | 'any'; attachmentFileIds?: ID[]
  sourceConversationId?: ID | null; shareConversation?: boolean; sharedDocumentIds?: ID[]; caseId?: ID | null
}
export interface Offer {
  id: ID; jobId: ID; lawyer: LawyerCard; price: number; deliveryDays: number; message: string
  status: OfferStatus; createdAt: ISODate; jobTitle?: string
}

// ---- Orders (§11) -------------------------------------------------------------
export interface Review {
  id: ID; orderId: ID; rating: number; text: string; client: { name: string; avatarUrl: string | null }
  serviceTitle: string; lawyerReply: { text: string; createdAt: ISODate } | null; createdAt: ISODate
}
export interface OrderListItem {
  id: ID; number: string; type: OrderType; status: OrderStatus; title: string; description: string
  category: Category | null; client: UserShort
  lawyer: UserShort & { userId: ID; type: LawyerType; rating: number }
  service: { id: ID; title: string; type: ServiceType } | null; jobId: ID | null; offerId: ID | null
  price: Money
  consultation: { start: ISODate; end: ISODate; format: ConsultationFormat; meetingAvailableAt: ISODate; officeAddress: string | null } | null
  deliveryDays: number | null; acceptDueAt: ISODate | null; deliveryDueAt: ISODate | null; autoCompleteAt: ISODate | null
  revisionCount: number; maxRevisions: number
  payment: { id: ID; status: PaymentStatus; provider: PaymentProvider; paidAt: ISODate | null } | null
  allowedActions: OrderAction[]; unreadMessages: number; createdAt: ISODate; updatedAt: ISODate
}
export interface Order extends OrderListItem {
  shared: { conversation: { id: ID; title: string } | null; documents: { id: ID; name: string; contentType: string }[]; aiSummary: string | null; case?: { id: ID; title: string; summary: string; amounts: { claimed: number | null; recovered: number | null }; steps: { title: string; status: string }[] } | null }
  dispute: { id: ID; status: 'open' | 'resolved'; reason: string; openedBy: 'client' | 'lawyer' } | null
  review: Review | null
}
export interface CreateOrderRequest {
  serviceId: ID; slotStart?: ISODate; format?: ConsultationFormat; description: string
  attachmentFileIds?: ID[]; sourceConversationId?: ID | null; shareConversation?: boolean
  sharedDocumentIds?: ID[]; shareConsent?: boolean; caseId?: ID | null
}
export interface OrderMessage {
  id: ID; orderId: ID; sender: { id: ID; name: string; role: 'client' | 'lawyer' } | null
  kind: 'text' | 'file' | 'system' | 'delivery'; text: string; files: FileRef[]; createdAt: ISODate; readAt: ISODate | null
}
export interface OrderEvent { id: ID; type: string; actor: 'client' | 'lawyer' | 'system'; text: string; createdAt: ISODate }
export type DisputeReason = 'not_delivered' | 'poor_quality' | 'no_show' | 'unprofessional' | 'other'

// ---- Payments, wallet, plans (§12–§14) ----------------------------------------
export interface Payment {
  id: ID; purpose: 'order' | 'subscription' | 'one_time'; orderId: ID | null; amount: number; currency: 'UZS'
  provider: PaymentProvider; status: PaymentStatus; checkoutUrl: string | null; expiresAt: ISODate
  createdAt: ISODate; paidAt: ISODate | null; title?: string; receiptUrl?: string | null; refundedAmount?: number
}
export interface CreatePaymentRequest {
  purpose: 'order' | 'subscription' | 'one_time'; orderId?: ID; planCode?: string; period?: 'month' | 'year'
  product?: 'analysis' | 'draft_export'; provider: PaymentProvider; returnUrl: string
}
export interface Wallet {
  currency: 'UZS'; available: number; pending: number; inPayout: number; totalEarned: number; totalWithdrawn: number
  minPayout: number; commissionRate: number; canWithdraw: boolean; withdrawBlockedReason: string | null
}
export interface WalletTransaction {
  id: ID; type: 'order_income' | 'commission' | 'payout' | 'payout_reversal' | 'refund_debit' | 'adjustment' | 'promotion'
  amount: number; balanceAfter: number; orderId: ID | null; orderNumber: string | null; payoutId: ID | null
  description: string; status: 'pending' | 'available'; availableAt: ISODate | null; createdAt: ISODate
}
export interface PayoutMethod { id: ID; type: 'card' | 'bank_account'; maskedNumber: string; holderName: string; bankName: string | null; isDefault: boolean; createdAt: ISODate }
export interface Payout {
  id: ID; amount: number; fee: number; status: 'requested' | 'processing' | 'paid' | 'failed' | 'cancelled'
  method: PayoutMethod; requestedAt: ISODate; paidAt: ISODate | null; failureReason: string | null
}
export interface Plan {
  code: string; audience: 'client' | 'lawyer'; name: string; description: string
  prices: { period: 'month' | 'year'; amount: number }[]; features: string[]
  limits: Record<string, { limit: number | null; period: 'day' | 'month' }>; isPopular: boolean
}

// ---- Notifications (§16) ------------------------------------------------------
export interface Notification {
  id: ID; type: string; title: string; body: string
  link: { kind: 'order' | 'job' | 'document' | 'analysis' | 'wallet' | 'verification' | 'review'; id: ID } | null
  isRead: boolean; createdAt: ISODate
}

// ---- Cases: Legal Case Assistant (§4a) ----------------------------------------
export type CaseStatus = 'active' | 'resolved' | 'closed'
export type CaseStepStatus = 'todo' | 'in_progress' | 'done' | 'skipped'
export type CaseStepKind = 'analyze' | 'check_document' | 'collect' | 'calculate' | 'draft' | 'send' | 'authority' | 'lawyer' | 'track' | 'custom'
export type CalculatorCode = 'unpaid_wages' | 'deposit_return' | 'goods_refund'
export interface CaseStepAction {
  type: 'chat' | 'upload_document' | 'analyze_document' | 'calculator' | 'create_draft' | 'mark_sent' | 'find_lawyer' | 'none'
  templateCode?: string; calculator?: CalculatorCode; serviceType?: ServiceType
}
export interface CaseStep {
  id: ID; order: number; kind: CaseStepKind; title: string; description: string; status: CaseStepStatus
  action: CaseStepAction; dueAt: ISODate | null; completedAt: ISODate | null; result: string | null
  source: 'ai' | 'user'
}
export interface CaseDeadline { id: ID; title: string; date: string; kind: 'legal' | 'response' | 'self'; done: boolean; note: string | null; source: 'ai' | 'user' }
export interface CaseEvent { id: ID; text: string; actor: 'user' | 'ai' | 'lawyer' | 'system'; createdAt: ISODate }
export interface CaseListItem {
  id: ID; title: string; category: Category; status: CaseStatus; progress: { done: number; total: number }
  nextStep: { id: ID; title: string } | null; nearestDeadline: CaseDeadline | null; amountClaimed: number | null; updatedAt: ISODate
}
export interface Case extends CaseListItem {
  summary: string; facts: { label: string; value: string }[]
  steps: CaseStep[]; deadlines: CaseDeadline[]; events: CaseEvent[]
  amounts: { claimed: number | null; recovered: number | null }
  links: { conversations: { id: ID; title: string }[]; documents: { id: ID; name: string }[]; drafts: { id: ID; name: string }[]; orders: { id: ID; number: string; title: string; status: OrderStatus }[] }
  disclaimer: string; createdAt: ISODate
}
export interface CaseInput { situation: string; title?: string; category?: CategoryCode; sourceConversationId?: ID | null }
export interface CalcResult {
  calculator: CalculatorCode; total: number; breakdown: { label: string; amount: number }[]
  notes: string[]; citations: Citation[]
}

// ---- Lawyer AI Pro, advocate requests, integrations (§9.7) --------------------
export interface SourceRef { documentId: ID; page?: number | null; clause?: string | null }
export interface BundleAnalysis {
  id: ID; status: 'processing' | 'completed' | 'failed'
  timeline: { date: string; event: string; source: SourceRef | null }[]
  parties: { name: string; role: string }[]
  amounts: { label: string; value: string; source: SourceRef | null }[]
  contradictions: { text: string; sources: SourceRef[] }[]
  missingEvidence: string[]; citations: Citation[]; limitations: string[]; disclaimer: string
}
export interface LegalPosition {
  summary: string
  arguments: { claim: string; basis: Citation[]; evidenceNeeded: string[]; counter: string; strength: 'strong' | 'medium' | 'weak' }[]
  risks: string[]; nextSteps: string[]; confidence: Confidence; disclaimer: string
}
export interface AdvocateRequest {
  id: ID; recipient: { name: string; address: string | null }; subject: string; questions: string[]; text: string
  status: 'draft' | 'sent' | 'answered' | 'overdue'; sentAt: ISODate | null; dueAt: string | null; answerFiles: FileRef[]
  orderId: ID | null; caseId: ID | null; createdAt: ISODate
}
export type IntegrationStatus = 'assisted' | 'planned' | 'negotiating' | 'live'
export interface Integration {
  code: string; name: string; category: 'identity' | 'signature' | 'court' | 'justice' | 'gov_services' | 'enforcement' | 'property' | 'appeals' | 'legal_data'
  description: string; status: IntegrationStatus; mode: string; officialUrl: string; platformProvides: string[]; requiresContract: boolean; sources: string[]
}
export interface Filing {
  id: ID; portal: string; status: 'prepared' | 'submitted' | 'accepted' | 'rejected'
  package: { files: FileRef[]; checklist: { label: string; done: boolean }[]; steps: string[]; stateFee: { amount: number | null; basis: string | null; note: string } }
  externalRef: string | null; submittedAt: ISODate | null; createdAt: ISODate; title: string; orderId: ID | null; caseId: ID | null
}
