import type { PageResponse } from '../types/courseApi'
import type { TaskIssue, TaskIssueDetail } from '../types/taskIssue'
import { getApi, sendApi } from './client'
import { getAllPages } from './pagination'

export function getOpenTaskIssues(businessId: string, courseId: string, signal?: AbortSignal) {
  return getAllPages((page) => {
    const query = new URLSearchParams({ businessId, courseId, state: 'OPEN', page: String(page), size: '100' })
    return getApi<PageResponse<TaskIssue>>(`/task-issues?${query}`, signal)
  })
}

export const getTaskIssue = (id: string, signal?: AbortSignal) =>
  getApi<TaskIssueDetail>(`/task-issues/${encodeURIComponent(id)}`, signal)

export const resolveTaskIssue = (id: string) =>
  sendApi<TaskIssueDetail>(`/task-issues/${encodeURIComponent(id)}/resolve`, 'POST', {})
