import type { PageResponse } from '../types/courseApi'
import type {
  EvalResult,
  IntentDetail,
  IntentForm,
  IntentItem,
  KnowledgeSync,
  QaDetail,
  QaForm,
  QaItem,
  QuestionLog,
  QuestionStats,
} from '../types/nlpAdmin'
import { getApi, requestApi, sendApi } from './client'
import { getAllPages } from './pagination'

const id = (value: string) => encodeURIComponent(value)
const pageQuery = (page: number) => new URLSearchParams({ page: String(page), size: '100' })

export const getIntents = (signal?: AbortSignal) =>
  getAllPages((page) => getApi<PageResponse<IntentItem>>(`/admin/nlp/intents?${pageQuery(page)}`, signal))

export const getIntentDetail = (intentId: string, signal?: AbortSignal) =>
  getApi<IntentDetail>(`/admin/nlp/intents/${id(intentId)}`, signal)

export const createIntent = (form: IntentForm) =>
  // 등록 API는 examples를 문자열 목록으로 받는다. 수정(PUT)만 { id, example } 형식이다
  sendApi<{ id: string; revision: number }>('/admin/nlp/intents', 'POST', {
    ...form,
    examples: form.examples.map((item) => item.example),
  })

export const updateIntent = (intentId: string, form: IntentForm) =>
  sendApi<{ id: string; revision: number; examples: IntentForm['examples'] }>(
    `/admin/nlp/intents/${id(intentId)}`,
    'PUT',
    form,
  )

export const getQaList = (signal?: AbortSignal) =>
  getAllPages((page) => getApi<PageResponse<QaItem>>(`/admin/nlp/qa?${pageQuery(page)}`, signal))

export const getQaDetail = (qaId: string, signal?: AbortSignal) =>
  getApi<QaDetail>(`/admin/nlp/qa/${id(qaId)}`, signal)

export const createQa = (form: QaForm) => sendApi<{ id: string; revision: number }>('/admin/nlp/qa', 'POST', form)

export const updateQa = (qaId: string, form: QaForm) =>
  sendApi<{ id: string; revision: number }>(`/admin/nlp/qa/${id(qaId)}`, 'PUT', form)

export const getKnowledgeRevision = (signal?: AbortSignal) =>
  getApi<{ revision: number; updatedAt: string }>('/admin/nlp/knowledge', signal)

export const getKnowledgeSync = (signal?: AbortSignal) => getApi<KnowledgeSync>('/admin/nlp/knowledge/sync', signal)

export async function retryKnowledgeSync() {
  await requestApi('/admin/nlp/knowledge/retry', { method: 'POST' })
}

export function getUnhandledQuestions(page: number, size: number, signal?: AbortSignal) {
  const query = new URLSearchParams({ status: 'no_answer', handled: 'false', page: String(page), size: String(size) })
  return getApi<PageResponse<QuestionLog>>(`/admin/questions?${query}`, signal)
}

export async function handleQuestion(questionId: string) {
  await requestApi(`/admin/questions/${id(questionId)}/handle`, { method: 'POST' })
}

export function getQuestionStats(days: number, businessId?: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ days: String(days) })
  if (businessId) query.set('businessId', businessId)
  return getApi<QuestionStats>(`/admin/questions/stats?${query}`, signal)
}


// 서버가 NLP를 최대 60초 기다리므로 기본 30초보다 길게 기다린다
export async function runEval(csv: string): Promise<EvalResult> {
  const response = await requestApi(
    '/admin/nlp/eval',
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ csv }) },
    90_000,
  )
  return response.json()
}
