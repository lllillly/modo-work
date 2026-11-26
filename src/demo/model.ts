import * as seed from './seed'

import type { AuthUser } from '../types/auth'
import type { UserRole } from '../types/user'

type Row = Record<string, string>
type ReferenceType = 'COURSE_START' | 'COURSE_END' | 'MONTH_END' | 'ALWAYS'
type TaskStatus = 'TODO' | 'DONE' | 'REVIEWED'

export const DEMO_BASE_DATE = '2026-11-26'
export const DUE_SOON_BUSINESS_DAYS = 3

function parseCsv(text: string): Row[] {
  const rows: string[][] = []
  let row: string[] = []
  let cell = ''
  let quoted = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        cell += '"'
        i++
      } else if (ch === '"') quoted = false
      else cell += ch
    } else if (ch === '"') quoted = true
    else if (ch === ',') {
      row.push(cell)
      cell = ''
    } else if (ch === '\n') {
      row.push(cell)
      rows.push(row)
      row = []
      cell = ''
    } else cell += ch
  }
  row.push(cell)
  rows.push(row)
  const [header, ...body] = rows
  return body.filter((r) => r.some((v) => v !== '')).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ''])))
}

const DAY = 86_400_000
const toTime = (date: string) => Date.UTC(+date.slice(0, 4), +date.slice(5, 7) - 1, +date.slice(8, 10))
const fromTime = (time: number) => new Date(time).toISOString().slice(0, 10)
export const addDays = (date: string, days: number) => fromTime(toTime(date) + days * DAY)
export const diffDays = (a: string, b: string) => Math.round((toTime(a) - toTime(b)) / DAY)
const weekday = (date: string) => new Date(toTime(date)).getUTCDay()

function lastDayOfMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
}

function monthCycleEnd(start: string) {
  const year = +start.slice(0, 4)
  const month = +start.slice(5, 7) - 1
  const day = +start.slice(8, 10)
  const nextYear = month === 11 ? year + 1 : year
  const nextMonth = (month + 1) % 12
  const pad = (n: number) => String(n).padStart(2, '0')
  if (day > lastDayOfMonth(nextYear, nextMonth)) {
    return `${nextYear}-${pad(nextMonth + 1)}-${pad(lastDayOfMonth(nextYear, nextMonth))}`
  }
  return addDays(`${nextYear}-${pad(nextMonth + 1)}-${pad(day)}`, -1)
}

function realToday() {
  return new Date(Date.now() + 9 * 3_600_000).toISOString().slice(0, 10)
}

const realDiff = diffDays(realToday(), DEMO_BASE_DATE)
const shiftDays = Math.floor(realDiff / 7) * 7
export const today = realToday()
const shift = (date: string) => (date ? addDays(date, shiftDays) : date)
const shiftStamp = (stamp: string) => new Date(new Date(stamp).getTime() + shiftDays * DAY).toISOString()

export type Business = { id: string; name: string; sortOrder: number }
export type Area = { id: string; code: string; name: string; sortOrder: number; allowCrossAreaView: boolean }
export type OrgUnit = { id: string; name: string; sortOrder: number; closed: boolean }
export type DemoUser = {
  id: string
  email: string
  name: string
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
  orgUnit: OrgUnit | null
  areas: Area[]
  roles: AuthUser['roles']
}

export const businesses: Business[] = parseCsv(seed.businessesCsv).map((r, i) => ({
  id: `b${i + 1}`,
  name: r.name,
  sortOrder: +r.order,
}))
export const areas: Area[] = parseCsv(seed.areasCsv).map((r, i) => ({
  id: `a${i + 1}`,
  code: r.code,
  name: r.name,
  sortOrder: +r.order,
  allowCrossAreaView: r.can_view_other_areas === 'Y',
}))
export const orgUnits: OrgUnit[] = parseCsv(seed.orgUnitsCsv).map((r, i) => ({
  id: `o${i + 1}`,
  name: r.name,
  sortOrder: +r.order,
  closed: r.name.includes('(종료)'),
}))

const businessByName = new Map(businesses.map((b) => [b.name, b]))
const areaByName = new Map(areas.map((a) => [a.name, a]))
const orgByName = new Map(orgUnits.map((o) => [o.name, o]))
const statusMap = { 활성: 'ACTIVE', 비활성: 'INACTIVE', '승인 대기': 'PENDING' } as const

export const users: DemoUser[] = parseCsv(seed.usersCsv).map((r) => ({
  id: `u-${r.email.split('@')[0]}`,
  email: r.email,
  name: r.name,
  status: statusMap[r.status as keyof typeof statusMap] ?? 'ACTIVE',
  orgUnit: orgByName.get(r.org_unit) ?? null,
  areas: r.areas ? r.areas.split(';').map((n) => areaByName.get(n)).filter((a): a is Area => !!a) : [],
  roles: [],
}))
export const userByEmail = new Map(users.map((u) => [u.email, u]))
export const userById = new Map(users.map((u) => [u.id, u]))

const ref = (item: { id: string; name: string } | null) => (item ? { id: item.id, name: item.name } : null)

for (const r of parseCsv(seed.userRolesCsv)) {
  const user = userByEmail.get(r.email)
  if (!user) continue
  if (r.role === '관리자') {
    user.roles.push({ role: 'ADMIN', scopeType: 'ALL', leaderType: null, viewerTargetRole: null, orgUnit: null, area: null })
  } else if (r.role === '열람 전용') {
    user.roles.push({ role: 'VIEWER', scopeType: 'ALL', leaderType: null, viewerTargetRole: 'ASSIGNEE', orgUnit: null, area: null })
  } else if (r.role === '리더' && r.scope_type === '조직 단위') {
    user.roles.push({ role: 'LEADER', scopeType: 'ORG_UNIT', leaderType: 'ORG_UNIT', viewerTargetRole: null, orgUnit: ref(orgByName.get(r.scope_value) ?? null), area: null })
  } else if (r.role === '리더' && r.scope_type === '영역') {
    user.roles.push({ role: 'LEADER', scopeType: 'ALL', leaderType: 'AREA', viewerTargetRole: null, orgUnit: null, area: ref(areaByName.get(r.scope_value) ?? null) })
  } else if (r.role === '담당자') {
    user.roles.push({ role: 'ASSIGNEE', scopeType: 'ORG_UNIT', leaderType: null, viewerTargetRole: null, orgUnit: ref(user.orgUnit), area: null })
  }
}

export function primaryRole(user: DemoUser): UserRole {
  const order: UserRole[] = ['ADMIN', 'LEADER', 'VIEWER', 'ASSIGNEE']
  return order.find((role) => user.roles.some((r) => r.role === role)) ?? 'ASSIGNEE'
}

export function toAuthUser(user: DemoUser): AuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status === 'PENDING' ? 'PENDING' : 'ACTIVE',
    orgUnit: ref(user.orgUnit),
    areas: user.areas.map((a) => ({ id: a.id, name: a.name, allowCrossAreaView: a.allowCrossAreaView })),
    roles: user.roles,
  }
}

export type Course = {
  id: string
  externalKey: string
  business: Business
  name: string
  startDate: string
  endDate: string
  capacity: number | null
  lengthType: 'LONG' | 'SHORT'
  orgUnit: OrgUnit
  assignees: { area: Area; users: DemoUser[] }[]
}

export const courses: Course[] = parseCsv(seed.coursesCsv).map((r, i) => ({
  id: `c${String(i + 1).padStart(2, '0')}`,
  externalKey: r.external_key,
  business: businessByName.get(r.business)!,
  name: r.name,
  startDate: shift(r.start_date),
  endDate: shift(r.end_date),
  capacity: r.capacity ? +r.capacity : null,
  lengthType: r.length_type === '장기' ? 'LONG' : 'SHORT',
  orgUnit: orgByName.get(r.org_unit)!,
  assignees: areas.map((area) => ({
    area,
    users: (r[`assignee_${area.code}`] ?? '')
      .split(';')
      .map((email) => userByEmail.get(email.trim()))
      .filter((u): u is DemoUser => !!u),
  })),
}))
export const courseById = new Map(courses.map((c) => [c.id, c]))

export type DocumentRecord = {
  id: string
  title: string
  typeName: string
  businessIds: string[]
  effectiveDate: string | null
  file: string | null
  url: string | null
  pageCount: number | null
  fileSizeBytes: number | null
}

const demoFiles: Record<string, { file: string; pages: number; size: number }> = {
  '사내생활안내서_예시.pdf': { file: 'life-guide.pdf', pages: 6, size: 100176 },
  '출장경비기준_예시.pdf': { file: 'travel-expense.pdf', pages: 3, size: 68282 },
  '정보보안수칙_예시.pdf': { file: 'security-rules.pdf', pages: 3, size: 70823 },
  '운영업무안내서_예시.pdf': { file: 'operations-guide.pdf', pages: 4, size: 78086 },
}

export const documentTypes = [...new Set(parseCsv(seed.documentsCsv).map((r) => r.doc_type))].map((name, i) => ({
  id: `dt${i + 1}`,
  name,
}))

export const documents: DocumentRecord[] = parseCsv(seed.documentsCsv).map((r, i) => {
  const info = demoFiles[r.file]
  return {
    id: `d${i + 1}`,
    title: r.title,
    typeName: r.doc_type,
    businessIds: r.business ? r.business.split(';').map((n) => businessByName.get(n)!.id) : [],
    effectiveDate: r.effective_date || null,
    file: info?.file ?? null,
    url: r.url || null,
    pageCount: info?.pages ?? null,
    fileSizeBytes: info?.size ?? null,
  }
})
export const documentByTitle = new Map(documents.map((d) => [d.title, d]))

export type Tag = { id: string; businessId: string; name: string }
export const tags: Tag[] = []

export type Template = {
  id: string
  business: Business
  templateKey: string
  title: string
  phase: string
  area: Area
  tagIds: string[]
  referenceType: ReferenceType
  offset: number | null
  offsetLong: number | null
  offsetShort: number | null
  performer: string | null
  systemName: string | null
  documentIds: string[]
  requiresReview: boolean
  sortOrder: number
}

const referenceMap: Record<string, ReferenceType> = {
  시작일: 'COURSE_START',
  종료일: 'COURSE_END',
  월주기종료일: 'MONTH_END',
  상시: 'ALWAYS',
}
const num = (v: string) => (v === '' ? null : +v)

export const templates: Template[] = parseCsv(seed.templatesCsv).map((r, i) => {
  const business = businessByName.get(r.business)!
  const tagIds = r.tags
    ? r.tags.split(';').map((name) => {
      let tag = tags.find((t) => t.businessId === business.id && t.name === name)
      if (!tag) {
        tag = { id: `tag${tags.length + 1}`, businessId: business.id, name }
        tags.push(tag)
      }
      return tag.id
    })
    : []
  const doc = r.linked_doc ? documentByTitle.get(r.linked_doc) : undefined
  return {
    id: `tpl-${r.template_key}`,
    business,
    templateKey: r.template_key,
    title: r.name,
    phase: r.stage,
    area: areaByName.get(r.area)!,
    tagIds,
    referenceType: referenceMap[r.base],
    offset: num(r.offset),
    offsetLong: num(r.offset_long),
    offsetShort: num(r.offset_short),
    performer: r.performer || null,
    systemName: r.system || null,
    documentIds: doc ? [doc.id] : [],
    requiresReview: r.review_required === 'Y',
    sortOrder: i + 1,
  }
})
export const templateById = new Map(templates.map((t) => [t.id, t]))

export const holidays = parseCsv(seed.holidaysCsv).map((r, i) => ({
  id: `h${i + 1}`,
  date: shift(r.date),
  name: r.name,
  source: r.source === '수동' ? ('MANUAL' as const) : ('API' as const),
  version: 1,
}))
const holidaySet = new Set(holidays.map((h) => h.date))

export const isBusinessDay = (date: string) => weekday(date) !== 0 && weekday(date) !== 6 && !holidaySet.has(date)

function pullBack(raw: string) {
  const reasons = new Set<'WEEKEND' | 'HOLIDAY'>()
  let date = raw
  while (!isBusinessDay(date)) {
    reasons.add(holidaySet.has(date) ? 'HOLIDAY' : 'WEEKEND')
    date = addDays(date, -1)
  }
  return { dueDate: date, shiftReasons: [...reasons] }
}

export type Action = {
  id: string
  action: 'COMPLETE' | 'REVIEW' | 'CANCEL_COMPLETION' | 'CANCEL_REVIEW'
  actor: DemoUser
  memo: string | null
  createdAt: string
  targetActionLogId: string | null
}

export type Task = {
  id: string
  course: Course
  template: Template
  occurrenceNo: number
  periodStart: string | null
  periodEnd: string | null
  rawDueDate: string | null
  dueDate: string | null
  shiftReasons: ('WEEKEND' | 'HOLIDAY')[]
  status: TaskStatus
  completedBy: DemoUser | null
  completedAt: string | null
  reviewedBy: DemoUser | null
  reviewedAt: string | null
  completionActionLogId: string | null
  reviewActionLogId: string | null
  actions: Action[]
}

export const tasks: Task[] = []

function makeTask(course: Course, template: Template, occurrenceNo: number, raw: string | null, period?: [string, string]): Task {
  const pulled = raw ? pullBack(raw) : null
  return {
    id: `t-${course.id}-${template.templateKey}-${occurrenceNo}`,
    course,
    template,
    occurrenceNo,
    periodStart: period?.[0] ?? null,
    periodEnd: period?.[1] ?? null,
    rawDueDate: raw,
    dueDate: pulled?.dueDate ?? null,
    shiftReasons: pulled?.shiftReasons ?? [],
    status: 'TODO',
    completedBy: null,
    completedAt: null,
    reviewedBy: null,
    reviewedAt: null,
    completionActionLogId: null,
    reviewActionLogId: null,
    actions: [],
  }
}

for (const course of courses) {
  for (const template of templates.filter((t) => t.business.id === course.business.id)) {
    const offset = (course.lengthType === 'LONG' ? template.offsetLong : template.offsetShort) ?? template.offset ?? 0
    if (template.referenceType === 'ALWAYS') tasks.push(makeTask(course, template, 0, null))
    else if (template.referenceType === 'COURSE_START') tasks.push(makeTask(course, template, 0, addDays(course.startDate, offset)))
    else if (template.referenceType === 'COURSE_END') tasks.push(makeTask(course, template, 0, addDays(course.endDate, offset)))
    else {
      let start = course.startDate
      for (let n = 1; start <= course.endDate && n <= 24; n++) {
        let end = monthCycleEnd(start)
        if (end >= course.endDate) end = course.endDate
        tasks.push(makeTask(course, template, n, addDays(end, offset), [start, end]))
        start = addDays(end, 1)
      }
    }
  }
}
export const taskById = new Map(tasks.map((t) => [t.id, t]))

const actionMap = { 완료: 'COMPLETE', 확인: 'REVIEW', 취소: 'CANCEL_COMPLETION' } as const
const logs = parseCsv(seed.completionLogsCsv).sort((a, b) => a.at.localeCompare(b.at))
logs.forEach((r, i) => {
  const course = courses.find((c) => c.externalKey === r.external_key)
  const task = course && taskById.get(`t-${course.id}-${r.template_key}-${r.cycle_no}`)
  const actor = userByEmail.get(r.actor)
  if (!task || !actor) return
  const action = actionMap[r.action as keyof typeof actionMap]
  const createdAt = shiftStamp(r.at)
  const id = `log${i + 1}`
  if (action === 'COMPLETE') {
    task.status = 'DONE'
    task.completedBy = actor
    task.completedAt = createdAt
    task.completionActionLogId = id
    task.actions.push({ id, action, actor, memo: r.memo || null, createdAt, targetActionLogId: null })
  } else if (action === 'REVIEW') {
    task.status = 'REVIEWED'
    task.reviewedBy = actor
    task.reviewedAt = createdAt
    task.reviewActionLogId = id
    task.actions.push({ id, action, actor, memo: r.memo || null, createdAt, targetActionLogId: task.completionActionLogId })
  } else {
    task.actions.push({ id, action, actor, memo: r.memo || null, createdAt, targetActionLogId: task.completionActionLogId })
    task.status = 'TODO'
    task.completedBy = null
    task.completedAt = null
    task.completionActionLogId = null
  }
})

export const intents = parseCsv(seed.intentsCsv)
export const intentExamples = parseCsv(seed.intentExamplesCsv)
export const qaItems = parseCsv(seed.qaCsv)
