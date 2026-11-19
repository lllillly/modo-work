import type { Course, HomeTask, Task } from './home'
import type { UserRole } from './user'

export type TaskActor = { id: string; name: string; role: UserRole }
export type TaskAssignee = { id: string; name: string; status: 'ACTIVE' | 'INACTIVE' | 'PENDING' }
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
  server?: {
    version: number
    isReadOnly: boolean
    canReview: boolean
    canReviewInArea: boolean
    completionActionLogId: string | null
    reviewActionLogId: string | null
  }
  phaseId: string
  tag: string
  areaId: string
  assignees: TaskAssignee[]
  requiresReview: boolean
  referenceType: 'COURSE_START' | 'COURSE_END' | 'MONTH_END' | 'ALWAYS'
  offsetDays: number | null
  occurrenceNo: number
  rawDueDate: string | null
  shiftReasons: string[]
  displayText: string
  actions: TaskAction[]
  documents: { id: string; title: string }[]
  mismatch?: {
    issueIds?: string[]
    reason: string
    changes: { label: string; before: string; after: string }[]
  }
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
  id?: string
  taskId?: string
  title?: string
  number: number
  startDate: string
  endDate: string
  rawDueDate: string
  dueDate: string
  shiftReasons: string[]
}
