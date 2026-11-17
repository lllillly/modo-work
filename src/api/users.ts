import type { PageResponse } from '../types/courseApi'
import type { ManagedUser, UserSettingsRequest, UserStatus } from '../types/adminUsers'
import type { UserRole } from '../types/user'
import { getApi, sendApi } from './client'

type UserFilter = {
  q?: string
  orgUnitId?: string
  role?: UserRole
  status?: UserStatus
}

function getUserQuery(page: number, filter: UserFilter, size: number) {
  const query = new URLSearchParams({ page: String(page), size: String(size) })
  if (filter.q?.trim()) query.set('q', filter.q.trim())
  if (filter.orgUnitId) query.set('orgUnitId', filter.orgUnitId)
  if (filter.role) query.set('role', filter.role)
  if (filter.status) query.set('status', filter.status)
  return query
}

export const getAdminUsers = (page: number, filter: UserFilter = {}, signal?: AbortSignal, size = 20) =>
  getApi<PageResponse<ManagedUser>>(`/admin/users?${getUserQuery(page, filter, size)}`, signal)

export const getManagedUsers = (page: number, filter: UserFilter = {}, signal?: AbortSignal, size = 20) =>
  getApi<PageResponse<ManagedUser>>(`/users?${getUserQuery(page, filter, size)}`, signal)

export const approveUser = (id: string, data: UserSettingsRequest) =>
  sendApi<{ user: ManagedUser }>(`/users/${encodeURIComponent(id)}/approval`, 'POST', data)

export const updateUserSettings = (
  id: string,
  data: UserSettingsRequest & { status: Exclude<UserStatus, 'PENDING'> },
) => sendApi<{ user: ManagedUser }>(`/admin/users/${encodeURIComponent(id)}/settings`, 'PUT', data)

export const grantUserRoles = (id: string, data: Pick<UserSettingsRequest, 'version' | 'roles'>) =>
  sendApi<{ user: ManagedUser }>(`/users/${encodeURIComponent(id)}/roles`, 'POST', data)
