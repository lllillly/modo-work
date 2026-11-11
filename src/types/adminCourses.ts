export type CourseAssignee = {
  id: string
  name: string
  email: string
  orgUnitId: string
  areaIds: string[]
  status: 'ACTIVE' | 'INACTIVE'
}

export type ManagedCourse = {
  id: string
  businessName: string
  externalKey: string
  name: string
  orgUnitId: string
  startDate: string
  endDate: string
  capacity: number | null
  assignees: Record<string, string[]>
  version: number
  updatedAt: string
  updatedBy: string
  archivedAt: string | null
  archivedBy: string | null
  hasProcessingHistory: boolean
  pendingByArea: Record<string, number>
  history: {
    id: string
    label: string
    before: string
    after: string
    reason: string
    actor: string
    createdAt: string
  }[]
}

export type CourseDraft = Pick<
  ManagedCourse,
  'externalKey' | 'name' | 'orgUnitId' | 'startDate' | 'endDate' | 'capacity' | 'assignees'
>

export type CourseSaveResult = {
  course: ManagedCourse
  created: number
  changed: number
  shifted: number
  reassigned: number
}

export type CourseImportRow = {
  line: number
  action: '신규' | '갱신' | '오류'
  externalKey: string
  name: string
  orgUnitName: string
  startDate: string
  endDate: string
  lengthLabel: '장기' | '단기'
  capacity: number
  severity: 'error' | 'warning' | null
  message: string
}

export type CourseImportPreview = {
  rows: CourseImportRow[]
  createdCount: number
  updatedCount: number
  warningCount: number
  errorCount: number
  canImport: boolean
}
