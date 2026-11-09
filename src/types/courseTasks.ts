import type { Course, HomeTask, Task } from './home'
import type { UserRole } from './user'

export type TaskActor = { id: string; name: string; role: UserRole }
export type TaskAssignee = { id: string; name: string; status: 'ACTIVE' | 'INACTIVE' }
export type TaskActionType = 'COMPLETE' | 'REVIEW' | 'CANCEL_COMPLETION' | 'CANCEL_REVIEW' | 'UPDATE_MEMO' | 'MEMO'

export type TaskAction = {
  id: string
  type: TaskActionType
  actor: TaskActor
  createdAt: string
  memo: string
  targetActionId?: string
  proxyFor?: string
}

export type CourseTask = Task & {
  phaseId: string
  tag: string
  areaId: string
  assignees: TaskAssignee[]
  requiresReview: boolean
  referenceType: 'COURSE_START' | 'COURSE_END' | 'MONTH_END' | 'ALWAYS'
  offsetDays: number
  occurrenceNo: number
  rawDueDate: string | null
  shiftReasons: string[]
  displayText: string
  actions: TaskAction[]
  documents: { id: string; title: string }[]
  mismatch?: { oldDueDate: string; newDueDate: string; reason: string; resolved: boolean }
}

export type CourseTaskView = CourseTask & HomeTask
export type TaskPhase = { id: string; name: string; defaultOpen: boolean }

export type CourseTasksCourse = Course & {
  orgUnit: { id: string; name: string; isClosed?: boolean }
  phases: TaskPhase[]
  assignees: { areaId: string; users: TaskAssignee[] }[]
  archived: boolean
  monthlyOffsetDays: number
  changeHistory: {
    id: string
    label: string
    before: string
    after: string
    reason?: string
    description?: string
    actor: string
    createdAt: string
  }[]
}

export type MonthlyCycle = {
  number: number
  startDate: string
  endDate: string
  rawDueDate: string
  dueDate: string
  shiftReasons: string[]
}
