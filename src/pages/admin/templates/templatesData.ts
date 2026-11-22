import dayjs from 'dayjs'

import type { ReferenceType, TaskTemplate } from '../../../types/taskTemplate'

export const referenceLabels: Record<ReferenceType, string> = {
  COURSE_START: '과정 시작일',
  COURSE_END: '과정 종료일',
  MONTH_END: '월 주기 종료일',
  ALWAYS: '상시',
}

export const ALWAYS_PHASE = '상시'

export const TURN_OFF_NOTICE =
  '끄면 새로 등록하는 과정에 이 할 일이 만들어지지 않고, 진행 중인 과정의 미완료 할 일도 목록에서 빠져요. 완료한 할 일과 처리 기록은 그대로 남아요.'
const NO_PHASE = '단계 없음'

function describeDays(days: number) {
  if (days === 0) return '당일'
  return `${Math.abs(days)}일 ${days < 0 ? '전' : '뒤'}`
}

function describeOffset(type: ReferenceType, days: number) {
  if (type === 'MONTH_END') {
    if (days === 0) return '월 주기 끝나는 날'
    return days > 0 ? `월 주기 끝난 뒤 ${days}일` : `월 주기 끝나기 ${-days}일 전`
  }
  return `${type === 'COURSE_START' ? '시작' : '종료'} ${describeDays(days)}`
}

export function getConditionalOffsets(template: Pick<TaskTemplate, 'defaultOffsetDays' | 'longOffsetDays' | 'shortOffsetDays'>) {
  const { defaultOffsetDays, longOffsetDays, shortOffsetDays } = template
  if (longOffsetDays === null && shortOffsetDays === null) return null
  return { long: longOffsetDays ?? defaultOffsetDays, short: shortOffsetDays ?? defaultOffsetDays }
}

export function describeDeadline(template: Pick<TaskTemplate, 'referenceType' | 'defaultOffsetDays' | 'longOffsetDays' | 'shortOffsetDays'>) {
  const { referenceType, defaultOffsetDays } = template
  if (referenceType === 'ALWAYS') return '상시 · 마감 없음'
  const parts: string[] = []
  if (defaultOffsetDays !== null) parts.push(describeOffset(referenceType, defaultOffsetDays))
  const conditional = getConditionalOffsets(template)
  if (conditional && conditional.long !== null && conditional.short !== null) {
    parts.push(`장기 ${describeDays(conditional.long)} / 단기 ${describeDays(conditional.short)}`)
  }
  return parts.join(' · ') || '-'
}

export function getPhaseName(template: Pick<TaskTemplate, 'referenceType' | 'phase'>) {
  if (template.referenceType === 'ALWAYS') return ALWAYS_PHASE
  return template.phase ?? NO_PHASE
}

export function groupByPhase(templates: TaskTemplate[]) {
  const phases = new Map<string, TaskTemplate[]>()
  const always: TaskTemplate[] = []
  for (const template of templates) {
    if (template.referenceType === 'ALWAYS') {
      always.push(template)
      continue
    }
    const phase = getPhaseName(template)
    phases.set(phase, [...(phases.get(phase) ?? []), template])
  }
  const groups = [...phases].map(([name, items]) => ({ key: `phase:${name}`, name, isAlways: false, items }))
  if (always.length) groups.push({ key: 'always', name: ALWAYS_PHASE, isAlways: true, items: always })
  return groups
}

const weekdayNames = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

export function previewDeadline(baseDate: string, offsetDays: number) {
  const raw = dayjs(baseDate).add(offsetDays, 'day')
  let due = raw
  while (due.day() === 0 || due.day() === 6) due = due.subtract(1, 'day')
  return {
    rawDueDate: raw.format('YYYY-MM-DD'),
    dueDate: due.format('YYYY-MM-DD'),
    shiftReason: due.isSame(raw, 'day') ? null : weekdayNames[raw.day()],
  }
}
