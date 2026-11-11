import dayjs from 'dayjs'

import type { CourseDraft, ManagedCourse } from '../../../types/adminCourses'
import { getToday } from '../../home/dateUtils'
import { courseAreas, courseAssignees, courseOrgUnits } from './courseManagementMockData'

export function getCoursePeriod(startDate: string, endDate: string) {
  const days = dayjs(endDate).diff(dayjs(startDate), 'day') + 1
  return { days, label: days >= 180 ? '장기' : '단기' }
}

export function getCourseState(course: Pick<ManagedCourse, 'startDate' | 'endDate'>, today = getToday()) {
  if (course.endDate < today) return '종료'
  if (course.startDate > today) return '예정'
  return '진행 중'
}

export function getAssignmentIssues(assignees: CourseDraft['assignees']) {
  const empty = courseAreas.filter((area) => !assignees[area.id]?.length).length
  const inactive = courseAreas.reduce(
    (count, area) =>
      count +
      (assignees[area.id] ?? []).filter((id) => courseAssignees.find((user) => user.id === id)?.status === 'INACTIVE')
        .length,
    0,
  )
  return { empty, inactive }
}

export function formatCourseHistoryValue(course: CourseDraft, key: keyof CourseDraft) {
  if (key === 'orgUnitId') return courseOrgUnits.find((org) => org.id === course.orgUnitId)?.name ?? '-'
  if (key === 'assignees') {
    return courseAreas
      .map((area) => {
        const names = courseAssignees
          .filter((user) => course.assignees[area.id]?.includes(user.id))
          .map((user) => user.name)
        return `${area.name}: ${names.join(', ') || '미배정'}`
      })
      .join(' · ')
  }
  return String(course[key] ?? '-')
}
