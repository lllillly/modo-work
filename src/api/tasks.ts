import type { PageResponse } from '../types/courseApi'
import type { TaskActionType } from '../types/courseTasks'
import type {
  CourseTaskSummary,
  TaskActionResponse,
  TaskMemoResponse,
  TaskResponse,
} from '../types/taskApi'
import { getApi, sendApi } from './client'
import { getAllPages } from './pagination'

type CourseTasksQuery = { businessId: string; courseId: string; status?: 'TODO' | 'DONE' | 'REVIEWED' }

export function getCourseTasks(parameters: CourseTasksQuery, signal?: AbortSignal) {
  return getAllPages((page) => {
    const query = new URLSearchParams({ ...parameters, scope: 'all', page: String(page), size: '100' })
    return getApi<PageResponse<TaskResponse>>(`/tasks?${query}`, signal)
  })
}

export async function getPendingTasksByArea(businessId: string, courseId: string, signal?: AbortSignal) {
  const tasks = await getCourseTasks({ businessId, courseId, status: 'TODO' }, signal)
  return summarizeCourseTasks(tasks).pendingByArea
}

export async function getCourseTaskSummary(businessId: string, courseId: string, signal?: AbortSignal) {
  const tasks = await getCourseTasks({ businessId, courseId }, signal)
  return summarizeCourseTasks(tasks)
}

function summarizeCourseTasks(tasks: TaskResponse[]): CourseTaskSummary {
  const areaNames: Record<string, string> = {}
  const pendingByArea: Record<string, number> = {}
  for (const task of tasks) {
    areaNames[task.areaId] = task.areaName
    if (task.status !== 'TODO') continue
    if (task.referenceType === 'ALWAYS' || task.isReadOnly || task.supersededByTaskId) continue
    pendingByArea[task.areaId] = (pendingByArea[task.areaId] ?? 0) + 1
  }
  return { areaNames, pendingByArea }
}

export function getTasksDueOn(businessId: string, scope: 'mine' | 'all', date: string, signal?: AbortSignal) {
  return getAllPages((page) => {
    const query = new URLSearchParams({
      businessId,
      scope,
      dueDateFrom: date,
      dueDateTo: date,
      page: String(page),
      size: '100',
    })
    return getApi<PageResponse<TaskResponse>>(`/tasks?${query}`, signal)
  })
}

export const getTask = (id: string, signal?: AbortSignal) =>
  getApi<{ task: TaskResponse }>(`/tasks/${encodeURIComponent(id)}`, signal)

export function getTaskActions(id: string, signal?: AbortSignal) {
  return getAllPages((page) =>
    getApi<PageResponse<TaskActionResponse>>(
      `/tasks/${encodeURIComponent(id)}/actions?page=${page}&size=100`,
      signal,
    ),
  )
}

export function getTaskMemos(id: string, signal?: AbortSignal) {
  return getAllPages((page) =>
    getApi<PageResponse<TaskMemoResponse>>(
      `/tasks/${encodeURIComponent(id)}/memos?page=${page}&size=100`,
      signal,
    ),
  )
}

type TaskActionRequest = {
  version: number
  requestId: string
  memo?: string
  targetActionLogId?: string
}

export function processTask(
  id: string,
  type: Exclude<TaskActionType, 'MEMO' | 'UPDATE_MEMO'>,
  request: TaskActionRequest,
) {
  const paths = {
    COMPLETE: 'complete',
    REVIEW: 'review',
    CANCEL_COMPLETION: 'cancel-completion',
    CANCEL_REVIEW: 'cancel-review',
  }
  return sendApi<{ task: TaskResponse }>(
    `/tasks/${encodeURIComponent(id)}/${paths[type]}`,
    'POST',
    request,
  )
}

export async function reviewTasks(tasks: TaskResponse[], onReviewed: (count: number) => void) {
  for (let start = 0; start < tasks.length; start += 100) {
    await sendApi<{ items: TaskResponse[] }>('/tasks/bulk-review', 'POST', {
      items: tasks.slice(start, start + 100).map((task) => ({
        taskId: task.id, version: task.version, requestId: crypto.randomUUID(), memo: null,
      })),
    })
    onReviewed(Math.min(100, tasks.length - start))
  }
}

export const addTaskMemo = (id: string, requestId: string, content: string) =>
  sendApi<{ memo: TaskMemoResponse }>(`/tasks/${encodeURIComponent(id)}/memos`, 'POST', {
    requestId,
    content,
  })
