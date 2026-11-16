export type DocumentIndexStatus = 'PENDING' | 'PROCESSING' | 'READY' | 'FAILED' | 'UNSUPPORTED'

export type DocumentKind = { id: string; name: string }

export type UploadDocumentMetadata = {
  title: string
  documentTypeId: string
  businessScope: 'ALL' | 'SELECTED'
  businessIds: string[]
  effectiveDate: string | null
}

export type DocumentItem = {
  id: string
  title: string
  documentTypeId: string
  documentTypeName: string
  effectiveDate: string | null
  sourceType: 'FILE' | 'LINK'
  originalFilename: string | null
  externalUrl: string | null
  businessScope: 'ALL' | 'SELECTED'
  businessIds: string[]
  contentRevision: number
  indexStatus: DocumentIndexStatus
  indexError: string | null
  deletedAt: string | null
  cleanupPending: boolean
}
