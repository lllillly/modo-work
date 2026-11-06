import type { AuthUser } from '../../types/auth'
import type { LeaderArea, LeaderCourse, LeaderTask } from '../../types/leaderHome'
import { formatDate, parseDate } from './dateUtils'

export function createLeaderHomeMockData(user: AuthUser, today: string) {
  const orgUnit = user.roles.find((role) => role.role === 'LEADER' && role.leaderType === 'ORG_UNIT')?.orgUnit
    ?? user.orgUnit
    ?? { id: 'mock-org-1', name: '조직 단위 1' }
  const otherOrgUnit = { id: 'mock-org-2', name: '조직 단위 2' }
  const leaderAreas = user.roles.flatMap((role) => role.role === 'LEADER' && role.leaderType === 'AREA' && role.area ? [role.area] : [])
  const areas: LeaderArea[] = ['영역 1', '영역 2'].map((name, index) => (
    leaderAreas.find((area) => area.name === name)
      ?? user.areas.find((area) => area.name === name) ?? { id: `mock-area-${index + 1}`, name }
  ))

  function dateOffset(days: number) {
    const date = parseDate(today)
    date.setDate(date.getDate() + days)
    return formatDate(date)
  }

  const samples = [
    { id: 'course-1', name: '예시 과정 A 3회차', orgUnit, assignees: [['담당자 A', '담당자 B'], ['담당자 B']], completed: [8, 11] },
    { id: 'course-2', name: '예시 과정 B 1회차', orgUnit, assignees: [['담당자 C', '담당자 D'], ['담당자 C']], completed: [4, 2] },
    { id: 'course-3', name: '예시 과정 C 2회차', orgUnit, assignees: [['담당자 A', '담당자 D'], ['담당자 D']], completed: [15, 12] },
    { id: 'course-4', name: '예시 과정 D 1회차', orgUnit, assignees: [['담당자 B', '담당자 C'], ['담당자 C']], completed: [1, 0] },
    { id: 'course-5', name: '예시 과정 E 1회차', orgUnit: otherOrgUnit, assignees: [['담당자 F'], ['담당자 E']], completed: [6, 6] },
  ]
  const courses: LeaderCourse[] = samples.map((course) => ({
    id: course.id, name: course.name, orgUnit: course.orgUnit, businessName: '사업 1',
    startDate: dateOffset(-30), endDate: dateOffset(90),
    areas: areas.map((area, index) => ({
      area, assigneeNames: course.assignees[index], completedCount: course.completed[index], totalCount: 20,
    })),
  }))

  function task(id: string, courseIndex: number, areaIndex: number, days: number, extra: Partial<LeaderTask> = {}): LeaderTask {
    const course = courses[courseIndex]
    const assignment = course.areas[areaIndex]
    return {
      id, title: `할 일 ${id}`, courseId: course.id,
      areaId: assignment.area.id, areaName: assignment.area.name,
      assigneeNames: assignment.assigneeNames, isMyArea: false,
      dueDate: dateOffset(days), isCompleted: false, requiresReview: true,
      ...extra,
    }
  }

  const tasks: LeaderTask[] = [
    task('A', 0, 0, -14), task('M', 1, 1, -3), task('P', 4, 1, -2),
    task('H', 0, 0, 0), task('C', 0, 0, 1), task('D', 1, 1, 1),
    task('G', 2, 0, 2), task('I', 2, 1, 2), task('J', 3, 0, 2), task('L', 3, 1, 2),
    task('K', 2, 1, 6), task('U', 3, 0, 14), task('V', 4, 1, 5),
    task('E', 0, 0, -3, { isCompleted: true, completedBy: '담당자 A', completedAt: `${dateOffset(-3)}T12:12:00+09:00`, reviewStatus: 'pending', completionMemo: '처리 완료' }),
    task('Q', 4, 1, -3, { isCompleted: true, completedBy: '담당자 E', completedAt: `${dateOffset(-3)}T11:20:00+09:00`, reviewStatus: 'pending' }),
    task('N', 1, 1, -3, { isCompleted: true, completedBy: '담당자 C', completedAt: `${dateOffset(-3)}T09:48:00+09:00`, reviewStatus: 'pending', completionMemo: '서류 제출함' }),
    task('O', 2, 0, -6, { isCompleted: true, completedBy: '담당자 D', completedAt: `${dateOffset(-6)}T17:05:00+09:00`, reviewStatus: 'pending' }),
    task('F', 0, 1, -6, { isCompleted: true, completedBy: '담당자 A', completedAt: `${dateOffset(-6)}T10:00:00+09:00`, reviewStatus: 'confirmed', reviewedBy: '리더 B', reviewedAt: `${dateOffset(-6)}T10:30:00+09:00` }),
    task('R', 1, 0, -7, { isCompleted: true, completedBy: '담당자 D', completedAt: `${dateOffset(-7)}T15:00:00+09:00`, reviewStatus: 'pending' }),
    task('S', 3, 1, -8, { isCompleted: true, completedBy: '담당자 C', completedAt: `${dateOffset(-8)}T13:00:00+09:00`, reviewStatus: 'pending' }),
  ]

  const closedOrgCourses = courses.map((course) => course.orgUnit.id === otherOrgUnit.id
    ? { ...course, orgUnit: { ...course.orgUnit, isClosed: true } }
    : course)

  return { areas, courses, tasks, closedOrgCourses }
}
