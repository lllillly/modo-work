export type QuestionRequest = {
  businessId: string
  query: string
  conversationId: string | null
  noneSelected: boolean
  candidateSelected: boolean
}

export type QuestionStatus = 'answered' | 'clarify' | 'no_answer' | 'pii_warning'

export type Evidence = {
  type: 'QA' | 'DOC' | 'SCREEN'
  label: string
  text: string | null
  docTitle: string | null
  page: number | null
  quote: string | null
  docId: string | null
  path: string | null
  qaKey: string | null
}

export type QuestionGuide = {
  kind: 'more' | 'rephrase' | 'contact'
  text: string
}

export type QuestionResponse = {
  conversationId: string
  status: QuestionStatus
  answer: Evidence | null
  candidates: Evidence[]
  guide: QuestionGuide | null
  contextUsed: boolean
}
