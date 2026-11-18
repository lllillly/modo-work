import type { PageResponse } from '../types/courseApi'
import type {
  CreateLinkMetadata,
  DeletionContext,
  DocumentItem,
  DocumentKind,
  DocumentVersion,
  UploadDocumentMetadata,
} from '../types/documents'
import { getApi, requestApi, sendApi } from './client'
import { getAllPages } from './pagination'

export function getDocuments(businessId: string, signal?: AbortSignal) {
  return getAllPages((page) => {
    const query = new URLSearchParams({ businessId, page: String(page), size: '100' })
    return getApi<PageResponse<DocumentItem>>(`/documents?${query}`, signal)
  })
}

export function getDocumentFileUrl(documentId: string, businessId: string, page = 1) {
  const query = new URLSearchParams({ businessId })
  return `${import.meta.env.BASE_URL}api/documents/${encodeURIComponent(documentId)}/file?${query}#page=${page}&navpanes=0`
}

export function getAdminDocuments(signal?: AbortSignal) {
  return getAllPages((page) => {
    const query = new URLSearchParams({ state: 'active', page: String(page), size: '100' })
    return getApi<PageResponse<DocumentItem>>(`/admin/documents?${query}`, signal)
  })
}

export const getDocumentKinds = (signal?: AbortSignal) =>
  getApi<{ items: DocumentKind[] }>('/admin/document-types', signal)

export async function uploadDocument(metadata: UploadDocumentMetadata, file: File) {
  const body = new FormData()
  body.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  body.append('file', file)
  const response = await requestApi('/admin/documents', { method: 'POST', body })
  const result: { id: string } = await response.json()
  return result.id
}

export async function createLinkDocument(metadata: CreateLinkMetadata) {
  const result = await sendApi<{ id: string }>('/admin/documents/links', 'POST', metadata)
  return result.id
}

export async function replaceDocumentFile(item: DocumentItem, file: File) {
  const body = new FormData()
  body.append('metadata', new Blob([JSON.stringify({ contentRevision: item.contentRevision })], { type: 'application/json' }))
  body.append('file', file)
  await requestApi(`/admin/documents/${encodeURIComponent(item.id)}/file`, { method: 'POST', body })
}

export const getDeletionContext = (documentId: string, signal?: AbortSignal) =>
  getApi<DeletionContext>(`/admin/documents/${encodeURIComponent(documentId)}/deletion-context`, signal)

export async function deleteDocument(documentId: string, contentRevision: number) {
  const query = new URLSearchParams({ contentRevision: String(contentRevision) })
  await requestApi(`/admin/documents/${encodeURIComponent(documentId)}?${query}`, { method: 'DELETE' })
}

export async function retryDocumentIndex(documentId: string) {
  await requestApi(`/admin/documents/${encodeURIComponent(documentId)}/retry-index`, { method: 'POST' })
}

export function getDocumentVersions(documentId: string, businessId: string | null, signal?: AbortSignal) {
  const id = encodeURIComponent(documentId)
  return getAllPages((page) => {
    const query = new URLSearchParams({ page: String(page), size: '100' })
    if (businessId) query.set('businessId', businessId)
    const path = businessId ? `/documents/${id}/versions` : `/admin/documents/${id}/versions`
    return getApi<PageResponse<DocumentVersion>>(`${path}?${query}`, signal)
  })
}

export function getVersionFileUrl(documentId: string, contentRevision: number, businessId: string | null) {
  const id = encodeURIComponent(documentId)
  return businessId
    ? `${import.meta.env.BASE_URL}api/documents/${id}/versions/${contentRevision}/file?${new URLSearchParams({ businessId })}`
    : `${import.meta.env.BASE_URL}api/admin/documents/${id}/versions/${contentRevision}/file`
}

export const restoreDocumentVersion = (item: DocumentItem, targetRevision: number) =>
  sendApi<{ contentRevision: number }>(
    `/admin/documents/${encodeURIComponent(item.id)}/versions/${targetRevision}/restore`,
    'POST',
    { contentRevision: item.contentRevision },
  )
