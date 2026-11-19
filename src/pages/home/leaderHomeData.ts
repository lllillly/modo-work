import type { AuthUser } from '../../types/auth'
import type { LeaderHomeResponse } from '../../types/homeApi'
import type { LeaderArea, LeaderCourse, LeaderHomeCourse, LeaderHomeTask } from '../../types/leaderHome'
import type { TaskResponse } from '../../types/taskApi'
import { getDeadline, getReviewStatus } from './assigneeHomeData'

export function getLeaderReviewScope(user: AuthUser) {
  const leaderRoles = user.roles.filter((role) => role.role === 'LEADER')
  const hasAllAccess = user.roles.some((role) => role.role === 'ADMIN')
  const hasAreaRole = leaderRoles.some((role) => role.leaderType === 'AREA')
  const orgUnitsById = new Map<string, LeaderCourse['orgUnit']>()
  const areasById = new Map<string, LeaderArea>()
  for (const role of leaderRoles) {
    if (role.leaderType === 'ORG_UNIT' && role.orgUnit) {
      orgUnitsById.set(role.orgUnit.id, role.orgUnit)
    }
    if (role.leaderType === 'AREA' && role.area) {
      areasById.set(role.area.id, role.area)
    }
  }

  const orgUnits = [...orgUnitsById.values()]
  const areas = [...areasById.values()]
  const orgUnitIds = new Set(orgUnits.map((orgUnit) => orgUnit.id))
  const areaIds = new Set(areas.map((area) => area.id))

  function canReview(orgUnit: LeaderCourse['orgUnit'], areaId: string) {
    return hasAllAccess || (leaderRoles.length > 0 && orgUnit.isClosed === true)
      || orgUnitIds.has(orgUnit.id) || areaIds.has(areaId)
  }

  function canView(orgUnit: LeaderCourse['orgUnit'], areaId: string) {
    return canReview(orgUnit, areaId) || (hasAreaRole && user.orgUnit?.id === orgUnit.id)
  }

  return {
    labels: hasAllAccess ? ['모든 조직 단위 - 모든 영역'] : [
      ...orgUnits.map((orgUnit) => `${orgUnit.name} - 모든 영역`),
      ...areas.map((area) => `${area.name} - 모든 조직 단위`),
    ],
    canView,
    canReview,
  }
}

function toLeaderHomeTask(task: TaskResponse, today: string, alertIds: Set<string>): LeaderHomeTask {
  return {
    id: task.id,
    courseId: task.courseId,
    courseName: task.courseName,
    title: task.title,
    areaId: task.areaId,
    areaName: task.areaName,
    assigneeNames: task.assignees.map((assignee) => assignee.name),
    isMyArea: task.isMyArea,
    dueDate: task.dueDate,
    isCompleted: task.status !== 'TODO',
    completedBy: task.completedBy?.name,
    completedAt: task.completedAt ?? undefined,
    reviewedBy: task.reviewedBy?.name,
    reviewedAt: task.reviewedAt ?? undefined,
    requiresReview: task.requiresReview,
    reviewStatus: getReviewStatus(task),
    canReview: task.canReview,
    orgUnit: { id: task.orgUnitId, name: task.orgUnitName, isClosed: task.orgUnitClosed },
    isReadOnly: !task.canReviewInArea,
    ...getDeadline(task.dueDate, today, task.status === 'TODO' && alertIds.has(task.id)),
  }
}

export function getLeaderHomeData(response: LeaderHomeResponse) {
  const { today } = response
  const alertIds = new Set(response.alerts.items.map((task) => task.id))
  const toTask = (task: TaskResponse) => toLeaderHomeTask(task, today, alertIds)
  const areasById = new Map<string, LeaderArea>()

  const courses: LeaderHomeCourse[] = response.courses.items.map(({ course, orgUnitClosed, areas, overdueCount, nextTask }) => {
    const courseAreas = areas.map((area) => {
      areasById.set(area.areaId, { id: area.areaId, name: area.areaName })
      const assignment = course.assignees.find((item) => item.areaId === area.areaId)
      return {
        area: { id: area.areaId, name: area.areaName },
        assigneeNames: assignment?.users.map((user) => user.name) ?? [],
        completedCount: area.completedCount,
        totalCount: area.totalCount,
        canView: true,
        canReview: area.canReview,
      }
    })

    return {
      id: course.id,
      name: course.name,
      startDate: course.startDate,
      endDate: course.endDate,
      orgUnit: { id: course.orgUnitId, name: course.orgUnitName ?? '', isClosed: orgUnitClosed },
      areas: courseAreas,
      assigneeNames: [...new Set(courseAreas.flatMap((area) => area.assigneeNames))],
      overdueCount,
      nextTask: nextTask && toTask(nextTask),
    }
  })

  const records = response.records.items.map((record) => ({
    ...toTask(record.task),
    canReview: record.canReview,
    completionMemo: record.completionMemo ?? undefined,
  }))

  return {
    today,
    summary: response.summary,
    activeCourseCount: response.activeCourseCount,
    alerts: response.alerts.items.map(toTask),
    pendingReviews: response.pendingReviews.items,
    records,
    courses,
    areas: [...areasById.values()].sort((a, b) => Number(a.id) - Number(b.id)),
  }
}
