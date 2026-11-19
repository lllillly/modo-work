export type TaskIssueSnapshot = {
  areaId: number
  title: string
  phase: string | null
  requiresReview: boolean
  rawDueDate: string | null
  dueDate: string | null
  documentIds: string[]
  tags: Record<string, string>
}

export type TaskIssue = {
  id: string
  taskId: string
  businessId: string
  courseId: string
  courseName: string
  areaId: string
  title: string
  issueType: 'SCHEDULE_MISMATCH' | 'TEMPLATE_MISMATCH'
  createdAt: string
  resolvedAt: string | null
  resolvedBy: string | null
  resolutionNote: string | null
}

export type TaskIssueDetail = {
  issue: TaskIssue
  details: { before: TaskIssueSnapshot; expected: TaskIssueSnapshot[] }
}
