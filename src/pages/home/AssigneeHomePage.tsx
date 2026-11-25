import { useCallback, useRef, useState } from 'react'
import { Alert, App, Button, Card, Segmented, Skeleton, Tag } from 'antd'
import { useOutletContext } from 'react-router'

import { getAssigneeHome } from '../../api/home'
import { getTasksDueOn, processTask } from '../../api/tasks'
import useApiQuery from '../../hooks/useApiQuery'
import type { AppLayoutContext } from '../../layouts/AppLayout'
import { useAuth } from '../../providers/AuthContext'
import type { ViewScope } from '../../types/home'
import type { AssigneeHomeResponse } from '../../types/homeApi'
import type { TaskResponse } from '../../types/taskApi'
import { getAssigneeHomeData } from './assigneeHomeData'

import AssigneeHomeSkeleton from './components/AssigneeHomeSkeleton'
import LoadingError from '../../components/common/LoadingError'
import CourseList from './components/CourseList'
import HomeCalendar from './components/HomeCalendar'
import TaskList from './components/TaskList'
import PageTitle from '../../components/layout/PageTitle'
import EmptyData from '../../components/common/EmptyData'
import ContentCard from '../../components/common/ContentCard'
import useApiErrorHandler from '../../hooks/useApiErrorHandler'
import { formatSelectedDate, getToday } from '../../utils/date'

export default function AssigneeHomePage() {
  const { isMobile, selectedBusiness, selectedBusinessId, userName } = useOutletContext<AppLayoutContext>()
  const { user } = useAuth()
  const { showError } = useApiErrorHandler()
  const { message } = App.useApp()
  const today = getToday()

  const [selectedDate, setSelectedDate] = useState(today)
  const [month, setMonth] = useState(today.slice(0, 7))
  const [viewScope, setViewScope] = useState<ViewScope>('mine')
  const [showAllAlerts, setShowAllAlerts] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [shown, setShown] = useState<{
    businessId: string
    home?: AssigneeHomeResponse
    day?: { key: string; tasks: TaskResponse[] }
  }>()
  const saving = useRef(false)

  const canViewAll = user?.areas.length === 1 && user.areas[0].allowCrossAreaView
  const scope = canViewAll ? viewScope : 'mine'
  const businessId = selectedBusinessId ?? ''

  const loadHome = useCallback(
    (signal: AbortSignal) => getAssigneeHome({ businessId, scope, selectedDate, month }, signal),
    [businessId, scope, selectedDate, month],
  )
  const loadDayTasks = useCallback(
    (signal: AbortSignal) => getTasksDueOn(businessId, scope, selectedDate, signal),
    [businessId, scope, selectedDate],
  )
  const home = useApiQuery(
    businessId ? `assignee-home:${businessId}:${scope}:${selectedDate}:${month}:${refreshKey}` : null,
    loadHome,
  )
  const dayTasks = useApiQuery(
    businessId ? `day-tasks:${businessId}:${scope}:${selectedDate}:${refreshKey}` : null,
    loadDayTasks,
  )

  const dayKey = `${scope}:${selectedDate}`
  const current = shown?.businessId === businessId ? shown : undefined
  const shownHome = current?.home
  const shownDay = current?.day?.key === dayKey ? current.day : undefined
  const shownDayTasks = shownDay?.tasks ?? []
  if (home.data && home.data !== shownHome) setShown({ businessId, home: home.data, day: current?.day })
  if (dayTasks.data && dayTasks.data !== shownDay?.tasks) {
    setShown({ businessId, home: shownHome, day: { key: dayKey, tasks: dayTasks.data } })
  }

  function canComplete(task: TaskResponse) {
    return (
      user?.status === 'ACTIVE' &&
      task.isMyArea &&
      !task.isReadOnly &&
      user.roles.some((role) => role.role === 'ASSIGNEE' && role.orgUnit?.id === task.orgUnitId)
    )
  }

  async function completeTask(taskId: string) {
    const task = shownDayTasks.find((item) => item.id === taskId)
    if (!task || task.status !== 'TODO' || saving.current) return

    saving.current = true
    try {
      await processTask(task.id, 'COMPLETE', { version: task.version, requestId: crypto.randomUUID() })
      message.success(`'${task.title}' 완료했어요.`)
    } catch (error) {
      showError(error)
    } finally {
      saving.current = false
      setRefreshKey((key) => key + 1)
    }
  }

  function retry() {
    home.reload()
    dayTasks.reload()
  }

  if (!selectedBusinessId) {
    return (
      <EmptyData title="선택할 수 있는 사업이 없어요" description="관리자가 사업을 등록하면 할 일과 마감을 확인할 수 있어요." />
    )
  }

  const isLoading = !shownHome
  const isError = !shownHome && !!home.error
  const refreshError = !!shownHome && (!!home.error || (!!shownDay && !!dayTasks.error))
  const homeData = shownHome && getAssigneeHomeData(shownHome, shownDayTasks, canComplete)
  const isEmpty = homeData?.courses.length === 0
  const alerts = homeData?.alerts ?? []
  const alertLimit = 3
  const visibleAlerts = isMobile && !showAllAlerts ? alerts.slice(0, alertLimit) : alerts

  let summary = '할 일을 불러오는 중이에요'
  if (homeData) {
    const { todayCount, overdueCount } = homeData.summary
    summary = `오늘 마감 ${todayCount}건 - 기한 지남 ${overdueCount > 0 ? `${overdueCount}건` : '없음'}`
  }
  if (isEmpty) summary = '아직 배정된 과정이 없어요'

  return (
    <div className="flex flex-col gap-sm min-[992px]:gap-md">
      <div className="flex flex-col gap-sm min-[992px]:flex-row min-[992px]:items-center min-[992px]:justify-between">
        <div className="flex flex-col gap-xs min-[992px]:gap-xxs">
          <PageTitle>{userName}님, 안녕하세요</PageTitle>
          {!isError && <p className="m-0 text-caption text-(--ant-color-text-secondary)">{summary}</p>}
        </div>
        {canViewAll && (
          <Segmented
            aria-label="영역 보기 범위"
            className="bg-(--ant-color-fill-secondary)"
            block={isMobile}
            value={viewScope}
            onChange={setViewScope}
            options={[
              { label: '내 영역', value: 'mine' },
              { label: '전체', value: 'all' },
            ]}
          />
        )}
      </div>

      {refreshError && (
        <Alert
          type="warning"
          showIcon
          title="최신 내용을 불러오지 못했어요. 화면이 이전 상태일 수 있어요."
          action={<Button size="small" onClick={retry}>다시 시도</Button>}
        />
      )}

      {isError ? (
        <LoadingError title="할 일을 불러오지 못했어요" onRetry={retry} />
      ) : isLoading || !homeData ? (
        <AssigneeHomeSkeleton />
      ) : isEmpty ? (
        <EmptyData title="배정된 과정이 없어요" description="관리자가 과정을 배정하면 여기에서 할 일과 마감을 확인할 수 있어요." />
      ) : (
        <>
          {alerts.length > 0 && (
            <ContentCard>
              <div className="mb-xs flex flex-wrap items-center gap-xs">
                <h2 className="m-0 text-card-title">내 알림</h2>
                {homeData.summary.overdueCount > 0 && <Tag color="error" variant="outlined" className="m-0">{isMobile ? '지남' : '기한 지남'} {homeData.summary.overdueCount}</Tag>}
                {homeData.summary.dueSoonCount > 0 && <Tag color="warning" variant="outlined" className="m-0">임박 {homeData.summary.dueSoonCount}</Tag>}
              </div>
              <TaskList tasks={visibleAlerts} hasMore={isMobile && alerts.length > alertLimit} />
              {isMobile && alerts.length > alertLimit && (
                <Button type="link" block onClick={() => setShowAllAlerts(!showAllAlerts)}>
                  {showAllAlerts ? '접기' : `알림 ${alerts.length - visibleAlerts.length}건 더 보기`}
                </Button>
              )}
            </ContentCard>
          )}

          <div className="grid grid-cols-1 gap-md min-[992px]:grid-cols-[280px_minmax(0,1fr)] min-[1200px]:grid-cols-[320px_minmax(0,1fr)]">
            {!isMobile && (
              <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-5' }}>
                <HomeCalendar
                  selectedDate={selectedDate}
                  onSelectDate={setSelectedDate}
                  onMonthChange={setMonth}
                  calendar={homeData.calendar}
                  today={homeData.today}
                  isMobile={false}
                />
              </Card>
            )}
            <ContentCard className="min-w-0">
              <h2 className="m-0 mb-xs flex flex-wrap items-center gap-xs text-card-title min-[992px]:mb-sm">
                {formatSelectedDate(selectedDate)} 할 일
                {shownDay && <span className="text-caption font-regular text-(--ant-color-text-secondary)">{homeData.dayTasks.length}건</span>}
              </h2>
              {isMobile && (
                <div className="mb-xs">
                  <HomeCalendar
                    selectedDate={selectedDate}
                    onSelectDate={setSelectedDate}
                    onMonthChange={setMonth}
                    calendar={homeData.calendar}
                    today={homeData.today}
                    isMobile
                  />
                </div>
              )}
              {!shownDay ? (
                dayTasks.error ? (
                  <div className="flex flex-col items-center gap-xs py-lg text-center">
                    <p className="m-0 text-body text-(--ant-color-text-secondary)">이날의 할 일을 불러오지 못했어요</p>
                    <Button size="small" onClick={dayTasks.reload}>다시 시도</Button>
                  </div>
                ) : (
                  <Skeleton active title={false} paragraph={{ rows: 3 }} className="py-sm" />
                )
              ) : (
                <TaskList tasks={homeData.dayTasks} showCheckbox onComplete={(taskId) => void completeTask(taskId)} />
              )}
              {shownDay && homeData.otherTasks.length > 0 && (
                <div className="mt-md">
                  <div className="mb-xs flex items-center gap-xs">
                    <h3 className="m-0 text-body font-medium">다른 영역</h3>
                    <Tag color="processing" className="m-0">보기만 가능</Tag>
                  </div>
                  <TaskList tasks={homeData.otherTasks} />
                </div>
              )}
            </ContentCard>
          </div>

          <CourseList key={selectedBusiness} courses={homeData.courses} isMobile={isMobile} />
        </>
      )}
    </div>
  )
}
