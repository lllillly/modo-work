import dayjs from 'dayjs'

import type { CourseDraft, ManagedCourse } from '../../../types/adminCourses'
import type { CourseResponse, OptionItem } from '../../../types/courseApi'
import type { AuthUser } from '../../../types/auth'
import { getToday } from '../../home/dateUtils'

export function getOrgUnitName(id: string, options: OptionItem[], user: AuthUser | null) {
  const knownOrgUnits = [user?.orgUnit, ...(user?.roles.map((role) => role.orgUnit) ?? [])]
  return (
    options.find((org) => org.id === id)?.name ??
    knownOrgUnits.find((org) => org?.id === id)?.name
  )
}

export function getCoursePeriod(startDate: string, endDate: string) {
  const days = dayjs(endDate).diff(dayjs(startDate), 'day') + 1
  return { days, label: days >= 180 ? '장기' : '단기' }
}

export function getCourseState(course: Pick<ManagedCourse, 'startDate' | 'endDate'>, today = getToday()) {
  if (course.endDate < today) return '종료'
  if (course.startDate > today) return '예정'
  return '진행 중'
}

export function toManagedCourse(course: CourseResponse): ManagedCourse {
  return {
    ...course,
    assignees: Object.fromEntries(course.assignees.map((area) => [area.areaId, area.userIds])),
    assignedUsers: Object.fromEntries(course.assignees.map((area) => [area.areaId, area.users])),
  }
}

export function hasAssignmentChanges(before: CourseDraft['assignees'], after: CourseDraft['assignees']) {
  const areaIds = new Set([...Object.keys(before), ...Object.keys(after)])
  return [...areaIds].some((areaId) => {
    const previous = [...(before[areaId] ?? [])].sort()
    const next = [...(after[areaId] ?? [])].sort()
    return previous.length !== next.length || previous.some((id, index) => id !== next[index])
  })
}

export function getInactiveAssignees(course: ManagedCourse) {
  return Object.values(course.assignedUsers)
    .flat()
    .filter((user) => user.status === 'INACTIVE')
}
