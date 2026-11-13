import type {
  ApplyImportRequest,
  AssigneeCandidate,
  AssignmentContext,
  CourseHistory,
  CourseProgressStatus,
  CourseResponse,
  ImportJob,
  ImportRow,
  MissingCourse,
  OptionItem,
  PageResponse,
  Recalculation,
  ScheduleChange,
  ScheduleContext,
  TemplateResponse,
} from '../types/courseApi'
import type { CourseDraft } from '../types/adminCourses'
import { getApi, requestApi, sendApi } from './client'
import { getAllPages } from './pagination'

export const getBusinesses = (signal?: AbortSignal) =>
  getApi<{ items: OptionItem[] }>('/options/businesses', signal)

export function getOrgUnits(businessId: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ businessId })
  return getApi<{ items: OptionItem[] }>(`/options/org-units?${query}`, signal)
}

export async function getCourseOptions(businessId: string, signal?: AbortSignal) {
  const query = new URLSearchParams({ businessId })
  const [orgs, areas] = await Promise.all([
    getOrgUnits(businessId, signal),
    getApi<{ items: OptionItem[] }>(`/options/areas?${query}`, signal),
  ])
  return { orgUnits: orgs.items, areas: areas.items }
}

type CourseListFilter = {
  q?: string
  orgUnitId?: string
  progressStatus?: CourseProgressStatus
  needsAssignmentReview?: boolean
}

export function getCourses(
  businessId: string,
  page: number,
  signal?: AbortSignal,
  filter: CourseListFilter = {},
) {
  const query = new URLSearchParams({ businessId, page: String(page), size: '20', state: 'active' })
  if (filter.q?.trim()) query.set('q', filter.q.trim())
  if (filter.orgUnitId) query.set('orgUnitId', filter.orgUnitId)
  if (filter.progressStatus) query.set('progressStatus', filter.progressStatus)
  if (filter.needsAssignmentReview) query.set('needsAssignmentReview', 'true')
  return getApi<PageResponse<CourseResponse>>(`/admin/courses?${query}`, signal)
}

export const getCourse = (id: string, signal?: AbortSignal) =>
  getApi<{ course: CourseResponse }>(`/admin/courses/${encodeURIComponent(id)}`, signal)

export const getScheduleContext = (id: string, signal?: AbortSignal) =>
  getApi<ScheduleContext>(`/courses/${encodeURIComponent(id)}/schedule-context`, signal)

export const getAssignmentContext = (id: string, signal?: AbortSignal) =>
  getApi<AssignmentContext>(`/courses/${encodeURIComponent(id)}/assignment-context`, signal)

type AssigneeCandidateQuery = {
  businessId: string
  orgUnitId: string
  areaId: string
  q: string
  page: number
  size?: number
  courseId?: string
}

export function getAssigneeCandidates(parameters: AssigneeCandidateQuery, signal?: AbortSignal) {
  const { businessId, orgUnitId, areaId, q, page, size = 20, courseId } = parameters
  const query = new URLSearchParams({
    businessId,
    orgUnitId,
    areaId,
    q,
    page: String(page),
    size: String(size),
  })
  if (courseId) query.set('courseId', courseId)
  return getApi<PageResponse<AssigneeCandidate>>(`/admin/assignee-candidates?${query}`, signal)
}

export function createCourse(businessId: string, draft: CourseDraft) {
  return sendApi<{ course: CourseResponse; generatedTaskCount: number }>('/admin/courses', 'POST', {
    businessId,
    ...draft,
    assignees: toAssignments(draft.assignees),
  })
}

export function updateCourse(id: string, version: number, name: string, capacity: number | null) {
  return sendApi<{ course: CourseResponse }>(`/admin/courses/${encodeURIComponent(id)}`, 'PATCH', {
    version,
    name,
    capacity,
  })
}

export function updateSchedule(
  id: string,
  version: number,
  startDate: string,
  endDate: string,
  reason?: string,
) {
  const path =
    reason === undefined
      ? `/courses/${encodeURIComponent(id)}/schedule`
      : `/admin/courses/${encodeURIComponent(id)}/end-date-corrections`
  const body = reason === undefined ? { version, startDate, endDate } : { version, endDate, reason }
  return sendApi<ScheduleContext & { recalculation: Recalculation }>(
    path,
    reason === undefined ? 'PATCH' : 'POST',
    body,
  )
}

export function replaceAssignees(
  id: string,
  version: number,
  assignees: CourseDraft['assignees'],
  reason?: string,
) {
  const suffix = reason === undefined ? 'assignees' : 'ended-assignees'
  return sendApi<
    AssignmentContext & {
      assignmentChange: { changedAreaCount: number; assignmentChangedTaskCount: number }
    }
  >(`/admin/courses/${encodeURIComponent(id)}/${suffix}`, 'PUT', {
    version,
    assignees: toAssignments(assignees),
    ...(reason === undefined ? {} : { reason }),
  })
}

export function getScheduleChanges(id: string, page: number, signal?: AbortSignal) {
  return getApi<PageResponse<ScheduleChange>>(
    `/courses/${encodeURIComponent(id)}/schedule-changes?page=${page}&size=20`,
    signal,
  )
}

export function getCourseChanges(id: string, page: number, signal?: AbortSignal, size = 20) {
  return getApi<CourseHistory>(
    `/admin/courses/${encodeURIComponent(id)}/changes?page=${page}&size=${size}`,
    signal,
  )
}

export async function previewCourseImport(businessId: string, file: File, signal?: AbortSignal) {
  const body = new FormData()
  body.append('businessId', businessId)
  body.append('file', file)
  const response = await requestApi('/admin/courses/import?dryRun=true', {
    method: 'POST',
    body,
    signal,
  })
  const result: { job: ImportJob } = await response.json()
  return result.job
}

export const getImportJob = (id: string, signal?: AbortSignal) =>
  getApi<{ job: ImportJob }>(`/admin/imports/${encodeURIComponent(id)}`, signal)

export const getImportRows = (id: string, page: number, signal?: AbortSignal) =>
  getApi<PageResponse<ImportRow>>(
    `/admin/imports/${encodeURIComponent(id)}/rows?page=${page}&size=20`,
    signal,
  )

export const getMissingCourses = (id: string, page: number, signal?: AbortSignal) =>
  getApi<PageResponse<MissingCourse>>(
    `/admin/imports/${encodeURIComponent(id)}/missing-courses?page=${page}&size=20`,
    signal,
  )

export const applyCourseImport = (id: string, data: ApplyImportRequest) =>
  sendApi<{ job: ImportJob }>(`/admin/imports/${encodeURIComponent(id)}/apply`, 'POST', data)

export const cancelCourseImport = (id: string, version: number) =>
  sendApi<{ job: ImportJob }>(`/admin/imports/${encodeURIComponent(id)}/cancel`, 'POST', { version })

function toAssignments(assignees: CourseDraft['assignees']) {
  return Object.entries(assignees).map(([areaId, userIds]) => ({ areaId, userIds }))
}

export function getTemplates(businessId: string, signal?: AbortSignal) {
  return getAllPages((page) => {
    const query = new URLSearchParams({ businessId, page: String(page), size: '100' })
    return getApi<PageResponse<TemplateResponse>>(`/admin/templates?${query}`, signal)
  })
}

export async function getAssignmentAreas(businessId: string, signal?: AbortSignal) {
  const [options, templates] = await Promise.all([
    getCourseOptions(businessId, signal),
    getTemplates(businessId, signal),
  ])
  const activeAreaIds = new Set(options.areas.map((area) => area.id))
  const requiredAreaIds = [
    ...new Set(
      templates
        .filter((template) => template.isActive && activeAreaIds.has(template.areaId))
        .map((template) => template.areaId),
    ),
  ]
  return { ...options, requiredAreaIds }
}
