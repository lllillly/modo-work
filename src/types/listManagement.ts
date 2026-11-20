export type ListKind = 'businesses' | 'areas' | 'orgUnits' | 'documentTypes'

export type ListItem = {
  id: string
  name: string
  sortOrder: number
  isActive: boolean
  version: number
  isInUse: boolean
  courseCount?: number
  userCount?: number
  documentCount?: number
  isClosed?: boolean
  allowCrossAreaView?: boolean
}

export type ListItemInput = {
  name: string
  sortOrder: number
  isActive: boolean
  allowCrossAreaView?: boolean
}
