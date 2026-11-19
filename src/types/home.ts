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
  canComplete?: boolean
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

export type HomeCourse = Omit<Course, 'businessName'> & {
  completedCount: number
  totalCount: number
  nextTask: HomeTask | null
}
