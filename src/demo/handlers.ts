import {
  DUE_SOON_BUSINESS_DAYS,
  addDays,
  areas,
  businesses,
  courseById,
  courses,
  documentTypes,
  documents,
  holidays,
  intentExamples,
  intents,
  isBusinessDay,
  orgUnits,
  primaryRole,
  qaItems,
  tags,
  taskById,
  tasks,
  templateById,
  templates,
  toAuthUser,
  today,
  users,
} from './model'
import { searchDocuments } from './documentText'

import type { Course, DemoUser, Task, Template } from './model'

export type DemoResult = { status: number; body: unknown }

const ok = (body: unknown): DemoResult => ({ status: 200, body })
const fail = (status: number, code: string, message: string): DemoResult => ({
  status,
  body: { code, message, fieldErrors: [] },
})
const notFound = () => fail(404, 'NOT_FOUND', '대상을 찾을 수 없어요.')
const denied = () => fail(403, 'ACCESS_DENIED', '이 화면을 볼 권한이 없어요.')

function page<T>(items: T[], params: URLSearchParams, prefix = '') {
  const pageNo = Number(params.get(`${prefix}${prefix ? 'Page' : 'page'}`) ?? 0)
  const size = Number(params.get(`${prefix}${prefix ? 'Size' : 'size'}`) ?? 20)
  return {
    items: items.slice(pageNo * size, pageNo * size + size),
    page: pageNo,
    size,
    totalElements: items.length,
    totalPages: Math.max(1, Math.ceil(items.length / size)),
  }
}

const has = (user: DemoUser, role: string) => user.roles.some((r) => r.role === role)
const isAdmin = (user: DemoUser) => has(user, 'ADMIN')
const leaderOrgIds = (user: DemoUser) => user.roles.filter((r) => r.leaderType === 'ORG_UNIT').map((r) => r.orgUnit?.id)
const leaderAreaIds = (user: DemoUser) => user.roles.filter((r) => r.leaderType === 'AREA').map((r) => r.area?.id)

const assigneesOf = (course: Course, areaId: string) => course.assignees.find((a) => a.area.id === areaId)?.users ?? []
const isAssignedArea = (user: DemoUser, task: Task) => assigneesOf(task.course, task.template.area.id).some((u) => u.id === user.id)
const isAssignedCourse = (user: DemoUser, course: Course) => course.assignees.some((a) => a.users.some((u) => u.id === user.id))

function canReviewArea(user: DemoUser, course: Course, areaId: string) {
  if (isAdmin(user)) return true
  return leaderOrgIds(user).includes(course.orgUnit.id) || leaderAreaIds(user).includes(areaId)
}

function canSeeTask(user: DemoUser, task: Task) {
  if (isAdmin(user) || has(user, 'VIEWER')) return true
  if (canReviewArea(user, task.course, task.template.area.id)) return true
  if (!isAssignedCourse(user, task.course)) return false
  return user.areas.some((a) => a.allowCrossAreaView) || isAssignedArea(user, task)
}

function canSeeCourse(user: DemoUser, course: Course) {
  if (isAdmin(user) || has(user, 'VIEWER')) return true
  if (leaderOrgIds(user).includes(course.orgUnit.id) || leaderAreaIds(user).length > 0) return true
  return isAssignedCourse(user, course)
}

const userRef = (user: DemoUser | null) => (user ? { id: user.id, name: user.name } : null)
const assignedUser = (user: DemoUser) => ({ id: user.id, name: user.name, email: user.email, status: user.status })

function courseResponse(course: Course) {
  return {
    id: course.id,
    businessId: course.business.id,
    externalKey: course.externalKey,
    orgUnitId: course.orgUnit.id,
    orgUnitName: course.orgUnit.name,
    name: course.name,
    startDate: course.startDate,
    endDate: course.endDate,
    capacity: course.capacity,
    lengthType: course.lengthType,
    scheduleRevision: 1,
    version: 1,
    archivedAt: null,
    isReadOnly: false,
    assignees: course.assignees.map((a) => ({
      areaId: a.area.id,
      areaName: a.area.name,
      userIds: a.users.map((u) => u.id),
      users: a.users.map(assignedUser),
    })),
  }
}

function taskResponse(task: Task, viewer: DemoUser) {
  const { course, template } = task
  const canReviewInArea = canReviewArea(viewer, course, template.area.id)
  return {
    id: task.id,
    businessId: course.business.id,
    courseId: course.id,
    courseName: course.name,
    orgUnitId: course.orgUnit.id,
    orgUnitName: course.orgUnit.name,
    orgUnitClosed: course.orgUnit.closed,
    areaId: template.area.id,
    areaName: template.area.name,
    assignees: assigneesOf(course, template.area.id).map(assignedUser),
    isReadOnly: false,
    supersededByTaskId: null,
    title: template.title,
    displayText: null,
    phase: template.phase,
    referenceType: template.referenceType,
    requiresReview: template.requiresReview,
    canReviewInArea,
    canReview: canReviewInArea && template.requiresReview && task.status === 'DONE',
    occurrenceNo: task.occurrenceNo,
    periodStart: task.periodStart,
    periodEnd: task.periodEnd,
    rawDueDate: task.rawDueDate,
    dueDate: task.dueDate,
    shiftReasons: task.dueDate ? task.shiftReasons : null,
    status: task.status,
    isMyArea: isAssignedArea(viewer, task),
    completedBy: userRef(task.completedBy),
    completedAt: task.completedAt,
    reviewedBy: userRef(task.reviewedBy),
    reviewedAt: task.reviewedAt,
    completionActionLogId: task.completionActionLogId,
    reviewActionLogId: task.reviewActionLogId,
    version: 1,
    tags: template.tagIds.map((id) => ({ id, name: tags.find((t) => t.id === id)?.name ?? '' })),
    documents: template.documentIds.map((id) => ({ id, title: documents.find((d) => d.id === id)?.title ?? null, available: true })),
  }
}

const byDue = (a: Task, b: Task) => {
  if (a.dueDate === b.dueDate) return a.id.localeCompare(b.id)
  if (!a.dueDate) return 1
  if (!b.dueDate) return -1
  return a.dueDate.localeCompare(b.dueDate)
}

function dueSoonLimit() {
  let date = today
  let count = 0
  while (count < DUE_SOON_BUSINESS_DAYS) {
    date = addDays(date, 1)
    if (isBusinessDay(date)) count++
  }
  return date
}

const isOverdue = (t: Task) => t.status === 'TODO' && !!t.dueDate && t.dueDate < today
const isToday = (t: Task) => t.status === 'TODO' && t.dueDate === today
const isDueSoon = (t: Task) => t.status === 'TODO' && !!t.dueDate && t.dueDate > today && t.dueDate <= dueSoonLimit()
const isDated = (t: Task) => t.template.referenceType !== 'ALWAYS'

function listTasks(viewer: DemoUser, params: URLSearchParams) {
  const businessId = params.get('businessId')
  const scope = params.get('scope') ?? 'all'
  const from = params.get('dueDateFrom')
  const to = params.get('dueDateTo')
  const items = tasks
    .filter((t) => !businessId || t.course.business.id === businessId)
    .filter((t) => (scope === 'mine' ? isAssignedArea(viewer, t) : canSeeTask(viewer, t)))
    .filter((t) => !params.get('courseId') || t.course.id === params.get('courseId'))
    .filter((t) => !params.get('areaId') || t.template.area.id === params.get('areaId'))
    .filter((t) => !params.get('tagId') || t.template.tagIds.includes(params.get('tagId')!))
    .filter((t) => !params.get('status') || t.status === params.get('status'))
    .filter((t) => (!from && !to) || (!!t.dueDate && (!from || t.dueDate >= from) && (!to || t.dueDate <= to)))
    .sort(byDue)
  return page(items.map((t) => taskResponse(t, viewer)), params)
}

function nextTaskOf(list: Task[]) {
  return list.filter((t) => t.status === 'TODO' && isDated(t)).sort(byDue)[0] ?? null
}

function assigneeHome(viewer: DemoUser, params: URLSearchParams) {
  const businessId = params.get('businessId')
  const scope = params.get('scope') ?? 'mine'
  const inBusiness = tasks.filter((t) => t.course.business.id === businessId && isDated(t))
  const mine = inBusiness.filter((t) => isAssignedArea(viewer, t))
  const scoped = scope === 'mine' ? mine : inBusiness.filter((t) => canSeeTask(viewer, t))
  const overdue = mine.filter(isOverdue).sort(byDue)
  const todayTasks = mine.filter(isToday).sort(byDue)
  const dueSoon = mine.filter(isDueSoon).sort(byDue)

  const month = params.get('month') ?? today.slice(0, 7)
  const calendarMap = new Map<string, { date: string; incompleteCount: number; overdueCount: number }>()
  for (const t of scoped) {
    if (t.status !== 'TODO' || !t.dueDate?.startsWith(month)) continue
    const day = calendarMap.get(t.dueDate) ?? { date: t.dueDate, incompleteCount: 0, overdueCount: 0 }
    day.incompleteCount++
    if (t.dueDate < today) day.overdueCount++
    calendarMap.set(t.dueDate, day)
  }

  const selectedDate = params.get('selectedDate') ?? today
  const dayAll = scoped.filter((t) => t.dueDate === selectedDate)
  const dayMine = dayAll.filter((t) => isAssignedArea(viewer, t))

  const courseList = courses
    .filter((c) => c.business.id === businessId && (scope === 'mine' ? isAssignedCourse(viewer, c) : canSeeCourse(viewer, c)))
    .map((course) => {
      const list = scoped.filter((t) => t.course.id === course.id)
      const next = nextTaskOf(list)
      return {
        course: courseResponse(course),
        completedCount: list.filter((t) => t.status !== 'TODO').length,
        totalCount: list.length,
        nextTask: next ? taskResponse(next, viewer) : null,
      }
    })
    .sort((a, b) =>
      params.get('courseSort') === 'name'
        ? a.course.name.localeCompare(b.course.name)
        : (a.nextTask?.dueDate ?? '9999').localeCompare(b.nextTask?.dueDate ?? '9999'),
    )

  return {
    today,
    dueSoonBusinessDays: DUE_SOON_BUSINESS_DAYS,
    summary: { todayCount: todayTasks.length, overdueCount: overdue.length, dueSoonCount: dueSoon.length },
    alerts: page([...overdue, ...todayTasks, ...dueSoon].map((t) => taskResponse(t, viewer)), params, 'alert'),
    calendar: [...calendarMap.values()].sort((a, b) => a.date.localeCompare(b.date)),
    dayTasks: { mineCount: dayMine.length, otherCount: dayAll.length - dayMine.length },
    courses: page(courseList, params, 'course'),
  }
}

function leaderHome(viewer: DemoUser, params: URLSearchParams) {
  if (!has(viewer, 'LEADER') && !isAdmin(viewer)) return denied()
  const businessId = params.get('businessId')
  const scoped = tasks.filter(
    (t) => t.course.business.id === businessId && isDated(t) && canReviewArea(viewer, t.course, t.template.area.id),
  )
  const overdue = scoped.filter(isOverdue).sort(byDue)
  const dueSoon = scoped.filter((t) => isToday(t) || isDueSoon(t)).sort(byDue)
  const pending = scoped.filter((t) => t.status === 'DONE' && t.template.requiresReview).sort(byDue)
  const visibleCourses = courses.filter((c) => c.business.id === businessId && scoped.some((t) => t.course.id === c.id))
  const businessAreas = areas.filter((a) => templates.some((t) => t.business.id === businessId && t.area.id === a.id))

  const courseItems = visibleCourses
    .map((course) => {
      const list = scoped.filter((t) => t.course.id === course.id)
      const next = nextTaskOf(list)
      return {
        course: courseResponse(course),
        orgUnitClosed: course.orgUnit.closed,
        areas: businessAreas
          .filter((a) => list.some((t) => t.template.area.id === a.id))
          .map((a) => {
            const inArea = list.filter((t) => t.template.area.id === a.id)
            return {
              areaId: a.id,
              areaName: a.name,
              canReview: canReviewArea(viewer, course, a.id),
              completedCount: inArea.filter((t) => t.status !== 'TODO').length,
              totalCount: inArea.length,
            }
          }),
        overdueCount: list.filter(isOverdue).length,
        nextTask: next ? taskResponse(next, viewer) : null,
      }
    })
    .sort((a, b) => (a.nextTask?.dueDate ?? '9999').localeCompare(b.nextTask?.dueDate ?? '9999'))

  const records = scoped
    .filter((t) => t.status !== 'TODO' && t.completedAt)
    .sort((a, b) => (b.reviewedAt ?? b.completedAt!).localeCompare(a.reviewedAt ?? a.completedAt!))
    .map((t) => ({
      task: taskResponse(t, viewer),
      orgUnitId: t.course.orgUnit.id,
      orgUnitName: t.course.orgUnit.name,
      orgUnitClosed: t.course.orgUnit.closed,
      canReview: canReviewArea(viewer, t.course, t.template.area.id) && t.template.requiresReview && t.status === 'DONE',
      completionMemo: t.actions.find((a) => a.id === t.completionActionLogId)?.memo ?? null,
    }))

  const overdueByArea = businessAreas
    .map((a) => ({ areaId: a.id, areaName: a.name, count: overdue.filter((t) => t.template.area.id === a.id).length }))
    .filter((a) => a.count > 0)

  return ok({
    today,
    dueSoonBusinessDays: DUE_SOON_BUSINESS_DAYS,
    summary: { overdueCount: overdue.length, dueSoonCount: dueSoon.length, pendingReviewCount: pending.length, overdueByArea },
    alerts: page([...overdue, ...dueSoon].map((t) => taskResponse(t, viewer)), params, 'alert'),
    pendingReviews: page(pending.map((t) => taskResponse(t, viewer)), params, 'review'),
    activeCourseCount: visibleCourses.filter((c) => c.startDate <= today && c.endDate >= today).length,
    courses: page(courseItems, params, 'course'),
    records: page(records, params, 'record'),
  })
}

function progressOf(course: Course) {
  if (course.startDate > today) return 'UPCOMING'
  if (course.endDate < today) return 'ENDED'
  return 'ONGOING'
}

function adminCourses(params: URLSearchParams) {
  if (params.get('state') === 'archived') return page([], params)
  const q = params.get('q')?.toLowerCase()
  const items = courses
    .filter((c) => !params.get('businessId') || c.business.id === params.get('businessId'))
    .filter((c) => !q || c.name.toLowerCase().includes(q) || c.externalKey.toLowerCase().includes(q))
    .filter((c) => !params.get('orgUnitId') || c.orgUnit.id === params.get('orgUnitId'))
    .filter((c) => !params.get('progressStatus') || progressOf(c) === params.get('progressStatus'))
    .filter((c) => params.get('needsAssignmentReview') !== 'true' || c.assignees.some((a) => a.users.length === 0 || a.users.some((u) => u.status !== 'ACTIVE')))
    .sort((a, b) => a.startDate.localeCompare(b.startDate))
  return page(items.map(courseResponse), params)
}

function templateResponse(template: Template) {
  return {
    id: template.id,
    businessId: template.business.id,
    templateKey: template.templateKey,
    areaId: template.area.id,
    title: template.title,
    phase: template.phase,
    referenceType: template.referenceType,
    defaultOffsetDays: template.offset,
    longOffsetDays: template.offsetLong,
    shortOffsetDays: template.offsetShort,
    performer: template.performer,
    systemName: template.systemName,
    displayText: null,
    tagIds: template.tagIds,
    documentIds: template.documentIds,
    requiresReview: template.requiresReview,
    sortOrder: template.sortOrder,
    revision: 1,
    version: 1,
    isActive: true,
  }
}

function documentResponse(doc: (typeof documents)[number]) {
  const admin = users.find((u) => u.roles.some((r) => r.role === 'ADMIN'))!
  return {
    id: doc.id,
    title: doc.title,
    pageCount: doc.pageCount,
    fileSizeBytes: doc.fileSizeBytes,
    updatedAt: `${doc.effectiveDate ?? '2026-10-01'}T09:00:00+09:00`,
    createdBy: { id: admin.id, name: admin.name },
    documentTypeId: documentTypes.find((t) => t.name === doc.typeName)!.id,
    documentTypeName: doc.typeName,
    effectiveDate: doc.effectiveDate,
    sourceType: doc.file ? 'FILE' : 'LINK',
    originalFilename: doc.file,
    externalUrl: doc.url,
    businessScope: doc.businessIds.length ? 'SELECTED' : 'ALL',
    businessIds: doc.businessIds,
    contentRevision: 1,
    indexStatus: doc.file ? 'READY' : 'UNSUPPORTED',
    indexError: null,
    deletedAt: null,
    cleanupPending: false,
  }
}

function managedUser(user: DemoUser) {
  const auth = toAuthUser(user)
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    status: user.status,
    version: 1,
    orgUnit: auth.orgUnit,
    areas: auth.areas,
    roles: auth.roles,
    createdAt: '2026-09-01T09:00:00+09:00',
    updatedAt: '2026-09-01T09:00:00+09:00',
  }
}

function userList(viewer: DemoUser, params: URLSearchParams, adminOnly: boolean) {
  if (adminOnly && !isAdmin(viewer)) return denied()
  if (!adminOnly && !isAdmin(viewer) && leaderOrgIds(viewer).length === 0) return denied()
  const q = params.get('q')?.toLowerCase()
  const items = users
    .filter((u) => isAdmin(viewer) || u.status === 'PENDING' || leaderOrgIds(viewer).includes(u.orgUnit?.id))
    .filter((u) => !q || u.name.includes(q) || u.email.includes(q))
    .filter((u) => !params.get('orgUnitId') || u.orgUnit?.id === params.get('orgUnitId'))
    .filter((u) => !params.get('role') || u.roles.some((r) => r.role === params.get('role')))
    .filter((u) => !params.get('status') || u.status === params.get('status'))
  return ok(page(items.map(managedUser), params))
}

const businessRef = (id: string) => {
  const b = businesses.find((x) => x.id === id)!
  return { id: b.id, name: b.name, active: true }
}

function qaRecords() {
  return qaItems.map((r, i) => {
    const doc = documents.find((d) => d.title === r.source_doc)
    const ids = r.business ? r.business.split(';').map((n) => businesses.find((b) => b.name === n)!.id) : []
    return {
      id: `qa${i + 1}`,
      qaKey: r.qa_key,
      question: r.question,
      answer: r.answer,
      businessIds: ids,
      doc,
      page: r.source_page ? Number(r.source_page) : null,
    }
  })
}

function intentRecords() {
  const qas = qaRecords()
  return intents.map((r, i) => {
    const qa = r.target_type === 'QA' ? qas.find((q) => q.qaKey === r.target) : undefined
    const doc = r.target_type === 'DOC' ? documents.find((d) => d.title === r.target) : undefined
    return {
      id: `int${i + 1}`,
      intentKey: r.intent_key,
      name: r.name,
      targetType: r.target_type as 'QA' | 'DOC' | 'SCREEN',
      qa,
      doc,
      path: r.target_type === 'SCREEN' ? r.target : null,
      examples: intentExamples.filter((e) => e.intent_key === r.intent_key).map((e, j) => ({ id: `ex${i}-${j}`, example: e.example })),
    }
  })
}

function listItems(kind: string) {
  if (kind === 'businesses') {
    return businesses.map((b) => ({ id: b.id, name: b.name, sortOrder: b.sortOrder, isActive: true, version: 1, isInUse: true, courseCount: courses.filter((c) => c.business.id === b.id).length }))
  }
  if (kind === 'areas') {
    return areas.map((a) => ({ id: a.id, name: a.name, sortOrder: a.sortOrder, isActive: true, version: 1, isInUse: true, userCount: users.filter((u) => u.areas.some((x) => x.id === a.id)).length, allowCrossAreaView: a.allowCrossAreaView }))
  }
  if (kind === 'orgUnits') {
    return orgUnits.map((o) => ({ id: o.id, name: o.name, sortOrder: o.sortOrder, isActive: true, version: 1, isInUse: true, courseCount: courses.filter((c) => c.orgUnit.id === o.id).length, userCount: users.filter((u) => u.orgUnit?.id === o.id).length, isClosed: o.closed }))
  }
  return documentTypes.map((t, i) => ({ id: t.id, name: t.name, sortOrder: i + 1, isActive: true, version: 1, isInUse: true, documentCount: documents.filter((d) => d.typeName === t.name).length }))
}

export function handleGet(viewer: DemoUser, path: string): DemoResult {
  const [pathname, query = ''] = path.split('?')
  const params = new URLSearchParams(query)
  const parts = pathname.split('/').filter(Boolean).map(decodeURIComponent)
  const admin = isAdmin(viewer)
  const adminGuard = (result: () => DemoResult) => (admin ? result() : denied())

  if (pathname === '/auth/me') return ok({ user: toAuthUser(viewer) })
  if (pathname === '/options/businesses') return ok({ items: businesses.map((b) => ({ id: b.id, name: b.name })) })
  if (pathname === '/options/org-units') return ok({ items: orgUnits.map((o) => ({ id: o.id, name: o.name })) })
  if (pathname === '/options/areas' || pathname === '/options/user-areas') return ok({ items: areas.map((a) => ({ id: a.id, name: a.name })) })

  if (pathname === '/home/assignee') return ok(assigneeHome(viewer, params))
  if (pathname === '/home/leader') return leaderHome(viewer, params)

  if (pathname === '/tasks') return ok(listTasks(viewer, params))
  if (parts[0] === 'tasks' && parts[1]) {
    const task = taskById.get(parts[1])
    if (!task || !canSeeTask(viewer, task)) return notFound()
    if (parts[2] === 'actions') {
      return ok(page(task.actions.map((a) => ({
        id: a.id,
        action: a.action,
        actor: { id: a.actor.id, name: a.actor.name, role: primaryRole(a.actor) },
        targetActionLogId: a.targetActionLogId,
        memo: a.memo,
        createdAt: a.createdAt,
      })), params))
    }
    if (parts[2] === 'memos') return ok(page([], params))
    return ok({ task: taskResponse(task, viewer) })
  }

  if (pathname === '/task-issues') return ok(page([], params))
  if (parts[0] === 'task-issues') return notFound()

  if (parts[0] === 'courses' && parts[1]) {
    const course = courseById.get(parts[1])
    if (!course || !canSeeCourse(viewer, course)) return notFound()
    const base = courseResponse(course)
    if (parts[2] === 'schedule-context') {
      return ok({
        course: { id: base.id, name: base.name, businessId: base.businessId, orgUnitId: base.orgUnitId, startDate: base.startDate, endDate: base.endDate, version: 1, isReadOnly: false },
        permissions: {
          canEditSchedule: admin || isAssignedCourse(viewer, course) || leaderOrgIds(viewer).includes(course.orgUnit.id),
          canCorrectEndDate: admin && progressOf(course) === 'ENDED',
        },
      })
    }
    if (parts[2] === 'assignment-context') {
      return ok({
        course: { id: base.id, businessId: base.businessId, orgUnitId: base.orgUnitId, version: 1, isReadOnly: false, assignees: base.assignees },
        permissions: { canReplaceAssignments: admin, canReplaceEndedAssignments: admin },
      })
    }
    if (parts[2] === 'schedule-changes') return ok(page([], params))
  }

  if (pathname === '/admin/courses') return adminGuard(() => ok(adminCourses(params)))
  if (parts[0] === 'admin' && parts[1] === 'courses' && parts[2]) {
    return adminGuard(() => {
      const course = courseById.get(parts[2])
      if (!course) return notFound()
      if (parts[3] === 'changes') return ok({ ...page([], params), lastModifiedBy: null, lastModifiedAt: null })
      return ok({ course: courseResponse(course) })
    })
  }
  if (pathname === '/admin/assignee-candidates') {
    return adminGuard(() => {
      const q = params.get('q')?.toLowerCase() ?? ''
      const items = users
        .filter((u) => u.status === 'ACTIVE' && u.roles.some((r) => r.role === 'ASSIGNEE'))
        .filter((u) => !params.get('orgUnitId') || u.orgUnit?.id === params.get('orgUnitId'))
        .filter((u) => !params.get('areaId') || u.areas.some((a) => a.id === params.get('areaId')))
        .filter((u) => !q || u.name.includes(q) || u.email.includes(q))
        .map((u) => ({ id: u.id, name: u.name, email: u.email, orgUnitId: u.orgUnit?.id ?? '', areaIds: u.areas.map((a) => a.id) }))
      return ok(page(items, params))
    })
  }
  if (pathname === '/admin/imports' || parts[1] === 'imports') return notFound()

  if (pathname === '/admin/templates') {
    return adminGuard(() => ok(page(templates.filter((t) => !params.get('businessId') || t.business.id === params.get('businessId')).map(templateResponse), params)))
  }
  if (parts[0] === 'admin' && parts[1] === 'templates' && parts[2]) {
    return adminGuard(() => {
      const template = templateById.get(parts[2])
      return template ? ok({ template: templateResponse(template) }) : notFound()
    })
  }
  if (pathname === '/admin/tags') {
    return adminGuard(() => ok(page(tags.filter((t) => !params.get('businessId') || t.businessId === params.get('businessId')).map((t) => ({ ...t, isActive: true, version: 1 })), params)))
  }

  if (pathname === '/holidays') {
    const from = params.get('from') ?? '0000'
    const to = params.get('to') ?? '9999'
    return ok(page(holidays.filter((h) => h.date >= from && h.date <= to), params))
  }

  if (pathname === '/documents') {
    const businessId = params.get('businessId')
    return ok(page(documents.filter((d) => !businessId || d.businessIds.length === 0 || d.businessIds.includes(businessId)).map(documentResponse), params))
  }
  if (pathname === '/admin/documents') return adminGuard(() => ok(page(documents.map(documentResponse), params)))
  if (pathname === '/admin/document-types') return adminGuard(() => ok({ items: documentTypes }))
  if ((parts[0] === 'documents' || parts[1] === 'documents') && pathname.endsWith('/versions')) {
    const doc = documents.find((d) => d.id === (parts[0] === 'documents' ? parts[1] : parts[2]))
    if (!doc) return notFound()
    const d = documentResponse(doc)
    return ok(page([{ contentRevision: 1, current: true, sourceType: d.sourceType, originalFilename: d.originalFilename, externalUrl: d.externalUrl, effectiveDate: d.effectiveDate, fileSizeBytes: d.fileSizeBytes, pageCount: d.pageCount, createdBy: d.createdBy, createdAt: d.updatedAt }], params))
  }
  if (parts[1] === 'documents' && parts[3] === 'deletion-context') {
    const doc = documents.find((d) => d.id === parts[2])
    return doc ? ok({ id: doc.id, title: doc.title, contentRevision: 1, referencingQaCount: qaRecords().filter((q) => q.doc?.id === doc.id).length }) : notFound()
  }

  if (pathname === '/admin/businesses') return adminGuard(() => ok({ items: listItems('businesses') }))
  if (pathname === '/admin/areas') return adminGuard(() => ok({ items: listItems('areas') }))
  if (pathname === '/admin/org-units') return adminGuard(() => ok({ items: listItems('orgUnits') }))
  if (pathname === '/admin/document-types/management') return adminGuard(() => ok({ items: listItems('documentTypes') }))

  if (pathname === '/admin/users') return userList(viewer, params, true)
  if (pathname === '/users') return userList(viewer, params, false)
  if (pathname === '/admin/api-clients') return adminGuard(() => ok({ items: [] }))

  if (pathname === '/admin/nlp/intents') {
    return adminGuard(() => ok(page(intentRecords().map((r) => ({
      id: r.id,
      intentKey: r.intentKey,
      name: r.name,
      businessScope: 'ALL',
      businesses: [],
      target: { type: r.targetType, qaId: r.qa?.id ?? null, qaKey: r.qa?.qaKey ?? null, documentId: r.doc?.id ?? null, documentTitle: r.doc?.title ?? null, path: r.path },
      active: true,
      exampleCount: r.examples.length,
    })), params)))
  }
  if (parts[1] === 'nlp' && parts[2] === 'intents' && parts[3]) {
    return adminGuard(() => {
      const r = intentRecords().find((x) => x.id === parts[3])
      if (!r) return notFound()
      return ok({ id: r.id, revision: 1, intentKey: r.intentKey, name: r.name, businessScope: 'ALL', businessIds: [], targetType: r.targetType, qaId: r.qa?.id ?? null, documentId: r.doc?.id ?? null, path: r.path, active: true, examples: r.examples })
    })
  }
  if (pathname === '/admin/nlp/qa') {
    return adminGuard(() => ok(page(qaRecords().map((q) => ({
      id: q.id,
      qaKey: q.qaKey,
      question: q.question,
      businessScope: q.businessIds.length ? 'SELECTED' : 'ALL',
      businesses: q.businessIds.map(businessRef),
      source: q.doc ? { documentId: q.doc.id, documentTitle: q.doc.title, page: q.page, deleted: false } : null,
      active: true,
    })), params)))
  }
  if (parts[1] === 'nlp' && parts[2] === 'qa' && parts[3]) {
    return adminGuard(() => {
      const q = qaRecords().find((x) => x.id === parts[3])
      if (!q) return notFound()
      return ok({ id: q.id, revision: 1, qaKey: q.qaKey, question: q.question, answer: q.answer, businessScope: q.businessIds.length ? 'SELECTED' : 'ALL', businessIds: q.businessIds, sourceDocumentId: q.doc?.id ?? null, sourcePage: q.page, active: true })
    })
  }
  if (pathname === '/admin/nlp/knowledge') return adminGuard(() => ok({ revision: 1, updatedAt: `${today}T09:00:00+09:00` }))
  if (pathname === '/admin/nlp/knowledge/sync') {
    return adminGuard(() => ok({ revision: 1, status: 'SYNCED', nlpRevision: 1, attempts: 1, error: null, checkedAt: `${today}T09:00:00+09:00`, nextAttemptAt: null }))
  }
  if (pathname === '/admin/questions') return adminGuard(() => ok(page([], params)))
  if (pathname === '/admin/questions/stats') {
    return adminGuard(() => ok({
      from: addDays(today, -Number(params.get('days') ?? 30)),
      to: today,
      counts: { questions: 0, answered: 0, clarify: 0, noAnswer: 0, piiWarning: 0, candidateSelected: 0, noneSelected: 0 },
      topIntents: [],
      topNoAnswer: [],
    }))
  }

  return fail(404, 'DEMO_NOT_SUPPORTED', '데모에서는 볼 수 없는 화면이에요.')
}

export function handleDocumentSearch(body: unknown): DemoResult {
  const { businessId, query, limit = 5, offset = 0 } = (body ?? {}) as { businessId?: string; query?: string; limit?: number; offset?: number }
  const visible = documents.filter((d) => d.file && (!businessId || d.businessIds.length === 0 || d.businessIds.includes(businessId)))
  const results = searchDocuments(visible, query ?? '')
  return ok({ results: results.slice(offset, offset + limit), hasMore: results.length > offset + limit, notIndexedDocumentIds: [] })
}
