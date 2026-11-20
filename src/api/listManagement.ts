import type { ListItem, ListItemInput, ListKind } from '../types/listManagement'
import { getApi, requestApi, sendApi } from './client'

const listPaths: Record<ListKind, { list: string; item: string }> = {
  businesses: { list: '/admin/businesses', item: '/admin/businesses' },
  areas: { list: '/admin/areas', item: '/admin/areas' },
  orgUnits: { list: '/admin/org-units', item: '/admin/org-units' },
  documentTypes: { list: '/admin/document-types/management', item: '/admin/document-types' },
}

export const getListItems = (kind: ListKind, signal?: AbortSignal) =>
  getApi<{ items: ListItem[] }>(`${listPaths[kind].list}?state=all`, signal)

export const addListItem = (kind: ListKind, data: ListItemInput) =>
  sendApi<unknown>(listPaths[kind].item, 'POST', data)

export const updateListItem = (kind: ListKind, id: string, data: ListItemInput & { version: number }) =>
  sendApi<unknown>(`${listPaths[kind].item}/${encodeURIComponent(id)}`, 'PUT', data)

export const deleteListItem = (kind: ListKind, id: string, version: number) =>
  requestApi(`${listPaths[kind].item}/${encodeURIComponent(id)}?version=${version}`, { method: 'DELETE' })
