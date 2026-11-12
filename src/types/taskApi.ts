import type { AssignedUser } from './courseApi'
import type { TaskActor } from './courseTasks'

export type CourseTaskSummary = {
  areaNames: Record<string, string>
  pendingByArea: Record<string, number>
}

export type TaskResponse = {
  id: string
  businessId: string
  courseId: string
  courseName: string
  areaId: string
  areaName: string
  assignees: AssignedUser[]
  isReadOnly: boolean
  supersededByTaskId: string | null
  title: string
  displayText: string | null
  phase: string | null
  referenceType: 'COURSE_START' | 'COURSE_END' | 'MONTH_END' | 'ALWAYS'
  requiresReview: boolean
  occurrenceNo: number
  periodStart: string | null
  periodEnd: string | null
  rawDueDate: string | null
  dueDate: string | null
  shiftReasons: ('WEEKEND' | 'HOLIDAY')[] | null
  status: 'TODO' | 'DONE' | 'REVIEWED'
  isMyArea: boolean
  completedBy: { id: string; name: string } | null
  completedAt: string | null
  reviewedBy: { id: string; name: string } | null
  reviewedAt: string | null
  completionActionLogId: string | null
  reviewActionLogId: string | null
  version: number
  tags: { id: string; name: string }[]
  documents: { id: string; title: string | null; available: boolean }[]
}

export type TaskActionResponse = {
  id: string
  action: 'COMPLETE' | 'REVIEW' | 'CANCEL_COMPLETION' | 'CANCEL_REVIEW'
  actor: TaskActor
  targetActionLogId: string | null
  memo: string | null
  createdAt: string
}

export type TaskMemoResponse = {
  id: string
  taskId: string
  content: string
  actor: TaskActor
  createdAt: string
}
