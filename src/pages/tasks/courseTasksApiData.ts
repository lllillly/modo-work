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

const shiftLabels = { WEEKEND: '주말', HOLIDAY: '공휴일' }

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

    const id = `${task.periodStart}:${task.periodEnd}:${task.rawDueDate}:${task.dueDate}`
    if (cycles.has(id)) continue
    cycles.set(id, {
      id,
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
