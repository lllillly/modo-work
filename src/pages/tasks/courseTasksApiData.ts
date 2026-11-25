import { getDeadline } from '../home/assigneeHomeData'

import type { CourseResponse, OptionItem } from '../../types/courseApi'
import type {
  CourseTask,
  CourseTaskView,
  CourseTasksCourse,
  MonthlyCycle,
  TaskAction,
} from '../../types/courseTasks'
import type { TaskActionResponse, TaskMemoResponse, TaskResponse } from '../../types/taskApi'
import type { TaskIssueDetail, TaskIssueSnapshot } from '../../types/taskIssue'
import { formatDateWithDay } from '../../utils/date'

const shiftLabels = { WEEKEND: '주말', HOLIDAY: '공휴일' }
const issueReasons = { SCHEDULE_MISMATCH: '과정 일정 수정', TEMPLATE_MISMATCH: '템플릿 수정' }
const referenceLabels = { COURSE_START: '과정 시작일', COURSE_END: '과정 종료일', MONTH_END: '주기 종료일', ALWAYS: '상시' }

const formatDueDate = (value: string | null) => (value ? formatDateWithDay(value) : '없음')
const formatTags = (snapshot: TaskIssueSnapshot) => Object.values(snapshot.tags).sort().join(', ') || '없음'

function getIssueChanges(before: TaskIssueSnapshot, after: TaskIssueSnapshot | undefined) {
  const changes: NonNullable<CourseTask['mismatch']>['changes'] = []

  if (!after) {
    changes.push({ label: '할 일', before: before.title, after: '새 기준에 없음' })
  } else {
    if (before.referenceType !== after.referenceType) {
      changes.push({
        label: '기준',
        before: referenceLabels[before.referenceType],
        after: referenceLabels[after.referenceType],
      })
    }
    if (before.dueDate !== after.dueDate) {
      changes.push({ label: '마감', before: formatDueDate(before.dueDate), after: formatDueDate(after.dueDate) })
    }
    if (before.title !== after.title) changes.push({ label: '제목', before: before.title, after: after.title })
    if (before.phase !== after.phase) {
      changes.push({ label: '단계', before: before.phase ?? '없음', after: after.phase ?? '없음' })
    }
    if (before.requiresReview !== after.requiresReview) {
      const reviewText = (value: boolean) => (value ? '필요' : '필요 없음')
      changes.push({
        label: '리더 확인',
        before: reviewText(before.requiresReview),
        after: reviewText(after.requiresReview),
      })
    }
    if (before.documentIds.join() !== after.documentIds.join()) {
      changes.push({ label: '연결 문서', before: `${before.documentIds.length}개`, after: `${after.documentIds.length}개` })
    }
    if (formatTags(before) !== formatTags(after)) {
      changes.push({ label: '태그', before: formatTags(before), after: formatTags(after) })
    }
  }

  return changes
}

export function toTaskMismatch(issues: TaskIssueDetail[]): CourseTask['mismatch'] {
  const ordered = [...issues].sort((a, b) => a.issue.createdAt.localeCompare(b.issue.createdAt))
  const reasons = [...new Set(ordered.map(({ issue }) => issueReasons[issue.issueType]))]
  const { before } = ordered[0].details
  const latest = ordered[ordered.length - 1].details.expected[0]
  return {
    issueIds: ordered.map(({ issue }) => issue.id),
    reason: reasons.join('과 '),
    changes: getIssueChanges(before, latest),
  }
}

export function toTaskCourse(
  course: CourseResponse,
  businessName: string,
  orgUnits: OptionItem[],
  tasks: TaskResponse[],
): CourseTasksCourse {
  const phaseNames = [
    ...new Set(
      tasks.filter((task) => task.referenceType !== 'ALWAYS').map((task) => task.phase ?? '단계 없음'),
    ),
  ]

  return {
    ...course,
    businessName,
    orgUnit: {
      id: course.orgUnitId,
      name: orgUnits.find((org) => org.id === course.orgUnitId)?.name ?? '-',
    },
    phases: phaseNames.map((name) => ({ id: name, name, defaultOpen: true })),
    assignees: course.assignees.map((area) => ({ areaId: area.areaId, users: area.users })),
    archived: false,
    monthlyOffsetDays: 0,
    changeHistory: [],
  }
}

export function toCourseTask(task: TaskResponse, actions: TaskAction[] = []): CourseTask {
  return {
    id: task.id,
    courseId: task.courseId,
    title: task.title,
    areaId: task.areaId,
    areaName: task.areaName,
    assignees: task.assignees,
    isMyArea: task.isMyArea,
    isCompleted: task.status !== 'TODO',
    completedBy: task.completedBy?.name,
    reviewStatus:
      task.status === 'REVIEWED'
        ? 'confirmed'
        : task.status === 'DONE' && task.requiresReview
          ? 'pending'
          : undefined,
    phaseId: task.phase ?? '단계 없음',
    tag: task.tags.map((tag) => tag.name).join(' · '),
    requiresReview: task.requiresReview,
    referenceType: task.referenceType,
    occurrenceNo: task.occurrenceNo,
    rawDueDate: task.rawDueDate,
    dueDate: task.dueDate,
    shiftReasons: (task.shiftReasons ?? []).map((reason) => shiftLabels[reason]),
    displayText: task.displayText ?? '',
    offsetDays: null,
    actions,
    documents: task.documents.flatMap((doc) =>
      doc.available && doc.title !== null ? [{ id: doc.id, title: doc.title }] : [],
    ),
    server: {
      version: task.version,
      isReadOnly: task.isReadOnly,
      canReview: task.canReview,
      canReviewInArea: task.canReviewInArea,
      completionActionLogId: task.completionActionLogId,
      reviewActionLogId: task.reviewActionLogId,
    },
  }
}

export function toTaskActions(actions: TaskActionResponse[]): TaskAction[] {
  return [...actions].reverse().map((action) => ({
    id: action.id,
    type: action.action,
    actor: action.actor,
    createdAt: action.createdAt,
    memo: action.memo ?? '',
    targetActionId: action.targetActionLogId ?? undefined,
  }))
}

export function toMemoActions(memos: TaskMemoResponse[]): TaskAction[] {
  return [...memos].reverse().map((memo) => ({
    id: memo.id,
    type: 'MEMO',
    actor: memo.actor,
    createdAt: memo.createdAt,
    memo: memo.content,
  }))
}

export function getStoredMonthlyCycles(tasks: TaskResponse[]): MonthlyCycle[] {
  const cycles = new Map<string, MonthlyCycle>()
  for (const task of tasks) {
    if (
      task.referenceType !== 'MONTH_END' ||
      !task.periodStart ||
      !task.periodEnd ||
      !task.rawDueDate ||
      !task.dueDate
    )
      continue

    const id = `${task.periodStart}:${task.periodEnd}:${task.rawDueDate}:${task.dueDate}:${task.title}`
    if (cycles.has(id)) continue
    cycles.set(id, {
      id,
      taskId: task.id,
      number: task.occurrenceNo,
      title: task.title,
      startDate: task.periodStart,
      endDate: task.periodEnd,
      rawDueDate: task.rawDueDate,
      dueDate: task.dueDate,
      shiftReasons: (task.shiftReasons ?? []).map((reason) => shiftLabels[reason]),
    })
  }
  return [...cycles.values()].sort(
    (a, b) => a.startDate.localeCompare(b.startDate) || a.dueDate.localeCompare(b.dueDate),
  )
}

export function toApiTaskView(task: CourseTask, courseName: string, today: string): CourseTaskView {
  const { deadlineLabel } = getDeadline(task.dueDate, today)
  // 현재 할 일 응답에는 서버의 영업일 임박 분류가 없어 목업의 D-2 기준은 사용하지 않음
  const deadlineStatus = task.dueDate === null ? 'none' : task.dueDate < today ? 'overdue' : 'scheduled'
  return { ...task, courseName, deadlineLabel, deadlineStatus }
}
