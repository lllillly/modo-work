import type { CourseResponse } from '../types/courseApi'
import type { AssigneeHomeResponse, LeaderHomeResponse } from '../types/homeApi'
import type { ViewScope } from '../types/home'
import { getApi } from './client'
import { withRestPages } from './pagination'

const LIST_SIZE = '100'
const HEADER_ALERT_SIZE = '10'

type AssigneeHomeQuery = {
  businessId: string
  scope: ViewScope
  selectedDate: string
  month: string
}

export async function getAssigneeHome(parameters: AssigneeHomeQuery, signal?: AbortSignal) {
  const load = (pages: Record<string, string> = {}) => {
    const query = new URLSearchParams({ ...parameters, courseSize: LIST_SIZE, alertSize: LIST_SIZE, ...pages })
    return getApi<AssigneeHomeResponse>(`/home/assignee?${query}`, signal)
  }
  const first = await load()
  const [alerts, courses] = await Promise.all([
    withRestPages(first.alerts, (page) => load({ alertPage: String(page) }).then((home) => home.alerts)),
    withRestPages(first.courses, (page) => load({ coursePage: String(page) }).then((home) => home.courses)),
  ])
  return { ...first, alerts, courses }
}

export async function getLeaderHome(businessId: string, signal?: AbortSignal) {
  const load = (pages: Record<string, string> = {}) => {
    const query = new URLSearchParams({
      businessId,
      alertSize: LIST_SIZE,
      reviewSize: LIST_SIZE,
      courseSize: LIST_SIZE,
      recordSize: LIST_SIZE,
      ...pages,
    })
    return getApi<LeaderHomeResponse>(`/home/leader?${query}`, signal)
  }
  const first = await load()
  const [alerts, pendingReviews, courses, records] = await Promise.all([
    withRestPages(first.alerts, (page) => load({ alertPage: String(page) }).then((home) => home.alerts)),
    withRestPages(first.pendingReviews, (page) => load({ reviewPage: String(page) }).then((home) => home.pendingReviews)),
    withRestPages(first.courses, (page) => load({ coursePage: String(page) }).then((home) => home.courses)),
    withRestPages(first.records, (page) => load({ recordPage: String(page) }).then((home) => home.records)),
  ])
  return { ...first, alerts, pendingReviews, courses, records }
}

export function getHeaderAlerts(
  businessId: string,
  isLeader: boolean,
  signal?: AbortSignal,
): Promise<Pick<AssigneeHomeResponse, 'today' | 'alerts'>> {
  if (isLeader) {
    const query = new URLSearchParams({ businessId, alertSize: HEADER_ALERT_SIZE, reviewSize: '1', courseSize: '1', recordSize: '1' })
    return getApi<LeaderHomeResponse>(`/home/leader?${query}`, signal)
  }
  const query = new URLSearchParams({ businessId, scope: 'mine', alertSize: HEADER_ALERT_SIZE, courseSize: '1' })
  return getApi<AssigneeHomeResponse>(`/home/assignee?${query}`, signal)
}

export async function getHomeCourses(
  businessId: string,
  today: string,
  include: { leader: boolean; assignee: boolean },
  signal?: AbortSignal,
) {
  const [leaderHome, assigneeHome] = await Promise.all([
    include.leader ? getLeaderHome(businessId, signal) : null,
    include.assignee
      ? getAssigneeHome({ businessId, scope: 'mine', selectedDate: today, month: today.slice(0, 7) }, signal)
      : null,
  ])
  const courses = new Map<string, CourseResponse>()
  for (const item of [...(leaderHome?.courses.items ?? []), ...(assigneeHome?.courses.items ?? [])]) {
    courses.set(item.course.id, item.course)
  }
  return [...courses.values()]
}
