import type { PageResponse } from '../types/courseApi'
import type { TaskTemplate, TemplateInput, TemplateRecalculation, TemplateTag } from '../types/taskTemplate'
import { getApi, sendApi } from './client'
import { getAllPages } from './pagination'

export function getTaskTemplates(businessId: string, signal?: AbortSignal) {
  return getAllPages((page) => {
    const query = new URLSearchParams({ businessId, state: 'all', page: String(page), size: '100' })
    return getApi<PageResponse<TaskTemplate>>(`/admin/templates?${query}`, signal)
  })
}

export const getTaskTemplate = (id: string, signal?: AbortSignal) =>
  getApi<{ template: TaskTemplate }>(`/admin/templates/${encodeURIComponent(id)}`, signal)

export const createTaskTemplate = (data: TemplateInput & { businessId: string; templateKey: string }) =>
  sendApi<{ template: TaskTemplate }>('/admin/templates', 'POST', data)

export const updateTaskTemplate = (id: string, data: Partial<TemplateInput> & { version: number; isActive?: boolean }) =>
  sendApi<{ template: TaskTemplate; recalculation: TemplateRecalculation }>(
    `/admin/templates/${encodeURIComponent(id)}`,
    'PATCH',
    data,
  )

export function getTemplateTags(businessId: string, signal?: AbortSignal) {
  return getAllPages((page) => {
    const query = new URLSearchParams({ businessId, state: 'all', page: String(page), size: '100' })
    return getApi<PageResponse<TemplateTag>>(`/admin/tags?${query}`, signal)
  })
}

export const createTemplateTag = (businessId: string, name: string) =>
  sendApi<{ tag: TemplateTag }>('/admin/tags', 'POST', { businessId, name })

export const updateTemplateTag = (id: string, data: { version: number; name?: string; isActive?: boolean }) =>
  sendApi<{ tag: TemplateTag; recalculation: TemplateRecalculation }>(
    `/admin/tags/${encodeURIComponent(id)}`,
    'PATCH',
    data,
  )
