import type { HomeCourse, HomeTask } from '../../types/home'
import type { AssigneeHomeResponse } from '../../types/homeApi'
import type { TaskResponse } from '../../types/taskApi'
import { getDaysUntil } from '../../utils/date'

export function getDeadline(
  dueDate: string | null,
  today: string,
  isDueSoon = false,
): Pick<HomeTask, 'deadlineLabel' | 'deadlineStatus'> {
  if (!dueDate) return { deadlineLabel: '-', deadlineStatus: 'none' }

  const daysUntil = getDaysUntil(dueDate, today)
  const deadlineLabel = daysUntil === 0 ? 'D-day' : `D${daysUntil < 0 ? '+' : '-'}${Math.abs(daysUntil)}`
  let deadlineStatus: HomeTask['deadlineStatus'] = 'scheduled'

  if (daysUntil < 0) deadlineStatus = 'overdue'
  else if (isDueSoon) deadlineStatus = 'dueSoon'
  else if (daysUntil <= 7) deadlineStatus = 'upcoming'

  return { deadlineLabel, deadlineStatus }
}

export function getReviewStatus(task: TaskResponse): HomeTask['reviewStatus'] {
  if (!task.requiresReview) return undefined
  if (task.status === 'REVIEWED') return 'confirmed'
  return task.status === 'DONE' ? 'pending' : undefined
}

export function toHomeTask(task: TaskResponse, today: string, alertIds: Set<string>): HomeTask {
  return {
    id: task.id,
    courseId: task.courseId,
    courseName: task.courseName,
    title: task.title,
    areaName: task.areaName,
    isMyArea: task.isMyArea,
    dueDate: task.dueDate,
    isCompleted: task.status !== 'TODO',
    completedBy: task.completedBy?.name,
    reviewStatus: getReviewStatus(task),
    ...getDeadline(task.dueDate, today, task.status === 'TODO' && alertIds.has(task.id)),
  }
}

export function getAssigneeHomeData(
  response: AssigneeHomeResponse,
  dayTasks: TaskResponse[],
  canComplete: (task: TaskResponse) => boolean,
) {
  const { today } = response
  const alertIds = new Set(response.alerts.items.map((task) => task.id))
  const toTask = (task: TaskResponse) => toHomeTask(task, today, alertIds)
  const sortedDayTasks = dayTasks
    .map((task) => ({ ...toTask(task), canComplete: canComplete(task) }))
    .sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted))

  const courses: HomeCourse[] = response.courses.items.map((item) => ({
    id: item.course.id,
    name: item.course.name,
    startDate: item.course.startDate,
    endDate: item.course.endDate,
    completedCount: item.completedCount,
    totalCount: item.totalCount,
    nextTask: item.nextTask && toTask(item.nextTask),
  }))

  return {
    today,
    summary: response.summary,
    alerts: response.alerts.items.map(toTask),
    calendar: response.calendar,
    courses,
    dayTasks: sortedDayTasks.filter((task) => task.isMyArea),
    otherTasks: sortedDayTasks.filter((task) => !task.isMyArea),
  }
}
