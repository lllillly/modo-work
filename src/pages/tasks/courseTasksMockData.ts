import type { AuthUser } from '../../types/auth'
import type { CourseTask, CourseTasksCourse, TaskAction, TaskAssignee } from '../../types/courseTasks'
import { courses as homeCourses } from '../home/assigneeHomeMockData'
import { getToday } from '../home/dateUtils'
import { createLeaderHomeMockData } from '../home/leaderHomeMockData'
import { formatTaskDate, recalculateCourseTasks } from './courseTasksData'

export function createCourseTasksMockData(user: AuthUser) {
  const leaderMockData = createLeaderHomeMockData(user, getToday())
  const orgUnit = user.orgUnit ?? user.roles.find((role) => role.orgUnit)?.orgUnit
    ?? { id: 'mock-org-1', name: '조직 단위 1' }
  const areas = leaderMockData.areas
  const isAssignee = user.roles.some((role) => role.role === 'ASSIGNEE')
  const firstAssignee: TaskAssignee = isAssignee
    ? { id: user.id, name: user.name, status: 'ACTIVE' }
    : { id: 'mock-assignee-a', name: '담당자 A', status: 'ACTIVE' }
  const secondAssignee: TaskAssignee = { id: 'mock-assignee-b', name: '담당자 B', status: 'ACTIVE' }
  const otherAssignee: TaskAssignee = { id: 'mock-assignee-c', name: '담당자 C', status: 'ACTIVE' }
  const phases = [
    { id: 'phase-1', name: '단계 1 · 개강 준비', defaultOpen: true },
    { id: 'phase-2', name: '단계 2 · 운영', defaultOpen: true },
    { id: 'phase-3', name: '단계 3 · 수료', defaultOpen: false },
  ]
  const samples = [
    ...homeCourses.map((course) => ({ ...course, orgUnit })),
    ...leaderMockData.courses.filter((course) => !homeCourses.some((item) => item.id === course.id)),
  ]
  const courses: CourseTasksCourse[] = [
    ...samples.map((course) => ({
      ...course,
      ...(course.id === 'course-3' ? { startDate: '2026-10-05', endDate: '2027-01-29' } : {}),
      orgUnit: course.orgUnit,
      phases, archived: false, monthlyOffsetDays: 3,
      assignees: [
        { areaId: areas[0].id, users: [firstAssignee, secondAssignee] },
        { areaId: areas[1].id, users: [otherAssignee] },
      ],
      changeHistory: [
        { id: 'change-1', label: '시작일 변경', before: '2026-10-01', after: course.id === 'course-3' ? '2026-10-05' : course.startDate, actor: '관리자 A', createdAt: '2026-10-01T10:00:00+09:00' },
        { id: 'change-2', label: '종료일 변경', before: '2027-01-25', after: course.id === 'course-3' ? '2027-01-29' : course.endDate, actor: '관리자 A', createdAt: '2026-10-02T14:00:00+09:00' },
      ],
    })),
    {
      id: 'course-ended', businessName: '사업 1', name: '예시 과정 Z 1회차',
      startDate: '2026-03-02', endDate: '2026-08-30', orgUnit, phases: phases.map((phase) => ({ ...phase, defaultOpen: true })), archived: false, monthlyOffsetDays: 3,
      assignees: [{ areaId: areas[0].id, users: [firstAssignee, secondAssignee] }, { areaId: areas[1].id, users: [otherAssignee] }],
      changeHistory: [
        { id: 'ended-change-1', label: '시작일 변경', before: '2026-03-09', after: '2026-03-02', actor: '담당자 A', createdAt: '2026-03-04T14:12:00+09:00' },
        { id: 'ended-change-2', label: '종료일 정정', before: '2026-08-28', after: '2026-08-30', reason: '운영 일정표와 달라 정정', description: '미완료 할 일 마감 다시 계산', actor: '관리자 A', createdAt: '2026-11-06T10:40:00+09:00' },
        { id: 'ended-change-3', label: '담당자 교체 · 영역 2', before: '담당자 B(비활성)', after: '담당자 C', reason: '담당자 B 퇴사로 남은 할 일 인계', description: '미완료 2건 이동', actor: '관리자 A', createdAt: '2026-11-06T10:45:00+09:00' },
      ],
    },
  ]
  const documents = [{ id: 'document-a', title: '문서 A (v3)' }, { id: 'document-b', title: '문서 B · 21쪽' }]

  function action(type: TaskAction['type'], actor: TaskAction['actor'], createdAt: string, memo = ''): TaskAction {
    return { id: crypto.randomUUID(), type, actor, createdAt, memo }
  }

  const tasks = courses.flatMap((course) => {
    function task(letter: string, phase: number, offsetDays: number, extra: Partial<CourseTask> = {}): CourseTask {
      return {
        id: `${course.id}-task-${letter.toLowerCase()}`, courseId: course.id, title: `할 일 ${letter}`,
        phaseId: `phase-${phase}`, tag: '태그 1', areaId: areas[0].id, areaName: areas[0].name,
        assignees: [firstAssignee, secondAssignee], isMyArea: isAssignee,
        requiresReview: true, referenceType: 'COURSE_START', offsetDays, occurrenceNo: 0,
        dueDate: null, rawDueDate: null, shiftReasons: [], isCompleted: false,
        displayText: '시행자 표기 · 시스템 표기', actions: [], documents,
        ...extra,
      }
    }
    const completed = (assignee: TaskAssignee, date: string, memo = '') => ({
      isCompleted: true, completedBy: assignee.name,
      actions: [action('COMPLETE', { ...assignee, role: 'ASSIGNEE' }, date, memo)],
    })
    const items: CourseTask[] = [
      task('A', 1, 24),
      task('C', 1, 3, { referenceType: 'MONTH_END', occurrenceNo: 1 }),
      task('B', 1, 30, { tag: '태그 2', reviewStatus: 'pending', ...completed(firstAssignee, '2026-11-02T10:12:00+09:00', '서류 제출 완료') }),
      task('E', 1, 25, {
        reviewStatus: 'confirmed', isCompleted: true, completedBy: secondAssignee.name,
        actions: [
          action('COMPLETE', { ...secondAssignee, role: 'ASSIGNEE' }, '2026-10-30T15:40:00+09:00', '명단 확인함'),
          action('REVIEW', { id: 'mock-leader-b', name: '리더 B', role: 'LEADER' }, '2026-10-30T17:02:00+09:00'),
        ],
        mismatch: {
          reason: '템플릿 수정',
          changes: [{ label: '마감', before: formatTaskDate('2026-10-30'), after: formatTaskDate('2026-11-02') }],
        },
      }),
      task('F', 1, 23, { tag: '태그 2', areaId: areas[1].id, areaName: areas[1].name, assignees: [otherAssignee], isMyArea: false, requiresReview: false, ...completed(otherAssignee, '2026-10-28T09:00:00+09:00') }),
      task('G', 2, 38),
      task('H', 2, 39, { requiresReview: false, ...completed(firstAssignee, '2026-11-02T11:00:00+09:00') }),
      task('I', 2, 40, { requiresReview: false, ...completed(firstAssignee, '2026-11-02T12:00:00+09:00') }),
      task('K', 2, 52, { tag: '태그 2', areaId: areas[1].id, areaName: areas[1].name, assignees: [otherAssignee], isMyArea: false }),
      task('L', 3, -10, { referenceType: 'COURSE_END' }),
      task('M', 3, -5, { referenceType: 'COURSE_END', tag: '태그 2' }),
      task('N', 3, 0, { referenceType: 'COURSE_END' }),
      ...['A', 'B'].map((letter) => task(`상시-${letter}`, 0, 0, {
        title: `상시 업무 ${letter}`, referenceType: 'ALWAYS', requiresReview: false,
        phaseId: '', tag: '', displayText: '', documents: [],
      })),
    ]
    const endedTasks: Record<string, Partial<CourseTask>> = {
      '할 일 G': { title: '할 일 P', tag: '태그 2', referenceType: 'COURSE_END', offsetDays: -2 },
      '할 일 K': { title: '할 일 Q', tag: '태그 1', referenceType: 'COURSE_END', offsetDays: 2 },
      '할 일 L': { title: '할 일 M', offsetDays: 5 },
      '할 일 M': { title: '할 일 N', offsetDays: 12 },
      '할 일 N': { title: '할 일 O', offsetDays: 5, areaId: areas[1].id, areaName: areas[1].name, assignees: [otherAssignee], isMyArea: false },
    }
    const courseItems = course.id === 'course-ended' ? items.map((item) => {
      if (item.title !== '할 일 A' && item.title !== '할 일 C') return { ...item, ...endedTasks[item.title] }
      const completion = completed(firstAssignee, '2026-08-28T10:00:00+09:00')
      return { ...item, ...completion, reviewStatus: 'confirmed' as const, actions: [...completion.actions, action('REVIEW', { id: 'mock-leader-b', name: '리더 B', role: 'LEADER' }, '2026-08-28T11:00:00+09:00')] }
    }) : items
    return recalculateCourseTasks(course, courseItems, false)
  })

  return { courses, tasks }
}
