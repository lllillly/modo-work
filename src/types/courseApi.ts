export type OptionItem = { id: string; name: string }

export type PageResponse<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type AssignedUser = {
  id: string
  name: string
  email?: string
  status: 'ACTIVE' | 'INACTIVE' | 'PENDING'
}

export type AreaAssignment = {
  areaId: string
  areaName?: string
  userIds: string[]
  users: AssignedUser[]
}

export type CourseResponse = {
  id: string
  businessId: string
  externalKey: string
  orgUnitId: string
  orgUnitName?: string
  name: string
  startDate: string
  endDate: string
  capacity: number | null
  lengthType: 'LONG' | 'SHORT'
  scheduleRevision: number
  version: number
  isReadOnly: boolean
  assignees: AreaAssignment[]
}

export type AssigneeCandidate = {
  id: string
  name: string
  email: string
  orgUnitId: string
  areaIds: string[]
}

export type Recalculation = {
  updatedTaskCount: number
  deadlineChangedTaskCount: number
  createdTaskCount: number
  supersededTaskCount: number
  preservedCompletedTaskCount: number
  mismatchCount: number
}

export type ScheduleContext = {
  course: Pick<
    CourseResponse,
    'id' | 'name' | 'businessId' | 'orgUnitId' | 'startDate' | 'endDate' | 'version' | 'isReadOnly'
  >
  permissions: { canEditSchedule: boolean; canCorrectEndDate: boolean }
}

export type AssignmentContext = {
  course: Pick<CourseResponse, 'id' | 'businessId' | 'orgUnitId' | 'version' | 'isReadOnly' | 'assignees'>
  permissions: { canReplaceAssignments: boolean; canReplaceEndedAssignments: boolean }
}

export type ScheduleChange = {
  id: string
  source: 'SCHEDULE_UPDATE' | 'END_DATE_CORRECTION' | 'CSV_IMPORT'
  importJobId: string | null
  before: { startDate: string; endDate: string }
  after: { startDate: string; endDate: string }
  actor: { id: string; name: string; role: string }
  reason: string | null
  createdAt: string
}

export type CourseProgressStatus = 'UPCOMING' | 'ONGOING' | 'ENDED'

export type CourseChangeSource =
  | 'COURSE_UPDATE'
  | 'COURSE_ASSIGNMENTS_UPDATE'
  | 'COURSE_ENDED_ASSIGNMENTS_UPDATE'
  | 'SCHEDULE_UPDATE'
  | 'END_DATE_CORRECTION'
  | 'CSV_IMPORT'

export type CourseChangeActor = { id: string; name: string; role: string | null }

export type CourseChange = {
  id: string
  source: CourseChangeSource
  importJobId: string | null
  changes: { field: string; before: unknown; after: unknown }[]
  actor: CourseChangeActor | null
  reason: string | null
  createdAt: string
}

export type CourseHistory = PageResponse<CourseChange> & {
  lastModifiedBy: CourseChangeActor | null
  lastModifiedAt: string | null
}

export type ImportRow = {
  rowNumber: number
  externalKey: string | null
  disposition: 'ADDED' | 'CHANGED' | 'UNCHANGED' | 'ERROR'
  courseId: string | null
  courseVersion: number | null
  changes: { field: string; before: unknown; after: unknown }[]
  errors: { code: string; field: string; message: string }[]
  warnings: { key: string; code: string; field: string; message: string }[]
}

export type ImportJob = {
  id: string
  kind: 'COURSES'
  status: 'PREVIEW' | 'APPLIED' | 'CANCELLED'
  version: number
  businessId: string
  fileName: string
  createdBy: { id: string; name: string }
  createdAt: string
  summary: {
    totalRowCount: number
    addedCount: number
    changedCount: number
    unchangedCount: number
    errorRowCount: number
    warningRowCount: number
    missingCourseCount: number
  }
  canApply: boolean
  requiredWarningKeys: string[]
  appliedAt: string | null
  appliedBy: { id: string; name: string } | null
  result: {
    addedCount: number
    changedCount: number
    unchangedCount: number
    assignmentChangedTaskCount: number
    recalculation: Recalculation
  } | null
}

export type MissingCourse = { id: string; externalKey: string; name: string }
export type ApplyImportRequest = { version: number; confirmedWarningKeys: string[] }

export type TemplateResponse = {
  id: string
  areaId: string
  phase: string | null
  sortOrder: number
  isActive: boolean
}
