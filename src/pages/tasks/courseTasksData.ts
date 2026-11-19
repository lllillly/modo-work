import type { AuthUser } from '../../types/auth'
import type { CourseTask, CourseTasksCourse, MonthlyCycle, TaskAction, TaskActionType } from '../../types/courseTasks'

import { getDeadline } from '../home/assigneeHomeData'
import { formatDate, getDaysUntil, parseDate } from '../home/dateUtils'
import { getLeaderReviewScope } from '../home/leaderHomeData'

export function addDays(value: string, days: number) {
  const date = parseDate(value)
  date.setDate(date.getDate() + days)

  return formatDate(date)
}

export function formatTaskDate(value: string, full = false) {
  const day = value.includes('T')
    ? new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Seoul',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(new Date(value))
    : value

  const date = parseDate(day)
  const weekday = new Intl.DateTimeFormat('ko-KR', { weekday: 'short' }).format(date)

  if (full) {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const dayOfMonth = String(date.getDate()).padStart(2, '0')

    return `${year}.${month}.${dayOfMonth} (${weekday})`
  }

  return `${date.getMonth() + 1}/${date.getDate()}(${weekday})`
}

export function formatActionTime(value: string, fullDate = false) {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    year: fullDate ? 'numeric' : undefined,
    month: fullDate ? '2-digit' : 'numeric',
    day: fullDate ? '2-digit' : 'numeric',
    weekday: fullDate ? undefined : 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(value))

  const { year, month, day, weekday, hour, minute } = Object.fromEntries(
    parts.map((part) => [part.type, part.value]),
  )

  if (fullDate) return `${year}.${month}.${day} ${hour}:${minute}`
  return `${month}/${day} (${weekday}) ${hour}:${minute}`
}

function adjustDeadline(rawDueDate: string) {
  const date = parseDate(rawDueDate)
  const shiftReasons: string[] = []

  while (date.getDay() === 0 || date.getDay() === 6) {
    shiftReasons.push(date.getDay() === 0 ? '일요일' : '토요일')
    date.setDate(date.getDate() - 1)
  }

  return { rawDueDate, dueDate: formatDate(date), shiftReasons }
}

export function getMonthlyCycles(startDate: string, endDate: string, offsetDays: number): MonthlyCycle[] {
  if (startDate > endDate) return []

  const cycles: MonthlyCycle[] = []
  let start = startDate

  while (start <= endDate) {
    const date = parseDate(start)
    const nextMonthLastDay = new Date(date.getFullYear(), date.getMonth() + 2, 0)
    let end = endDate

    if (start.slice(0, 7) !== endDate.slice(0, 7)) {
      const candidate = date.getDate() > nextMonthLastDay.getDate()
        ? formatDate(nextMonthLastDay)
        : formatDate(new Date(date.getFullYear(), date.getMonth() + 1, date.getDate() - 1))
      end = candidate < endDate ? candidate : endDate
    }

    cycles.push({ number: cycles.length + 1, startDate: start, endDate: end, ...adjustDeadline(addDays(end, offsetDays)) })
    start = addDays(end, 1)
  }

  return cycles
}

export function recalculateCourseTasks(course: CourseTasksCourse, tasks: CourseTask[], preserveCompleted = true) {
  const cycles = getMonthlyCycles(course.startDate, course.endDate, course.monthlyOffsetDays)

  return tasks.map((task) => {
    if (
      task.server || task.offsetDays === null ||
      task.courseId !== course.id || task.referenceType === 'ALWAYS'
    ) return task

    const reference = task.referenceType === 'COURSE_START' ? course.startDate
      : task.referenceType === 'COURSE_END' ? course.endDate
      : cycles[task.occurrenceNo - 1]?.endDate
    if (!reference) return task

    // API 연동 후에는 공휴일을 포함한 서버의 보정 결과를 사용 예정입니다
    const deadline = adjustDeadline(addDays(reference, task.offsetDays))

    if (preserveCompleted && task.isCompleted) {
      if (deadline.dueDate === task.dueDate) {
        return task.mismatch ? { ...task, mismatch: undefined } : task
      }

      return {
        ...task,
        mismatch: {
          reason: '과정 일정 수정',
          changes: [{
            label: '마감',
            before: formatTaskDate(task.dueDate ?? deadline.dueDate),
            after: formatTaskDate(deadline.dueDate),
          }],
        },
      }
    }

    return { ...task, ...deadline }
  })
}

export function getCurrentAction(task: CourseTask, type: 'COMPLETE' | 'REVIEW') {
  const cancelledIds = new Set(task.actions
    .filter((action) => action.type === 'CANCEL_COMPLETION' || action.type === 'CANCEL_REVIEW')
    .map((action) => action.targetActionId))

  for (let index = task.actions.length - 1; index >= 0; index--) {
    const action = task.actions[index]
    if (action.type === type && !cancelledIds.has(action.id)) return action
  }
}

export function getCompletionMemo(task: CourseTask) {
  const completion = getCurrentAction(task, 'COMPLETE')
  if (!completion) return ''

  for (let index = task.actions.length - 1; index >= 0; index--) {
    const action = task.actions[index]
    if (action.type === 'UPDATE_MEMO' && action.targetActionId === completion.id) return action.memo
  }

  return completion.memo
}

function canViewTaskArea(user: AuthUser, course: CourseTasksCourse, areaId: string) {
  const isAdmin = user.roles.some((role) => role.role === 'ADMIN')
  if (course.archived && !isAdmin) return false

  const isLeader = user.roles.some((role) => role.role === 'LEADER')
  const scope = getLeaderReviewScope(user)

  const assignedToCourse = course.assignees.some((assignment) =>
    assignment.users.some((assignee) => assignee.id === user.id),
  )
  const isAssignee = user.roles.some((role) =>
    role.role === 'ASSIGNEE' && role.orgUnit?.id === course.orgUnit.id,
  )
  const isViewer = user.roles.some((role) =>
    role.role === 'VIEWER'
    && (role.scopeType === 'ALL' || role.orgUnit?.id === course.orgUnit.id)
    && (role.viewerTargetRole !== 'ASSIGNEE' || user.areas.some((area) => area.id === areaId)),
  )

  const hasViewRole = isLeader || isAssignee || isViewer
  const isInViewScope = course.orgUnit.isClosed
    ? isLeader
    : scope.canView(course.orgUnit, areaId) || (isAssignee && assignedToCourse) || isViewer

  return user.status === 'ACTIVE' && (isAdmin || (hasViewRole && isInViewScope))
}

export function canViewCourse(user: AuthUser, course: CourseTasksCourse) {
  return canViewTaskArea(user, course, '') || course.assignees.some((assignment) => canViewTaskArea(user, course, assignment.areaId))
}

export function getTaskPermissions(user: AuthUser, course: CourseTasksCourse, task: CourseTask) {
  const isAdmin = user.roles.some((role) => role.role === 'ADMIN')
  const isLeader = user.roles.some((role) => role.role === 'LEADER')
  const isAssignee = user.roles.some((role) =>
    role.role === 'ASSIGNEE' && role.orgUnit?.id === course.orgUnit.id,
  )
  const scope = getLeaderReviewScope(user)
  const isMyArea = task.assignees.some((assignee) => assignee.id === user.id)

  const canView = !!task.server || canViewTaskArea(user, course, task.areaId)
  const canManage = task.server
    ? task.server.canReviewInArea
    : canView && (isAdmin || (isLeader && scope.canReview(course.orgUnit, task.areaId)))

  const completion = getCurrentAction(task, 'COMPLETE')
  if (task.server) {
    const writable = !task.server.isReadOnly && user.status === 'ACTIVE'
    const canProcess = writable && (canManage || (isAssignee && task.isMyArea))
    const cancellableCompletion = isAdmin || (canManage && completion?.actor.role === 'ASSIGNEE')
    const canCancelCompletion =
      writable && canManage && task.isCompleted && cancellableCompletion &&
      !!task.server.completionActionLogId && (!task.server.reviewActionLogId || isAdmin)

    return {
      canView,
      canManage,
      isMyArea: task.isMyArea,
      showCheckbox: canProcess && task.referenceType !== 'ALWAYS',
      canComplete: canProcess && !task.isCompleted && task.referenceType !== 'ALWAYS',
      canReview: writable && task.server.canReview && task.requiresReview && task.reviewStatus === 'pending',
      canCancelCompletion,
      canCancelReview: writable && isAdmin && !!task.server.reviewActionLogId,
      canEditMemo: false,
      canAddMemo: canProcess && task.referenceType === 'ALWAYS',
    }
  }

  const review = getCurrentAction(task, 'REVIEW')
  const canWork = canView && (canManage || (isAssignee && isMyArea)) && !course.archived
  const canCancel = (action?: TaskAction) =>
    action && (isAdmin || (canManage && action.actor.role === 'ASSIGNEE'))
  const canCancelCompletion = canManage
    && !course.archived
    && task.isCompleted
    && Boolean(canCancel(completion))
    && (!review || Boolean(canCancel(review)))

  return {
    canView,
    canManage,
    isMyArea,
    showCheckbox: canView && ((isAssignee && isMyArea) || canManage),
    canComplete: canWork && !task.isCompleted && task.referenceType !== 'ALWAYS',
    canReview: canManage && !course.archived && task.isCompleted && task.requiresReview && task.reviewStatus === 'pending',
    canCancelCompletion,
    canCancelReview: isAdmin && !course.archived && task.reviewStatus === 'confirmed',
    canEditMemo: canView && !course.archived && task.isCompleted && completion?.actor.id === user.id,
    canAddMemo: canWork && task.referenceType === 'ALWAYS',
  }
}

export function getCourseTaskView(task: CourseTask, course: CourseTasksCourse, user: AuthUser, today: string) {
  return { ...task, courseName: course.name, isMyArea: getTaskPermissions(user, course, task).isMyArea, ...getDeadline(task.dueDate, today) }
}

export function getCourseDays(course: CourseTasksCourse) {
  return getDaysUntil(course.endDate, course.startDate) + 1
}

export function applyTaskAction(task: CourseTask, course: CourseTasksCourse, user: AuthUser, type: TaskActionType, memo: string): CourseTask {
  const permissions = getTaskPermissions(user, course, task)

  const allowed: Record<TaskActionType, boolean> = {
    COMPLETE: permissions.canComplete,
    REVIEW: permissions.canReview,
    CANCEL_COMPLETION: permissions.canCancelCompletion,
    CANCEL_REVIEW: permissions.canCancelReview,
    UPDATE_MEMO: permissions.canEditMemo,
    MEMO: permissions.canAddMemo,
  }

  if (!allowed[type] || memo.length > 500) return task
  if (type === 'MEMO' && !memo.trim()) return task

  const isAdmin = user.roles.some((role) => role.role === 'ADMIN')
  let actorRole: TaskAction['actor']['role'] = 'ASSIGNEE'
  if (isAdmin) {
    actorRole = 'ADMIN'
  } else if (permissions.canManage) {
    actorRole = 'LEADER'
  }

  const actor: TaskAction['actor'] = {
    id: user.id,
    name: user.name,
    role: actorRole,
  }

  const completion = getCurrentAction(task, 'COMPLETE')
  const review = getCurrentAction(task, 'REVIEW')

  const action: TaskAction = {
    id: crypto.randomUUID(),
    type,
    actor,
    createdAt: new Date().toISOString(),
    memo: memo.trim(),
  }
  let next = { ...task, actions: [...task.actions, action] }

  if (type === 'COMPLETE') {
    next = {
      ...next,
      isCompleted: true,
      completedBy: actor.name,
      reviewStatus: task.requiresReview ? 'pending' : undefined,
    }
    if (permissions.canManage) {
      action.proxyFor = task.assignees.map((assignee) => assignee.name).join(', ')
    }
  }

  if (type === 'REVIEW') {
    next.reviewStatus = 'confirmed'
  }

  if (type === 'UPDATE_MEMO' || type === 'CANCEL_COMPLETION') {
    action.targetActionId = completion?.id
  }

  if (type === 'CANCEL_REVIEW') {
    action.targetActionId = review?.id
    next.reviewStatus = 'pending'
  }

  if (type === 'CANCEL_COMPLETION') {
    next = {
      ...next,
      isCompleted: false,
      completedBy: undefined,
      reviewStatus: undefined,
      mismatch: undefined,
    }

    if (review) {
      next.actions.push({
        ...action,
        id: crypto.randomUUID(),
        type: 'CANCEL_REVIEW',
        targetActionId: review.id,
      })
    }

    next = recalculateCourseTasks(course, [next])[0]
  }

  return next
}
