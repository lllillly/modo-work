import type { DocumentItem } from '../../types/documents'

export const ALL_TYPES = 'all'

export function getDocumentTypes(documents: DocumentItem[]) {
  const types = new Map(documents.map((item) => [item.documentTypeId, item.documentTypeName]))
  return [...types]
    .sort(([first], [second]) => Number(first) - Number(second))
    .map(([id, name]) => ({ id, name }))
}

export function getDocumentScope(item: DocumentItem, businessName: string) {
  return item.businessScope === 'ALL' ? '공통' : businessName
}

export function getExternalHref(item: DocumentItem) {
  return item.externalUrl && /^https?:\/\//i.test(item.externalUrl) ? item.externalUrl : null
}

export function isSearchExcluded(item: DocumentItem) {
  return item.indexError === 'NO_TEXT'
}

export function getDocumentMeta(item: DocumentItem, businessName: string) {
  const meta = [item.documentTypeName, getDocumentScope(item, businessName)]
  if (item.sourceType === 'LINK') meta.push('새 탭에서 열려요')
  return meta.join(' · ')
}

export function getViewerMeta(item: DocumentItem, businessName: string) {
  const meta = [item.documentTypeName, getDocumentScope(item, businessName), `v${item.contentRevision}`]
  if (item.effectiveDate) meta.push(`시행 ${item.effectiveDate.replaceAll('-', '.')}`)
  return meta.join(' · ')
}

export function formatFileSize(size: number) {
  return size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(size / 1024))}KB`
}

export function getFileSummary(item: DocumentItem) {
  if (item.sourceType === 'LINK') return '외부 링크'
  const summary = ['PDF']
  if (item.fileSizeBytes !== null) summary.push(formatFileSize(item.fileSizeBytes))
  if (item.pageCount !== null) summary.push(`${item.pageCount}쪽`)
  return summary.join(' · ')
}

export function isIndexRetrying(item: DocumentItem) {
  return item.indexStatus === 'FAILED' && item.indexError === 'RETRYABLE'
}

export function getIndexStatus(item: DocumentItem) {
  if (item.sourceType === 'LINK') return { label: '대상 아님 · 외부 링크', color: 'default' }
  if (isIndexRetrying(item)) return { label: '읽는 중…', color: 'processing' }
  if (item.indexStatus === 'READY') return { label: '색인 완료', color: 'success' }
  if (item.indexStatus === 'FAILED') return { label: '읽기 실패', color: 'error' }
  if (item.indexStatus === 'UNSUPPORTED') {
    return isSearchExcluded(item)
      ? { label: '텍스트 없음 · 검색 제외', color: 'warning' }
      : { label: '대상 아님 · PDF 아님', color: 'default' }
  }
  return { label: '읽는 중…', color: 'processing' }
}
