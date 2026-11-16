import { ApiError } from '../../api/client'
import type { Evidence, QuestionRequest, QuestionResponse } from '../../types/question'

export const exampleQuestions = [
  '연차는 어떻게 신청해요?',
  '마감이 주말이면 어떻게 돼요?',
  '증빙 자료는 언제까지 보관해요?',
]

const leaveQa: Evidence = {
  type: 'QA',
  label: '연차는 어떻게 신청하나요?',
  text: '시스템 A의 근태 메뉴에서 신청하고, 리더가 승인하면 확정돼요.',
  docTitle: '사내 생활 안내서',
  page: 3,
  quote: '연차는 근태 메뉴에서 신청하고 리더 승인 후 확정한다.',
  docId: 'mock-doc-1',
  path: null,
  qaKey: 'QA-01',
}

const halfLeaveQa: Evidence = {
  type: 'QA',
  label: '반차는 어떻게 쓰나요?',
  text: '근태 메뉴에서 오전 또는 오후 반차를 골라 신청해요.',
  docTitle: '사내 생활 안내서',
  page: 4,
  quote: null,
  docId: 'mock-doc-1',
  path: null,
  qaKey: 'QA-02',
}

const eventLeaveDoc: Evidence = {
  type: 'DOC',
  label: '사내 생활 안내서 > 3. 경조 휴가',
  text: null,
  docTitle: '사내 생활 안내서',
  page: 8,
  quote: '경조사로 인한 휴가는 본인 결혼 5일, 직계가족 장례 3일이다.',
  docId: 'mock-doc-1',
  path: null,
  qaKey: null,
}

const deadlineQa: Evidence = {
  type: 'QA',
  label: '마감이 주말이면 어떻게 되나요?',
  text: '주말이나 공휴일이면 바로 앞 영업일로 당겨져요. 할 일 줄에 원래 날짜와 당긴 이유가 같이 보여요.',
  docTitle: '포털 사용 안내',
  page: 2,
  quote: null,
  docId: 'mock-doc-2',
  path: null,
  qaKey: 'QA-03',
}

const evidenceDoc: Evidence = {
  type: 'DOC',
  label: '운영 안내서 > 증빙 자료 보관',
  text: null,
  docTitle: '운영 안내서',
  page: 23,
  quote: '과정 종료 후 증빙 자료는 종료일로부터 3년 동안 보관한다.',
  docId: 'mock-doc-3',
  path: null,
  qaKey: null,
}

const tasksScreen: Evidence = {
  type: 'SCREEN',
  label: '과정별 할 일 보기',
  text: null,
  docTitle: null,
  page: null,
  quote: null,
  docId: null,
  path: '/tasks',
  qaKey: null,
}

const leaveDeadlineQa: Evidence = {
  type: 'QA',
  label: '연차는 며칠 전까지 신청해야 하나요?',
  text: '사용일 3영업일 전까지 신청해 주세요.',
  docTitle: '사내 생활 안내서',
  page: 3,
  quote: null,
  docId: 'mock-doc-1',
  path: null,
  qaKey: 'QA-04',
}

const halfLeaveDeadlineQa: Evidence = {
  ...halfLeaveQa,
  label: '반차는 며칠 전까지 신청해야 하나요?',
  qaKey: 'QA-05',
}

const moreGuide = { kind: 'more', text: '자세한 내용은 담당자에게 문의해 주세요.' } as const

const noAnswerCounts = new Map<string, number>()

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function answered(conversationId: string, answer: Evidence | null): QuestionResponse {
  noAnswerCounts.set(conversationId, 0)
  return { conversationId, status: 'answered', answer, candidates: [], guide: moreGuide, contextUsed: false }
}

function clarify(conversationId: string, candidates: Evidence[], contextUsed = false): QuestionResponse {
  return { conversationId, status: 'clarify', answer: null, candidates, guide: null, contextUsed }
}

function noAnswer(conversationId: string): QuestionResponse {
  const count = (noAnswerCounts.get(conversationId) ?? 0) + 1
  noAnswerCounts.set(conversationId, count)

  const guide = count === 1
    ? { kind: 'rephrase', text: '찾으시는 답을 찾지 못했어요. 다시 말씀해 주세요.' } as const
    : { kind: 'contact', text: '답을 찾지 못했어요. 담당자에게 문의해 주세요.' } as const
  return { conversationId, status: 'no_answer', answer: null, candidates: [], guide, contextUsed: false }
}

export async function askQuestionMock(request: QuestionRequest): Promise<QuestionResponse> {
  await wait(700)

  const { query } = request
  const conversationId = request.conversationId ?? crypto.randomUUID()

  if (query.includes('연결 오류')) {
    throw new ApiError(503, {
      code: 'NLP_UNAVAILABLE',
      message: '질문 서비스에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.',
      fieldErrors: [],
    })
  }
  if (query.includes('시간 초과')) {
    throw new ApiError(504, { code: 'NLP_TIMEOUT', message: '질문 서비스의 응답 시간이 초과되었습니다.', fieldErrors: [] })
  }

  if (request.candidateSelected) return answered(conversationId, null)
  if (request.noneSelected) return noAnswer(conversationId)

  if (/\d{2,3}-\d{3,4}-\d{4}/.test(query)) {
    return { conversationId, status: 'pii_warning', answer: null, candidates: [], guide: null, contextUsed: false }
  }

  if (query.includes('며칠') && request.conversationId) {
    return clarify(conversationId, [leaveDeadlineQa, halfLeaveDeadlineQa], true)
  }
  if (query.includes('휴가')) return clarify(conversationId, [leaveQa, halfLeaveQa, eventLeaveDoc])
  if (query.includes('할 일')) return answered(conversationId, tasksScreen)
  if (query.includes('연차')) return answered(conversationId, leaveQa)
  if (query.includes('마감')) return answered(conversationId, deadlineQa)
  if (query.includes('보관')) return answered(conversationId, evidenceDoc)

  return noAnswer(conversationId)
}
