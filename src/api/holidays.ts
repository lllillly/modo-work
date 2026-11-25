import type { PageResponse } from '../types/courseApi'
import type { Holiday, HolidayRecalculation } from '../types/holidays'
import { getApi, requestApi, sendApi } from './client'
import { PAGE_SIZE } from './pagination'

export function getHolidays(from: string, to: string, page: number, signal?: AbortSignal) {
  const query = new URLSearchParams({ from, to, page: String(page), size: String(PAGE_SIZE) })
  return getApi<PageResponse<Holiday>>(`/holidays?${query}`, signal)
}

export const createHoliday = (date: string, name: string) =>
  sendApi<{ holiday: Holiday; recalculation: HolidayRecalculation }>('/admin/holidays', 'POST', { date, name })

export const updateHoliday = (id: string, version: number, changes: { date?: string; name?: string }) =>
  sendApi<{ holiday: Holiday; recalculation: HolidayRecalculation }>(
    `/admin/holidays/${encodeURIComponent(id)}`,
    'PATCH',
    { version, ...changes },
  )

export async function deleteHoliday(id: string, version: number) {
  const response = await requestApi(`/admin/holidays/${encodeURIComponent(id)}?version=${version}`, { method: 'DELETE' })
  return response.json() as Promise<{ id: string; recalculation: HolidayRecalculation }>
}
