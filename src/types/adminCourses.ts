import type { AssignedUser, CourseResponse, Recalculation } from './courseApi'

export type ManagedCourse = Omit<CourseResponse, 'assignees'> & {
  assignees: Record<string, string[]>
  assignedUsers: Record<string, AssignedUser[]>
  areaNames: Record<string, string>
}

export type CourseDraft = Pick<
  ManagedCourse,
  'externalKey' | 'name' | 'orgUnitId' | 'startDate' | 'endDate' | 'capacity' | 'assignees'
>

export type CourseSaveResult = {
  courseId: string
  completed: string[]
  generatedTaskCount?: number
  recalculation?: Recalculation
  assignmentChangedTaskCount?: number
}
