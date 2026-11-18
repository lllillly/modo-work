import type { PageResponse } from '../types/courseApi'
import type { DocumentItem, DocumentKind, UploadDocumentMetadata } from '../types/documents'
import { getApi, requestApi } from './client'
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

export async function deleteDocument(item: DocumentItem) {
  const query = new URLSearchParams({ contentRevision: String(item.contentRevision) })
  await requestApi(`/admin/documents/${encodeURIComponent(item.id)}?${query}`, { method: 'DELETE' })
}

export async function retryDocumentIndex(documentId: string) {
  await requestApi(`/admin/documents/${encodeURIComponent(documentId)}/retry-index`, { method: 'POST' })
}
