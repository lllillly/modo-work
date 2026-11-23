import { useCallback, useEffect, useRef, useState } from 'react'
import { Alert, App, Button, Card, Drawer, Result, Spin, Tag } from 'antd'
import { useOutletContext, useSearchParams } from 'react-router'

import { ApiError, getApiErrorMessage, isAuthStateError } from '../../api/client'
import { getCourse, getCourseOptions, getCourses, getScheduleContext, updateSchedule } from '../../api/courses'
import { getHomeCourses } from '../../api/home'
import { getOpenTaskIssues, getTaskIssue, resolveTaskIssue } from '../../api/taskIssues'
import {
  addTaskMemo,
  getCourseTasks,
  getTask,
  getTaskActions,
  getTaskMemos,
  processTask,
} from '../../api/tasks'
import useApiQuery from '../../hooks/useApiQuery'
import type { AppLayoutContext } from '../../layouts/AppLayout'
import { useAuth } from '../../providers/AuthContext'
import type { AuthUser } from '../../types/auth'
import type { CourseResponse } from '../../types/courseApi'
import type { TaskActionType } from '../../types/courseTasks'
import type { TaskResponse } from '../../types/taskApi'
import { getToday } from '../home/dateUtils'
import ApiCourseSelect from './components/ApiCourseSelect'
import CourseTasksEmpty from './components/CourseTasksEmpty'
import CourseTasksSkeleton from './components/CourseTasksSkeleton'
import CourseSchedule from './components/CourseSchedule'
import MonthlyWork from './components/MonthlyWork'
import TaskDetailDrawer from './components/TaskDetailDrawer'
import TaskPhaseList from './components/TaskPhaseList'
import { formatTaskDate } from './courseTasksData'
import FilterChip from '../../components/common/FilterChip'
import {
  getStoredMonthlyCycles,
  toCourseTask,
  toApiTaskView,
  toMemoActions,
  toTaskMismatch,
  toTaskActions,
  toTaskCourse,
} from './courseTasksApiData'

const notFound = (message: string) =>
  new ApiError(404, { code: 'NOT_FOUND', message, fieldErrors: [] })

const isAdmin = (user: AuthUser) => user.roles.some((role) => role.role === 'ADMIN')

function getVisibleCourses(user: AuthUser, businessId: string, signal: AbortSignal) {
  const isLeader = user.roles.some((role) => role.role === 'LEADER')
  const isAssignee = !isLeader || user.roles.some((role) => role.role === 'ASSIGNEE')
  return getHomeCourses(businessId, getToday(), { leader: isLeader, assignee: isAssignee }, signal)
}

async function getFirstAdminCourse(businessId: string, signal: AbortSignal) {
  const ongoing = await getCourses(businessId, 0, { progressStatus: 'ONGOING' }, signal)
  if (ongoing.items.length > 0) return ongoing.items[0]
  const all = await getCourses(businessId, 0, {}, signal)
  return all.items[0] ?? null
}

async function getTaskMismatch(businessId: string, courseId: string, taskId: string, signal: AbortSignal) {
  const issues = await getOpenTaskIssues(businessId, courseId, signal)
  const taskIssues = issues.filter((issue) => issue.taskId === taskId)
  if (taskIssues.length === 0) return undefined
  return toTaskMismatch(await Promise.all(taskIssues.map((issue) => getTaskIssue(issue.id, signal))))
}

function pickFirstCourse(courses: CourseResponse[]) {
  const today = getToday()
  return courses.find((course) => course.startDate <= today && course.endDate >= today) ?? courses[0] ?? null
}

export default function ApiCourseTasks({ user }: { user: AuthUser }) {
  const { selectedBusinessId, selectedBusiness, isMobile } = useOutletContext<AppLayoutContext>()
  const [params] = useSearchParams()
  const courseId = params.get('courseId')
  const businessId = selectedBusinessId ?? ''
  const admin = isAdmin(user)
  const loadCourses = useCallback(
    (signal: AbortSignal) => getVisibleCourses(user, businessId, signal),
    [user, businessId],
  )
  const courses = useApiQuery(businessId && !admin ? `courses:${businessId}` : null, loadCourses)

  if (!selectedBusinessId) return <Result title="선택할 수 있는 사업이 없어요" />
  if (!admin && !courses.data) {
    if (!courses.error) return <CourseTasksSkeleton />
    return (
      <Result
        status="warning"
        title="과정을 불러오지 못했어요"
        subTitle={getApiErrorMessage(courses.error)}
        extra={<Button onClick={courses.reload}>다시 시도</Button>}
      />
    )
  }
  if (!courseId) return <FirstCourse key={selectedBusinessId} businessId={selectedBusinessId} courses={courses.data} />
  return (
    <CourseContent
      key={`${selectedBusinessId}:${courseId}`}
      businessId={selectedBusinessId}
      businessName={selectedBusiness}
      courseId={courseId}
      courses={courses.data}
      isMobile={isMobile}
      user={user}
    />
  )
}

function FirstCourse({ businessId, courses }: { businessId: string; courses?: CourseResponse[] }) {
  const [params, setParams] = useSearchParams()
  const load = useCallback((signal: AbortSignal) => getFirstAdminCourse(businessId, signal), [businessId])
  const query = useApiQuery(courses ? null : `first-course:${businessId}`, load)
  const first = courses ? pickFirstCourse(courses) : query.data

  useEffect(() => {
    if (!first) return
    const next = new URLSearchParams(params)
    next.set('courseId', first.id)
    setParams(next, { replace: true })
  }, [first, params, setParams])

  if (query.error) {
    return (
      <Result
        status="warning"
        title="과정을 불러오지 못했어요"
        subTitle={getApiErrorMessage(query.error)}
        extra={<Button onClick={query.reload}>다시 시도</Button>}
      />
    )
  }
  if (first === null) return <Result title="볼 수 있는 과정이 없어요" />
  return <CourseTasksSkeleton />
}

type CourseContentProps = {
  businessId: string
  businessName: string
  courseId: string
  courses?: CourseResponse[]
  isMobile: boolean
  user: AuthUser
}

function CourseContent({ businessId, businessName, courseId, courses, isMobile, user }: CourseContentProps) {
  const { message } = App.useApp()
  const { refreshUser } = useAuth()
  const [params, setParams] = useSearchParams()
  const [tag, setTag] = useState('all')
  const [showMonthly, setShowMonthly] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const saving = useRef(false)
  const admin = isAdmin(user)
  const load = useCallback(
    async (signal: AbortSignal) => {
      const [course, adminOrgUnits, schedule, tasks] = await Promise.all([
        admin ? getCourse(courseId, signal).then((detail) => detail.course) : null,
        admin ? getCourseOptions(businessId, signal).then((items) => items.orgUnits) : undefined,
        getScheduleContext(courseId, signal).catch((error: unknown) => {
          if (error instanceof ApiError && error.status === 403) return null
          throw error
        }),
        getCourseTasks({ businessId, courseId }, signal),
      ])
      if (course && course.businessId !== businessId) throw notFound('선택한 사업의 과정이 아니에요.')
      if (course && schedule && course.version !== schedule.course.version) {
        throw new ApiError(409, {
          code: 'CONFLICT',
          message: '과정이 변경됐어요. 다시 불러와 주세요.',
          fieldErrors: [],
        })
      }
      const orgUnits = adminOrgUnits ?? tasks.map((task) => ({ id: task.orgUnitId, name: task.orgUnitName }))
      return { course, orgUnits, schedule, tasks }
    },
    [admin, businessId, courseId],
  )
  const query = useApiQuery(`${businessId}:${courseId}`, load)
  const taskId = params.get('taskId')
  const loadDetail = useCallback(
    async (signal: AbortSignal) => {
      if (!taskId) throw new Error('할 일을 먼저 선택해 주세요.')

      const { task } = await getTask(taskId, signal)
      if (task.businessId !== businessId || task.courseId !== courseId) throw notFound('이 과정의 할 일이 아니에요.')
      if (task.referenceType === 'ALWAYS') {
        const memos = await getTaskMemos(task.id, signal)
        return { task, actions: toMemoActions(memos) }
      }
      const [actions, mismatch] = await Promise.all([
        getTaskActions(task.id, signal),
        task.canReviewInArea ? getTaskMismatch(businessId, courseId, task.id, signal) : undefined,
      ])
      return { task, actions: toTaskActions(actions), mismatch }
    },
    [taskId, businessId, courseId],
  )
  const detail = useApiQuery(taskId ? `${businessId}:${courseId}:${taskId}` : null, loadDetail)

  function selectTask(id: string | null) {
    const next = new URLSearchParams(params)
    if (id) next.set('taskId', id)
    else next.delete('taskId')
    setParams(next)
  }

  function reload() {
    setSaveError('')
    query.reload()
    detail.reload()
  }

  async function performAction(id: string, type: TaskActionType, memo: string) {
    if (saving.current || saveError || !query.data) return
    const task =
      detail.data?.task.id === id ? detail.data.task : query.data.tasks.find((item) => item.id === id)
    if (!task || type === 'UPDATE_MEMO') return

    saving.current = true
    setIsSaving(true)
    try {
      const requestId = crypto.randomUUID()
      let updated: TaskResponse | undefined
      if (type === 'MEMO') {
        await addTaskMemo(id, requestId, memo.trim())
      } else {
        const targetActionLogId =
          type === 'CANCEL_COMPLETION'
            ? task.completionActionLogId
            : type === 'CANCEL_REVIEW'
              ? task.reviewActionLogId
              : null
        const response = await processTask(id, type, {
          version: task.version,
          requestId,
          memo: memo.trim(),
          ...(targetActionLogId ? { targetActionLogId } : {}),
        })
        updated = response.task
      }
      if (updated?.supersededByTaskId) {
        message.success('완료를 취소했어요. 바뀐 기준의 할 일을 열었어요.')
        selectTask(updated.supersededByTaskId)
      } else if (updated?.isReadOnly) {
        message.success('완료를 취소했어요. 바뀐 기준의 할 일은 목록에서 확인해 주세요.')
        selectTask(null)
      } else {
        message.success('처리 내용을 저장했어요.')
      }
      reload()
    } catch (error) {
      setSaveError(getApiErrorMessage(error))
      if (isAuthStateError(error)) void refreshUser()
      throw error
    } finally {
      saving.current = false
      setIsSaving(false)
    }
  }

  async function resolveMismatch(issueIds: string[]) {
    if (saving.current || saveError) return
    saving.current = true
    setIsSaving(true)
    try {
      for (const id of issueIds) await resolveTaskIssue(id)
      message.success('변경 사항을 확인했어요.')
      detail.reload()
    } catch (error) {
      if (isAuthStateError(error)) void refreshUser()
      throw error
    } finally {
      saving.current = false
      setIsSaving(false)
    }
  }

  async function saveSchedule(startDate: string, endDate: string) {
    if (!query.data?.schedule || saving.current || saveError) throw new Error('최신 내용을 먼저 확인해 주세요.')
    saving.current = true
    setIsSaving(true)
    try {
      await updateSchedule(courseId, query.data.schedule.course.version, startDate, endDate)
      message.success('일정을 변경했어요.')
      reload()
    } catch (error) {
      setSaveError(getApiErrorMessage(error))
      if (isAuthStateError(error)) void refreshUser()
      throw error
    } finally {
      saving.current = false
      setIsSaving(false)
    }
  }

  if (query.isLoading) return <CourseTasksSkeleton />
  if (query.error || !query.data) {
    return (
      <Result
        status="warning"
        title="과정을 불러오지 못했어요"
        subTitle={getApiErrorMessage(query.error)}
        extra={<Button onClick={reload}>다시 시도</Button>}
      />
    )
  }

  const { tasks: responses, orgUnits, schedule } = query.data
  const listed = courses?.find((item) => item.id === courseId)
  const response = query.data.course ?? (listed && schedule ? { ...listed, ...schedule.course } : listed)
  if (!response || response.businessId !== businessId) {
    return <Result status="warning" title="이 사업에서 볼 수 있는 과정이 아니에요" />
  }
  const course = toTaskCourse(response, businessName, orgUnits, responses)
  const today = getToday()
  const tasks = responses.map((task) => toApiTaskView(toCourseTask(task), course.name, today))
  const alwaysTasks = tasks.filter((task) => task.referenceType === 'ALWAYS')
  const tags = [...new Set(responses.flatMap((task) => task.tags.map((item) => item.name)))]
  const visibleTasks = responses
    .filter((task) =>
      task.referenceType !== 'ALWAYS' &&
      (tag === 'all' || task.tags.some((item) => item.name === tag)),
    )
    .map((task) => toApiTaskView(toCourseTask(task), course.name, today))
  const cycles = getStoredMonthlyCycles(responses)
  const monthlyWork = (
    <MonthlyWork
      cycles={cycles}
      tasks={alwaysTasks}
      today={today}
      courseEndDate={course.endDate}
      onOpenTask={(id) => {
        setShowMonthly(false)
        selectTask(id)
      }}
    />
  )
  const selectedTask =
    detail.data && toApiTaskView(
      { ...toCourseTask(detail.data.task, detail.data.actions), mismatch: detail.data.mismatch },
      course.name,
      today,
    )
  const mismatchIds = selectedTask?.mismatch?.issueIds

  const courseSelector = (
    <div className="flex flex-wrap items-center gap-xs">
      <ApiCourseSelect
        businessId={businessId}
        courseId={courseId}
        courseName={course.name}
        courses={courses}
        onChange={(id) => {
          const next = new URLSearchParams(params)
          next.set('courseId', id)
          next.delete('taskId')
          setParams(next)
        }}
      />
      <span className="text-caption text-(--ant-color-text-secondary)">
        {course.orgUnit.name} · {response.lengthType === 'LONG' ? '장기' : '단기'}
      </span>
      <Tag variant="outlined">
        {course.endDate < today ? '종료' : course.startDate > today ? '예정' : '진행 중'}
      </Tag>
    </div>
  )
  const courseSchedule = (
    <CourseSchedule
      key={response.version}
      course={course}
      isMobile={isMobile}
      remote
      canEdit={!!schedule?.permissions.canEditSchedule}
      onSave={saveSchedule}
    />
  )
  const currentCycles = cycles.filter((cycle) => cycle.startDate <= today && cycle.endDate >= today)
  const currentCycle = currentCycles[0]
  const currentDeadlines = [...new Set(currentCycles.map((cycle) => formatTaskDate(cycle.dueDate)))]
  let cycleDescription = '현재 진행 중인 주기가 없어요.'
  if (currentCycle) {
    const start = formatTaskDate(currentCycle.startDate).split('(')[0]
    const end = formatTaskDate(currentCycle.endDate).split('(')[0]
    cycleDescription = `${start} ~ ${end} · 주기 할 일 마감 ${currentDeadlines.join(', ')}`
  } else if (cycles.length === 0) {
    cycleDescription = '월 주기 업무가 없어요.'
  } else if (course.endDate < today) {
    cycleDescription = '모든 주기가 종료됐어요.'
  }

  return (
    <div className="flex min-w-0 flex-col gap-sm min-[992px]:gap-md">
      {isMobile ? (
        <Card
          variant="borderless"
          className="shadow-none"
          classNames={{ body: 'flex flex-col gap-sm p-md' }}
        >
          {courseSelector}
          {courseSchedule}
        </Card>
      ) : (
        <>
          {courseSelector}
          {courseSchedule}
        </>
      )}
      {course.endDate < today && (
        <Alert
          type="info"
          title="종료된 과정이에요. 일정과 과정 정보는 바꿀 수 없지만, 남은 할 일은 계속 처리할 수 있어요."
        />
      )}
      {saveError && (
        <Alert
          type="error"
          showIcon
          title={saveError}
          action={<Button onClick={reload}>최신 내용 불러오기</Button>}
        />
      )}
      {isMobile && tasks.length > 0 && (
        <Card variant="borderless" className="shadow-none" classNames={{ body: 'min-h-[110px] p-md' }}>
          <h3 className="m-0 text-body leading-5 font-medium">
            월 주기
            {currentCycle && <span className="ml-xs text-caption text-(--ant-color-primary-text)">현재</span>}
          </h3>
          <p className="mt-xs mb-0 text-caption text-(--ant-color-text-secondary)">
            {cycleDescription}
          </p>
          <div className="mt-xs flex items-center justify-between gap-xs">
            <span className="text-caption text-(--ant-color-text-secondary)">
              상시 업무 {alwaysTasks.length}
            </span>
            <Button type="link" className="hit-area h-auto p-0 text-caption" onClick={() => setShowMonthly(true)}>
              월 주기·상시 업무 보기
            </Button>
          </div>
        </Card>
      )}
      {tasks.length === 0 ? (
        <CourseTasksEmpty />
      ) : (
        <div className="grid grid-cols-1 items-start gap-md min-[1200px]:grid-cols-[minmax(0,1fr)_320px] min-[1280px]:grid-cols-[minmax(0,1fr)_400px]">
          <div
            className={isMobile ? 'min-w-0' : 'min-w-0 rounded-lg bg-(--ant-color-bg-container) p-lg'}
          >
            <div className="mb-sm flex flex-wrap items-center gap-xs">
              {['all', ...tags].map((item) => (
                <FilterChip key={item} selected={tag === item} onClick={() => setTag(item)}>
                  {item === 'all' ? '전체' : item}
                </FilterChip>
              ))}
              <span className="ml-auto text-caption">
                전체 {visibleTasks.length} · 완료{' '}
                {visibleTasks.filter((task) => task.isCompleted).length}
              </span>
            </div>
            <TaskPhaseList
              course={course}
              tasks={visibleTasks}
              user={user}
              isMobile={isMobile}
              disabled={isSaving || !!saveError}
              onOpenTask={selectTask}
              onComplete={(id) => {
                void performAction(id, 'COMPLETE', '').catch(() => {})
              }}
            />
          </div>
          {!isMobile && (
            <Card variant="borderless" classNames={{ body: 'p-lg' }}>
              {monthlyWork}
            </Card>
          )}
        </div>
      )}
      <Drawer
        open={showMonthly && isMobile}
        title="월 주기와 상시 업무"
        placement="bottom"
        size="80%"
        onClose={() => setShowMonthly(false)}
        closable={{ placement: 'end' }}
      >
        {monthlyWork}
      </Drawer>
      {taskId && detail.isLoading && <Spin aria-label="할 일 상세 불러오는 중" />}
      {taskId && !!detail.error && (
        <Alert
          type="error"
          showIcon
          title={getApiErrorMessage(detail.error)}
          action={
            <>
              <Button onClick={detail.reload}>다시 시도</Button>
              <Button onClick={() => selectTask(null)}>닫기</Button>
            </>
          }
        />
      )}
      {selectedTask && (
        <TaskDetailDrawer
          key={selectedTask.id}
          task={selectedTask}
          course={course}
          user={user}
          isMobile={isMobile}
          isProcessing={isSaving || !!saveError}
          onClose={() => selectTask(null)}
          onReload={reload}
          onAction={(type, memo) => performAction(selectedTask.id, type, memo)}
          onResolveMismatch={mismatchIds ? () => resolveMismatch(mismatchIds) : undefined}
        />
      )}
    </div>
  )
}
