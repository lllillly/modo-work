export type ViewScope = 'mine' | 'all'

export type Course = {
  id: string
  businessName: string
  name: string
  startDate: string
  endDate: string
}

export type Task = {
  id: string
  courseId: string
  title: string
  areaName: string
  isMyArea: boolean
  dueDate: string | null
  isCompleted: boolean
  completedBy?: string
  reviewStatus?: 'pending' | 'confirmed'
}

export type HomeTask = Task & {
  courseName: string
  deadlineLabel: string
  deadlineStatus: 'overdue' | 'dueSoon' | 'upcoming' | 'scheduled' | 'none'
}

export type HomeCourse = Course & {
  completedCount: number
  totalCount: number
}
