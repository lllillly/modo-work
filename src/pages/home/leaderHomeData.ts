import type { AuthUser } from '../../types/auth'
import type { LeaderArea, LeaderCourse, LeaderHomeCourse, LeaderHomeTask, LeaderTask } from '../../types/leaderHome'
import { getDeadline } from './assigneeHomeData'

function compareTaskDeadline(a: LeaderHomeTask, b: LeaderHomeTask) {
  return (a.dueDate ?? '').localeCompare(b.dueDate ?? '') || a.id.localeCompare(b.id)
}

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

type LeaderHomeDataOptions = {
  user: AuthUser
  businessName: string
  areas: LeaderArea[]
  courses: LeaderCourse[]
  tasks: LeaderTask[]
  today: string
}

export function getLeaderHomeData({ user, businessName, areas, courses, tasks, today }: LeaderHomeDataOptions) {
  const reviewScope = getLeaderReviewScope(user)
  const visibleCourses = courses.filter((course) => course.businessName === businessName
    && course.areas.some(({ area }) => reviewScope.canView(course.orgUnit, area.id)))
  const courseById = new Map(visibleCourses.map((course) => [course.id, course]))
  const tasksByCourse = new Map<string, LeaderHomeTask[]>()
  const visibleTasks: LeaderHomeTask[] = []

  for (const task of tasks) {
    const course = courseById.get(task.courseId)
    if (!course || !reviewScope.canView(course.orgUnit, task.areaId)) continue

    const homeTask: LeaderHomeTask = {
      ...task, courseName: course.name, orgUnit: course.orgUnit,
      isReadOnly: !reviewScope.canReview(course.orgUnit, task.areaId),
      ...getDeadline(task.dueDate, today),
    }
    visibleTasks.push(homeTask)
    const courseTasks = tasksByCourse.get(course.id) ?? []
    courseTasks.push(homeTask)
    tasksByCourse.set(course.id, courseTasks)
  }

  const alerts = visibleTasks.filter((task) => !task.isCompleted
    && (task.deadlineStatus === 'overdue' || task.deadlineStatus === 'dueSoon'))
    .sort(compareTaskDeadline)
  const records = visibleTasks.filter((task) => task.isCompleted)
    .sort((a, b) => {
      const aTime = a.completedAt
      const bTime = b.completedAt
      return (bTime ? Date.parse(bTime) : 0) - (aTime ? Date.parse(aTime) : 0) || a.id.localeCompare(b.id)
    })
  const pendingReviews = records.filter((task) => task.requiresReview && task.reviewStatus === 'pending' && !task.isReadOnly)

  const homeCourses: LeaderHomeCourse[] = visibleCourses.map((course) => {
    const courseTasks = tasksByCourse.get(course.id) ?? []
    let nextTask: LeaderHomeTask | null = null
    let overdueCount = 0

    for (const task of courseTasks) {
      if (task.isCompleted) continue
      if (task.deadlineStatus === 'overdue') overdueCount += 1
      if (!task.dueDate || task.dueDate < today) continue

      if (!nextTask || compareTaskDeadline(task, nextTask) < 0) {
        nextTask = task
      }
    }

    const courseAreas = course.areas.map((assignment) => ({
      ...assignment,
      canView: reviewScope.canView(course.orgUnit, assignment.area.id),
      canReview: reviewScope.canReview(course.orgUnit, assignment.area.id),
    }))

    return {
      ...course, areas: courseAreas,
      assigneeNames: [...new Set(courseAreas.filter((area) => area.canView).flatMap((area) => area.assigneeNames))],
      overdueCount,
      nextTask,
    }
  })

  return {
    reviewScope, alerts, records, pendingReviews, courses: homeCourses,
    activeCourseCount: visibleCourses.filter((course) => course.startDate <= today && course.endDate >= today).length,
    overdueCount: alerts.filter((task) => task.deadlineStatus === 'overdue').length,
    dueSoonCount: alerts.filter((task) => task.deadlineStatus === 'dueSoon').length,
    overdueByArea: areas.map((area) => ({
      ...area,
      count: alerts.filter((task) => task.areaId === area.id && task.deadlineStatus === 'overdue').length,
    })),
  }
}
