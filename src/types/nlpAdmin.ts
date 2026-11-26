// contracts/api/nlp-management.md, contracts/api/questions.md 4~5장

export type BusinessScope = 'ALL' | 'SELECTED'
export type TargetType = 'QA' | 'DOC' | 'SCREEN'
export type ScopedBusiness = { id: string; name: string; active: boolean }

export type IntentItem = {
  id: string
  intentKey: string
  name: string
  businessScope: BusinessScope
  businesses: ScopedBusiness[]
  target: {
    type: TargetType
    qaId: string | null
    qaKey: string | null
    documentId: string | null
    documentTitle: string | null
    path: string | null
  }
  active: boolean
  exampleCount: number
}

export type IntentExample = { id?: string | null; example: string }

export type IntentForm = {
  revision: number
  intentKey: string
  name: string
  businessScope: BusinessScope
  businessIds: string[]
  targetType: TargetType
  qaId: string | null
  documentId: string | null
  path: string | null
  active: boolean
  examples: IntentExample[]
}

export type IntentDetail = IntentForm & { id: string }

export type QaItem = {
  id: string
  qaKey: string
  question: string
  businessScope: BusinessScope
  businesses: ScopedBusiness[]
  source: { documentId: string; documentTitle: string; page: number | null; deleted: boolean } | null
  active: boolean
}

export type QaForm = {
  revision: number
  qaKey: string
  question: string
  answer: string
  businessScope: BusinessScope
  businessIds: string[]
  sourceDocumentId: string | null
  sourcePage: number | null
  active: boolean
}

export type QaDetail = QaForm & { id: string }

export type KnowledgeSync = {
  revision: number
  status: 'PENDING' | 'SYNCING' | 'SYNCED' | 'RETRYING' | 'FAILED'
  nlpRevision: number | null
  attempts: number
  error: string | null
  checkedAt: string | null
  nextAttemptAt: string | null
}

export type QuestionLog = {
  id: string
  userId: string
  businessId: string
  conversationId: string
  requestType: 'QUESTION' | 'CANDIDATE_SELECTED' | 'NONE_SELECTED'
  maskedQuery: string
  status: 'answered' | 'clarify' | 'no_answer' | 'pii_warning'
  intent: string | null
  confidence: number | null
  contextUsed: boolean
  handledBy: string | null
  handledAt: string | null
  createdAt: string
}

export type QuestionStats = {
  from: string
  to: string
  counts: {
    questions: number
    answered: number
    clarify: number
    noAnswer: number
    piiWarning: number
    candidateSelected: number
    noneSelected: number
  }
  topIntents: { intentKey: string; name: string | null; count: number }[]
  topNoAnswer: { maskedQuery: string; count: number; lastAskedAt: string }[]
}

export type EvalRow = {
  masked_query: string
  expected: string
  top3: string[]
  hit: boolean
  status: QuestionLog['status']
  top_score: number | null // 원점수. 반올림하지 않고 기준값과 비교한다
}

export type EvalResult = {
  answer_threshold: number
  clarify_threshold: number
  scored: number
  hits: number
  unknown_intents: string[]
  rows: EvalRow[]
}
