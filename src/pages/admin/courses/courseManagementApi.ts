import { createCourse, replaceAssignees, updateCourse, updateSchedule } from '../../../api/courses'
import { ApiError, getApiErrorMessage } from '../../../api/client'
import type { CourseDraft, CourseSaveResult, ManagedCourse } from '../../../types/adminCourses'
import { hasAssignmentChanges } from './courseManagementData'

export class CourseSaveError extends Error {
  cause: unknown
  completed: string[]

  constructor(cause: unknown, completed: string[]) {
    super(getApiErrorMessage(cause))
    this.name = 'CourseSaveError'
    this.cause = cause
    this.completed = completed
  }
}

export async function saveManagedCourse(businessId: string, draft: CourseDraft, previous?: ManagedCourse) {
  const completed: string[] = []

  try {
    if (!previous) {
      const response = await createCourse(businessId, draft)
      return {
        courseId: response.course.id,
        completed: ['과정 등록'],
        generatedTaskCount: response.generatedTaskCount,
      }
    }

    let version = previous.version
    const result: CourseSaveResult = { courseId: previous.id, completed }

    // 일정 변경으로 종료 상태가 될 수 있으므로 정보와 배정을 먼저 저장한다.
    if (draft.name !== previous.name || draft.capacity !== previous.capacity) {
      const response = await updateCourse(previous.id, version, draft.name, draft.capacity)
      version = response.course.version
      completed.push('이름·정원')
    }

    if (hasAssignmentChanges(previous.assignees, draft.assignees)) {
      const response = await replaceAssignees(previous.id, version, draft.assignees)
      version = response.course.version
      result.assignmentChangedTaskCount = response.assignmentChange.assignmentChangedTaskCount
      completed.push('담당 배정')
    }

    if (draft.startDate !== previous.startDate || draft.endDate !== previous.endDate) {
      const response = await updateSchedule(previous.id, version, draft.startDate, draft.endDate)
      result.recalculation = response.recalculation
      completed.push('일정')
    }

    return result
  } catch (error) {
    throw new CourseSaveError(error, completed)
  }
}

export function requiresSaveReload(error: CourseSaveError) {
  return (
    error.completed.length > 0 ||
    !(error.cause instanceof ApiError) ||
    error.cause.status >= 500 ||
    error.cause.status === 409
  )
}
