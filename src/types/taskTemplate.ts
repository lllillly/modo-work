export type ReferenceType = 'COURSE_START' | 'COURSE_END' | 'MONTH_END' | 'ALWAYS'

export type TaskTemplate = {
  id: string
  businessId: string
  templateKey: string
  areaId: string
  title: string
  phase: string | null
  referenceType: ReferenceType
  defaultOffsetDays: number | null
  longOffsetDays: number | null
  shortOffsetDays: number | null
  performer: string | null
  systemName: string | null
  displayText: string | null
  tagIds: string[]
  documentIds: string[]
  requiresReview: boolean
  sortOrder: number
  revision: number
  version: number
  isActive: boolean
}

export type TemplateInput = Omit<TaskTemplate, 'id' | 'businessId' | 'templateKey' | 'revision' | 'version' | 'isActive'>

export type TemplateRecalculation = {
  updatedTaskCount: number
  deadlineChangedTaskCount: number
  createdTaskCount: number
  supersededTaskCount: number
  preservedCompletedTaskCount: number
  mismatchCount: number
}

export type TemplateTag = {
  id: string
  businessId: string
  name: string
  isActive: boolean
  version: number
}
