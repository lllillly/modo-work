import type { ApiClient, IssuedApiClient } from '../types/apiClients'
import { getApi, requestApi, sendApi } from './client'

export const getApiClients = (signal?: AbortSignal) => getApi<{ items: ApiClient[] }>('/admin/api-clients', signal)

export const issueApiClient = (name: string, businesses: string[]) =>
  sendApi<IssuedApiClient>('/admin/api-clients', 'POST', { name, scope: 'COURSE_SUMMARY_READ', businesses })

export async function revokeApiClient(id: string) {
  await requestApi(`/admin/api-clients/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
