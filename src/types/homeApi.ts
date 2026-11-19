import type { CourseResponse, PageResponse } from './courseApi'
import type { TaskResponse } from './taskApi'

export type CalendarDay = {
  date: string
  incompleteCount: number
  overdueCount: number
}

export type AssigneeHomeResponse = {
  today: string
  dueSoonBusinessDays: number
  summary: { todayCount: number; overdueCount: number; dueSoonCount: number }
  alerts: PageResponse<TaskResponse>
  calendar: CalendarDay[]
  dayTasks: { mineCount: number; otherCount: number }
  courses: PageResponse<{
    course: CourseResponse
    completedCount: number
    totalCount: number
    nextTask: TaskResponse | null
  }>
}

export type LeaderHomeCourseItem = {
  course: CourseResponse
  orgUnitClosed: boolean
  areas: { areaId: string; areaName: string; canReview: boolean; completedCount: number; totalCount: number }[]
  overdueCount: number
  nextTask: TaskResponse | null
}

export type CompletionRecord = {
  task: TaskResponse
  orgUnitId: string
  orgUnitName: string
  orgUnitClosed: boolean
  canReview: boolean
  completionMemo: string | null
}

export type LeaderHomeResponse = {
  today: string
  dueSoonBusinessDays: number
  summary: {
    overdueCount: number
    dueSoonCount: number
    pendingReviewCount: number
    overdueByArea: { areaId: string; areaName: string; count: number }[]
  }
  alerts: PageResponse<TaskResponse>
  pendingReviews: PageResponse<TaskResponse>
  activeCourseCount: number
  courses: PageResponse<LeaderHomeCourseItem>
  records: PageResponse<CompletionRecord>
}
