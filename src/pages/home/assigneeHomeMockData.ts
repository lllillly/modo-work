import type { Course, Task } from '../../types/home'
// 임시 데이터
export const today = '2026-11-02'

export const currentUser = {
  name: '담당자 A',
  email: 'user1@example.com',
  role: 'ADMIN' as const,
  roleLabel: '관리자',
}

export const invalidEmail = 'user@gmail.com'

export const courses: Course[] = [
  { id: 'course-1', businessName: '사업 1', name: '예시 과정 A 3회차', startDate: '2026-06-15', endDate: '2026-12-11' },
  { id: 'course-2', businessName: '사업 1', name: '예시 과정 B 1회차', startDate: '2026-11-02', endDate: '2027-02-26' },
  { id: 'course-3', businessName: '사업 1', name: '예시 과정 C 2회차', startDate: '2026-09-01', endDate: '2027-01-29' },
  { id: 'course-4', businessName: '사업 1', name: '예시 과정 D 1회차', startDate: '2026-11-02', endDate: '2027-03-31' },
]

export const tasks: Task[] = [
  {
    id: 'task-a', courseId: 'course-1', title: '할 일 A', areaName: '영역 1', isMyArea: true,
    dueDate: '2026-10-28', isCompleted: false,
  },
  {
    id: 'task-b', courseId: 'course-2', title: '할 일 B', areaName: '영역 1', isMyArea: true,
    dueDate: '2026-11-01', isCompleted: false,
  },
  {
    id: 'task-c', courseId: 'course-1', title: '할 일 C', areaName: '영역 1', isMyArea: true,
    dueDate: '2026-11-03', isCompleted: false,
  },
  {
    id: 'task-d', courseId: 'course-3', title: '할 일 D', areaName: '영역 1', isMyArea: true,
    dueDate: '2026-11-04', isCompleted: false,
  },
  {
    id: 'task-e', courseId: 'course-2', title: '할 일 E', areaName: '영역 1', isMyArea: true,
    dueDate: '2026-11-05', isCompleted: false,
  },
  {
    id: 'task-f', courseId: 'course-4', title: '할 일 F', areaName: '영역 1', isMyArea: true,
    dueDate: '2026-11-08', isCompleted: false,
  },
  {
    id: 'task-g', courseId: 'course-3', title: '할 일 G', areaName: '영역 1', isMyArea: true,
    dueDate: '2026-11-16', isCompleted: false,
  },
  {
    id: 'task-h', courseId: 'course-1', title: '할 일 H', areaName: '영역 1', isMyArea: true,
    dueDate: today, isCompleted: false,
  },
  {
    id: 'task-i', courseId: 'course-1', title: '할 일 I', areaName: '영역 1', isMyArea: true,
    dueDate: today, isCompleted: true,
    completedBy: '담당자 B', reviewStatus: 'pending',
  },
  {
    id: 'task-j', courseId: 'course-1', title: '할 일 J', areaName: '영역 2', isMyArea: false,
    dueDate: today, isCompleted: false,
  },
  {
    id: 'task-k', courseId: 'course-3', title: '할 일 K', areaName: '영역 3', isMyArea: false,
    dueDate: today, isCompleted: true,
    completedBy: '담당자 C', reviewStatus: 'confirmed',
  },
  {
    id: 'task-l', courseId: 'course-4', title: '할 일 L', areaName: '영역 1', isMyArea: true,
    dueDate: today, isCompleted: false,
  },
  {
    id: 'task-m', courseId: 'course-2', title: '할 일 M', areaName: '영역 2', isMyArea: false,
    dueDate: '2026-11-06', isCompleted: false,
  },
]
