import { useCallback, useRef, useState } from 'react'
import { Alert, App, Button, Card, Drawer, Result, Spin, Tag } from 'antd'
import { Link, useOutletContext, useSearchParams } from 'react-router'

import { ApiError, getApiErrorMessage, isAuthStateError } from '../../api/client'
import { getCourse, getCourseOptions, getScheduleContext, updateSchedule } from '../../api/courses'
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
import type { TaskActionType } from '../../types/courseTasks'
import { getToday } from '../home/dateUtils'
import ApiCourseSelect from './components/ApiCourseSelect'
import CourseTasksEmpty from './components/CourseTasksEmpty'
import CourseTasksSkeleton from './components/CourseTasksSkeleton'
import CourseSchedule from './components/CourseSchedule'
import MonthlyWork from './components/MonthlyWork'
import TaskDetailDrawer from './components/TaskDetailDrawer'
import TaskPhaseList from './components/TaskPhaseList'
import { formatTaskDate } from './courseTasksData'
import {
  getStoredMonthlyCycles,
  toCourseTask,
  toApiTaskView,
  toMemoActions,
  toTaskActions,
  toTaskCourse,
} from './courseTasksApiData'

// S10에서 저장한 실제 과정만 연결하며 기존 목업 확인 화면과 데이터를 섞지 않음
export default function ApiCourseTasks({ user }: { user: AuthUser }) {
  const { selectedBusinessId, selectedBusiness, isMobile } = useOutletContext<AppLayoutContext>()
  const [params] = useSearchParams()
  const courseId = params.get('courseId')

  if (!courseId || !selectedBusinessId) {
    return <Result title="과정을 선택해 주세요" extra={<Link to="/admin/courses">과정 목록으로</Link>} />
  }
  return (
    <CourseContent
      key={`${selectedBusinessId}:${courseId}`}
      businessId={selectedBusinessId}
      businessName={selectedBusiness}
      courseId={courseId}
      isMobile={isMobile}
      user={user}
    />
  )
}

type CourseContentProps = {
  businessId: string
  businessName: string
  courseId: string
  isMobile: boolean
  user: AuthUser
}

function CourseContent({ businessId, businessName, courseId, isMobile, user }: CourseContentProps) {
  const { message } = App.useApp()
  const { refreshUser } = useAuth()
  const [params, setParams] = useSearchParams()
  const [tag, setTag] = useState('all')
  const [showMonthly, setShowMonthly] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const saving = useRef(false)
  const load = useCallback(
    async (signal: AbortSignal) => {
      const [detail, options, schedule, tasks] = await Promise.all([
        getCourse(courseId, signal),
        getCourseOptions(businessId, signal),
        getScheduleContext(courseId, signal),
        getCourseTasks({ businessId, courseId }, signal),
      ])
      if (detail.course.businessId !== businessId) {
        throw new ApiError(404, {
          code: 'NOT_FOUND',
          message: '선택한 사업의 과정이 아니에요.',
          fieldErrors: [],
        })
      }
      if (detail.course.version !== schedule.course.version) {
        throw new ApiError(409, {
          code: 'CONFLICT',
          message: '과정이 변경됐어요. 다시 불러와 주세요.',
          fieldErrors: [],
        })
      }
      return { course: detail.course, options, schedule, tasks }
    },
    [businessId, courseId],
  )
  const query = useApiQuery(`${businessId}:${courseId}`, load)
  const taskId = params.get('taskId')
  const loadDetail = useCallback(
    async (signal: AbortSignal) => {
      if (!taskId) throw new Error('할 일을 먼저 선택해 주세요.')

      const { task } = await getTask(taskId, signal)
      if (task.businessId !== businessId || task.courseId !== courseId) {
        throw new ApiError(404, {
          code: 'NOT_FOUND',
          message: '이 과정의 할 일이 아니에요.',
          fieldErrors: [],
        })
      }
      if (task.referenceType === 'ALWAYS') {
        const memos = await getTaskMemos(task.id, signal)
        return { task, actions: toMemoActions(memos) }
      }
      const actions = await getTaskActions(task.id, signal)
      return { task, actions: toTaskActions(actions) }
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
      if (type === 'MEMO') {
        await addTaskMemo(id, requestId, memo.trim())
      } else {
        const targetActionLogId =
          type === 'CANCEL_COMPLETION'
            ? task.completionActionLogId
            : type === 'CANCEL_REVIEW'
              ? task.reviewActionLogId
              : null
        await processTask(id, type, {
          version: task.version,
          requestId,
          memo: memo.trim(),
          ...(targetActionLogId ? { targetActionLogId } : {}),
        })
      }
      message.success('처리 내용을 저장했어요.')
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

  async function saveSchedule(startDate: string, endDate: string) {
    if (!query.data || saving.current || saveError) throw new Error('최신 내용을 먼저 확인해 주세요.')
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

  const { course: response, tasks: responses, options, schedule } = query.data
  const course = toTaskCourse(response, businessName, options.orgUnits, responses)
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
    detail.data && toApiTaskView(toCourseTask(detail.data.task, detail.data.actions), course.name, today)

  const courseSelector = (
    <div className="flex flex-wrap items-center gap-xs">
      <ApiCourseSelect
        businessId={businessId}
        courseId={courseId}
        courseName={course.name}
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
      canEdit={schedule.permissions.canEditSchedule}
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
            {currentCycle && <span className="ml-xs text-caption text-(--ant-color-primary)">현재</span>}
          </h3>
          <p className="mt-xs mb-0 text-caption text-(--ant-color-text-secondary)">
            {cycleDescription}
          </p>
          <div className="mt-xs flex items-center justify-between gap-xs">
            <span className="text-caption text-(--ant-color-text-secondary)">
              상시 업무 {alwaysTasks.length}
            </span>
            <Button type="link" className="h-auto p-0 text-caption" onClick={() => setShowMonthly(true)}>
              월 주기·상시 업무 보기
            </Button>
          </div>
        </Card>
      )}
      {tasks.length === 0 ? (
        <CourseTasksEmpty />
      ) : (
        <div className="grid grid-cols-1 items-start gap-md min-[992px]:grid-cols-[minmax(0,1fr)_320px] min-[1280px]:grid-cols-[minmax(0,1fr)_400px]">
          <div
            className={isMobile ? 'min-w-0' : 'min-w-0 rounded-lg bg-(--ant-color-bg-container) p-lg'}
          >
            <div className="mb-sm flex flex-wrap items-center gap-xs">
              {['all', ...tags].map((item) => (
                <Button
                  key={item}
                  shape="round"
                  color={tag === item ? 'primary' : 'default'}
                  variant="outlined"
                  aria-pressed={tag === item}
                  onClick={() => setTag(item)}
                >
                  {item === 'all' ? '전체' : item}
                </Button>
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
        />
      )}
    </div>
  )
}
