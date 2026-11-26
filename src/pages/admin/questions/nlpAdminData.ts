import { ApiError } from '../../../api/client'
import type { BusinessScope, EvalRow, ScopedBusiness } from '../../../types/nlpAdmin'

export const ALL_BUSINESSES = 'ALL'

export type Option = { value: string; label: string }
export type NlpOptions = { businesses: Option[]; documents: Option[]; qas: Option[]; intents: Option[] }

// 'ALL'(공통)과 개별 사업은 함께 고를 수 없어서 마지막에 고른 쪽만 남긴다.
export function normalizeBusinesses(values: string[]) {
  return values[values.length - 1] === ALL_BUSINESSES
    ? [ALL_BUSINESSES]
    : values.filter((value) => value !== ALL_BUSINESSES)
}

export const fromScope = (scope: BusinessScope, ids: string[]) => (scope === 'ALL' ? [ALL_BUSINESSES] : ids)

export function toScope(ids: string[]) {
  return ids.includes(ALL_BUSINESSES)
    ? { businessScope: 'ALL' as const, businessIds: [] }
    : { businessScope: 'SELECTED' as const, businessIds: ids }
}

// 비활성 사업은 옵션 목록에 없을 수 있어 목록 응답의 이름으로 채운다.
export function withScopedBusinesses(options: Option[], scoped: ScopedBusiness[] = []) {
  const extra = scoped
    .filter((business) => !options.some((option) => option.value === business.id))
    .map((business) => ({ value: business.id, label: business.active ? business.name : `${business.name}(비활성)` }))
  return [...options, ...extra]
}

export const businessNames = (scope: BusinessScope, businesses: ScopedBusiness[]) =>
  scope === 'ALL' ? '공통' : businesses.map((business) => business.name).join(', ')

// 서버 필드 오류를 폼 필드에 붙인다. 폼에 없는 필드는 무시한다.
export function fieldErrorsOf<T extends string>(error: unknown, names: readonly T[]) {
  if (!(error instanceof ApiError)) return []
  return error.fieldErrors.flatMap((entry) => {
    const name = names.find((field) => field === entry.field)
    return name ? [{ name, errors: [entry.message] }] : []
  })
}

// 포함률에 넣는 문항인지. NLP의 EVAL_NO_INTENT와 같은 표기
export const isScored = (row: EvalRow) => !!row.expected && !['답 없음', '개인정보 경고'].includes(row.expected)

// 서버 판정 규칙(engine.ask)과 같다. 원점수(top_score)로 비교한다. 반올림한 값으로 비교하면 경계에서 판정이 바뀐다
export function simulate(row: EvalRow, answer: number, clarify: number): EvalRow['status'] {
  if (row.top_score === null) return row.status
  if (row.top_score >= answer) return 'answered'
  return row.top_score >= clarify ? 'clarify' : 'no_answer'
}
