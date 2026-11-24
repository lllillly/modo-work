import type { IssuedApiClient } from '../types/apiClients'
import { requestApi, sendApi } from './client'

export const issueApiClient = (name: string, businesses: string[]) =>
  sendApi<IssuedApiClient>('/admin/api-clients', 'POST', { name, scope: 'COURSE_SUMMARY_READ', businesses })

export async function revokeApiClient(id: string) {
  await requestApi(`/admin/api-clients/${encodeURIComponent(id)}`, { method: 'DELETE' })
}
