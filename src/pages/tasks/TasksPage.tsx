import { useState } from 'react'
import { Alert, App, Button, Card, Drawer, Select, Tag } from 'antd'
import { useOutletContext, useSearchParams } from 'react-router'

import type { AppLayoutContext } from '../../layouts/AppLayout'
import type { AuthUser } from '../../types/auth'
import type { TaskActionType } from '../../types/courseTasks'

import { useAuth } from '../../providers/AuthContext'
import { getToday } from '../home/dateUtils'
import HomeError from '../home/components/AssigneeHomeError'
import {
  applyTaskAction, canViewCourse, formatTaskDate, getCourseDays,
  getCourseTaskView, getMonthlyCycles, getTaskPermissions, recalculateCourseTasks,
} from './courseTasksData'
import { createCourseTasksMockData } from './courseTasksMockData'

import CourseSchedule from './components/CourseSchedule'
import CourseTasksEmpty from './components/CourseTasksEmpty'
import CourseTasksSkeleton from './components/CourseTasksSkeleton'
import MonthlyWork from './components/MonthlyWork'
import TaskDetailDrawer from './components/TaskDetailDrawer'
import TaskPhaseList from './components/TaskPhaseList'

export default function TasksPage() {
  const { user } = useAuth()
  return user ? <CourseTasksContent key={user.id} user={user} /> : null
}

function CourseTasksContent({ user }: { user: AuthUser }) {
  const { isMobile, selectedBusiness } = useOutletContext<AppLayoutContext>()
  const { message } = App.useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const [data, setData] = useState(() => createCourseTasksMockData(user))
  const [tagFilter, setTagFilter] = useState('all')
  const [showMonthlyWork, setShowMonthlyWork] = useState(false)

  const today = getToday()
  const preview = searchParams.get('preview')

  const courses = data.courses.filter((course) => course.businessName === selectedBusiness && canViewCourse(user, course))
  const requestedCourseId = searchParams.get('courseId') ?? (preview === 'ended' ? 'course-ended' : null)
  const selectedCourse = requestedCourseId ? courses.find((item) => item.id === requestedCourseId) : courses.find((item) => item.id === 'course-3') ?? courses[0]

  function updateSearchParams(values: Record<string, string | null>, options?: { replace?: boolean }) {
    const next = new URLSearchParams(searchParams)

    for (const [key, value] of Object.entries(values)) {
      if (value === null) {
        next.delete(key)
      } else {
        next.set(key, value)
      }
    }

    setSearchParams(next, options)
  }

  function changeCourse(courseId: string) {
    updateSearchParams({ courseId, taskId: null, preview: null })
    setTagFilter('all')
  }

  function closeTask() {
    updateSearchParams({ taskId: null }, { replace: true })
  }

  if (!selectedCourse) return <CourseTasksEmpty />

  const course = selectedCourse
  const tasks = preview === 'empty' ? [] : data.tasks
  const courseTasks = tasks
    .filter((task) =>
      task.courseId === course.id && getTaskPermissions(user, course, task).canView,
    )
    .map((task) => getCourseTaskView(task, course, user, today))
  const normalTasks = courseTasks.filter((task) => task.referenceType !== 'ALWAYS')
  const alwaysTasks = courseTasks.filter((task) => task.referenceType === 'ALWAYS')
  const visibleTasks = tagFilter === 'all' ? normalTasks : normalTasks.filter((task) => task.tag === tagFilter)
  const selectedTask = courseTasks.find((task) => task.id === searchParams.get('taskId'))
  const tags = [...new Set(normalTasks.map((task) => task.tag).filter(Boolean))]

  const cycles = getMonthlyCycles(course.startDate, course.endDate, course.monthlyOffsetDays)
  const currentCycle = cycles.find((cycle) => cycle.startDate <= today && cycle.endDate >= today)

  const isEnded = course.endDate < today
  const isAdmin = user.roles.some((role) => role.role === 'ADMIN')
  const isAssignedAssignee = user.roles.some((role) => role.role === 'ASSIGNEE')
    && course.assignees.some((assignment) => assignment.users.some((assignee) => assignee.id === user.id))
  const isOrgLeader = user.roles.some((role) =>
    role.role === 'LEADER' && role.leaderType === 'ORG_UNIT' && role.orgUnit?.id === course.orgUnit.id,
  )
  const canEditSchedule = !isEnded && !course.archived && (isAdmin || isAssignedAssignee || isOrgLeader)

  const isLoading = preview === 'loading'
  const isError = preview === 'error'
  const isEmpty = courseTasks.length === 0

  function openTask(taskId: string) {
    updateSearchParams({ courseId: course.id, taskId })
  }

  function processTask(taskId: string, type: TaskActionType, memo: string) {
    const task = data.tasks.find((item) => item.id === taskId)
    if (!task) return

    const nextTask = applyTaskAction(task, course, user, type, memo)
    if (nextTask === task) return

    setData((current) => ({ ...current, tasks: current.tasks.map((item) => item.id === taskId ? nextTask : item) }))
    message.success('처리 내용을 저장했어요.')
  }

  function saveSchedule(startDate: string, endDate: string, reason: string) {
    if (!canEditSchedule || startDate > endDate) return
    if (startDate === course.startDate && endDate === course.endDate) return

    const scheduleChanges = [
      { before: course.startDate, after: startDate, label: '시작일 변경' },
      { before: course.endDate, after: endDate, label: '종료일 변경' },
    ]
    const changes = scheduleChanges
      .filter((change) => change.before !== change.after)
      .map((change) => ({
        ...change,
        id: crypto.randomUUID(),
        reason: reason.trim(),
        description: '미완료 할 일 마감 다시 계산',
        actor: user.name,
        createdAt: new Date().toISOString(),
      }))

    const updatedCourse = {
      ...course, startDate, endDate,
      changeHistory: [...course.changeHistory, ...changes],
    }

    setData((current) => ({
      courses: current.courses.map((item) => item.id === course.id ? updatedCourse : item),
      tasks: recalculateCourseTasks(updatedCourse, current.tasks),
    }))
    message.success('일정을 변경했어요. 완료 기록은 유지돼요.')
  }

  function retry() {
    updateSearchParams({ preview: null }, { replace: true })
  }

  const courseSelector = (
    <div className="flex flex-wrap items-center gap-xs min-[992px]:gap-sm">
      <Select aria-label="과정 선택" value={course.id} onChange={changeCourse}
        className="h-10 w-full min-[992px]:h-9 min-[992px]:w-[320px]" options={courses.map((item) => ({ value: item.id, label: item.name }))} />
      <span className="text-caption text-(--ant-color-text-secondary)">{!isMobile && `${selectedBusiness} · `}{course.orgUnit.name} · {getCourseDays(course) >= 180 ? '장기' : '단기'}{!isMobile && ` (${getCourseDays(course)}일)`}</span>
      <Tag color={isEnded ? undefined : 'processing'} variant="outlined" className="m-0">{isEnded ? '종료' : course.startDate > today ? '시작 전' : '진행 중'}</Tag>
    </div>
  )

  const schedule = <CourseSchedule key={course.id} course={course} isMobile={isMobile} canEdit={canEditSchedule} onSave={saveSchedule} />

  const monthlyWork = <MonthlyWork cycles={cycles} tasks={alwaysTasks} today={today} courseEndDate={course.endDate} offsetDays={course.monthlyOffsetDays} onOpenTask={(taskId) => { setShowMonthlyWork(false); openTask(taskId) }} />

  const filters = (
    <div className="flex flex-wrap items-center gap-xs">
      {['all', ...tags].map((tag) => <Button key={tag} shape="round" color={tagFilter === tag ? 'primary' : 'default'} variant="outlined" aria-pressed={tagFilter === tag}
        onClick={() => setTagFilter(tag)} className={`h-8 px-md shadow-none ${tagFilter === tag ? 'bg-(--ant-color-primary-bg)' : ''}`}>{tag === 'all' ? '전체' : tag}</Button>)}
      {!isMobile && <span className="ml-auto text-caption text-(--ant-color-text-secondary)">전체 {visibleTasks.length} · 완료 {visibleTasks.filter((task) => task.isCompleted).length}</span>}
    </div>
  )

  return (
    <div className="flex min-w-0 flex-col gap-sm min-[992px]:gap-md">
      {isMobile ? <Card variant="borderless" className="shadow-none" classNames={{ body: 'flex flex-col gap-sm p-md' }}>{courseSelector}{schedule}</Card> : <>{courseSelector}</>}
      {isEnded && <Alert type="info" className="py-2.5" title="종료된 과정이에요. 일정과 과정 정보는 바꿀 수 없지만, 남은 할 일은 계속 처리할 수 있어요." classNames={{ title: 'text-caption text-(--ant-color-info)' }} />}
      {!isMobile && schedule}

      {isLoading ? <CourseTasksSkeleton /> : isError ? <HomeError onRetry={retry} /> : isEmpty ? <CourseTasksEmpty /> : (
        <>
          {isMobile && <Card variant="borderless" className="shadow-none" classNames={{ body: 'min-h-[110px] p-md' }}>
            <h3 className="m-0 text-body leading-5 font-medium">월 주기 {currentCycle ? `${currentCycle.number} / ${cycles.length}` : cycles.length}{currentCycle && <span className="ml-xs text-caption text-(--ant-color-primary)">현재</span>}</h3>
            <p className="mt-xs mb-0 text-caption leading-[18px] text-(--ant-color-text-secondary)">{currentCycle ? `${formatTaskDate(currentCycle.startDate).split('(')[0]} ~ ${formatTaskDate(currentCycle.endDate).split('(')[0]} · 주기 할 일 마감 ${formatTaskDate(currentCycle.dueDate)}`
              : isEnded ? '모든 주기가 종료됐어요.' : '아직 시작하지 않은 과정이에요.'}</p>
            <div className="mt-xs flex items-center justify-between gap-xs"><span className="text-caption leading-[18px] text-(--ant-color-text-secondary)">상시 업무 {alwaysTasks.length}</span><Button type="link" className="h-auto p-0 text-caption leading-[18px]"
              onClick={() => setShowMonthlyWork(true)}>월 주기·상시 업무 보기</Button></div>
          </Card>}

          <div className="grid grid-cols-1 items-start gap-md min-[992px]:grid-cols-[minmax(0,1fr)_320px] min-[1280px]:grid-cols-[minmax(0,1fr)_400px]">
            <div className={`min-w-0 ${isMobile ? '' : 'rounded-lg bg-(--ant-color-bg-container) p-lg'}`}>
              <div className="mb-sm min-[992px]:mb-lg">{filters}</div>
              <TaskPhaseList key={`${course.id}-${selectedBusiness}-${isMobile}`} course={course} tasks={visibleTasks} user={user} isMobile={isMobile} onOpenTask={openTask} onComplete={(taskId) => processTask(taskId, 'COMPLETE', '')} />
            </div>
            {!isMobile && <Card variant="borderless" className="min-w-0 shadow-none" classNames={{ body: 'p-lg' }}>{monthlyWork}</Card>}
          </div>
        </>
      )}

      <Drawer open={showMonthlyWork && isMobile} title="월 주기와 상시 업무" placement="bottom" size="80%" closable={{ placement: 'end' }} onClose={() => setShowMonthlyWork(false)} classNames={{ header: 'px-md py-md', body: 'p-md' }}>{monthlyWork}</Drawer>
      {selectedTask && !isLoading && !isError && !isEmpty && <TaskDetailDrawer key={selectedTask.id} task={selectedTask} course={course} user={user} isMobile={isMobile} onClose={closeTask} onAction={(type, memo) => processTask(selectedTask.id, type, memo)} />}
      {searchParams.has('taskId') && !selectedTask && !isLoading && !isError && !isEmpty && <Alert type="info" title="이 할 일을 조회할 수 없어요." action={<Button size="small" onClick={closeTask}>닫기</Button>} />}
    </div>
  )
}
