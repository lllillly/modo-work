import { ApiError } from '../../api/client'
import type { Evidence, QuestionRequest, QuestionResponse } from '../../types/question'

export const MAX_QUERY_LENGTH = 500

export const exampleQuestions = [
  '연차는 어떻게 신청해요?',
  '마감이 주말이면 어떻게 돼요?',
  '증빙 자료는 언제까지 보관해요?',
]

export type AskTurn = {
  id: number
  type: 'question' | 'candidate' | 'none'
  request: QuestionRequest
  status: 'loading' | 'done' | 'error'
  response?: QuestionResponse
  error?: unknown
  selected?: Evidence
  chosen?: number | 'none'
}

export function getQueryLength(value: string) {
  return Array.from(value).length
}

export function getCopyText(evidence: Evidence) {
  return evidence.type === 'QA' ? (evidence.text ?? evidence.label) : evidence.type === 'DOC' ? evidence.quote : null
}

const personalInfoPatterns = [
  /\d{6}\s?-\s?[1-4]\d{6}/,
  /01[016789][-\s]?\d{3,4}[-\s]?\d{4}/,
  /[\w.+-]+@[\w-]+\.[\w.-]+/,
]

export function hasPersonalInfo(value: string) {
  return personalInfoPatterns.some((pattern) => pattern.test(value))
}

export function getSourceText(evidence: Evidence) {
  const page = evidence.page === null ? null : `${evidence.page}쪽`
  const source = [evidence.docTitle, page].filter(Boolean).join(' · ')
  return source || (evidence.type === 'QA' ? evidence.label : '')
}

const appPaths = ['/', '/tasks', '/admin/courses', '/admin/courses/import']
const pathAliases: Record<string, string> = { '/my-tasks': '/tasks' }

export function getOpenablePath(path: string | null, isAdmin: boolean) {
  if (!path) return null

  const [pathname, ...rest] = path.split(/(?=[?#])/)
  const target = pathAliases[pathname] ?? pathname
  if (target.startsWith('/admin') && !isAdmin) return null
  return appPaths.includes(target) ? target + rest.join('') : null
}

export function getDocumentUrl(docId: string, businessId: string, page: number | null) {
  const query = new URLSearchParams({ businessId })
  return `/api/documents/${encodeURIComponent(docId)}/file?${query}${page ? `#page=${page}` : ''}`
}

export type AskErrorView = {
  tone: 'error' | 'warning'
  title: string
  description: string
  canRetry: boolean
}

export function getAskErrorView(error: unknown): AskErrorView {
  const code = error instanceof ApiError ? error.code : null
  const isClientTimeout = error instanceof DOMException && error.name === 'TimeoutError'

  if (code === 'NLP_TIMEOUT' || isClientTimeout) {
    return {
      tone: 'warning',
      title: '답을 찾는 데 시간이 오래 걸리고 있어요',
      description: '같은 질문을 다시 보내 볼까요?',
      canRetry: true,
    }
  }

  if (code === 'NLP_UNAVAILABLE' || code === 'NLP_BAD_RESPONSE') {
    return {
      tone: 'error',
      title: '지금은 물어보기를 쓸 수 없어요',
      description: '물어보기를 준비하고 있거나 잠시 연결이 끊겼어요. 잠깐 뒤에 다시 시도해 주세요.',
      canRetry: true,
    }
  }

  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return {
      tone: 'error',
      title: '질문을 보내지 못했어요',
      description: error.fieldErrors[0]?.message ?? error.message,
      canRetry: false,
    }
  }

  return {
    tone: 'error',
    title: '질문을 처리하지 못했어요',
    description: '잠시 후 다시 시도해 주세요.',
    canRetry: true,
  }
}
