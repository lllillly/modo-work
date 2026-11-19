import type { Course, HomeTask, Task } from './home'

export type LeaderArea = { id: string; name: string }

export type LeaderCourse = Course & {
  orgUnit: { id: string; name: string; isClosed?: boolean }
  areas: {
    area: LeaderArea
    assigneeNames: string[]
    completedCount: number
    totalCount: number
  }[]
}

export type LeaderTask = Task & {
  areaId: string
  assigneeNames: string[]
  requiresReview: boolean
  completedAt?: string
  reviewedBy?: string
  reviewedAt?: string
  completionMemo?: string
}

export type LeaderHomeTask = LeaderTask & HomeTask & {
  orgUnit: LeaderCourse['orgUnit']
  isReadOnly: boolean
  canReview: boolean
}

export type LeaderHomeCourse = Omit<LeaderCourse, 'areas' | 'businessName'> & {
  areas: (LeaderCourse['areas'][number] & { canView: boolean; canReview: boolean })[]
  assigneeNames: string[]
  overdueCount: number
  nextTask: LeaderHomeTask | null
}
