import { useCallback, useRef, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Skeleton, Tag } from 'antd'
import { useOutletContext } from 'react-router'

import { getApiErrorMessage, isAuthStateError } from '../../api/client'
import { getLeaderHome } from '../../api/home'
import { processTask, reviewTasks } from '../../api/tasks'
import useApiQuery from '../../hooks/useApiQuery'
import type { AppLayoutContext } from '../../layouts/AppLayout'
import { useAuth } from '../../providers/AuthContext'
import type { AuthUser } from '../../types/auth'
import type { LeaderHomeResponse } from '../../types/homeApi'
import type { LeaderHomeTask } from '../../types/leaderHome'
import type { TaskResponse } from '../../types/taskApi'
import { getLeaderHomeData, getLeaderReviewScope } from './leaderHomeData'

import HomeError from './components/AssigneeHomeError'
import HomeSkeleton from './components/AssigneeHomeSkeleton'
import LeaderCourseList from './components/LeaderCourseList'
import LeaderReviewList from './components/LeaderReviewList'
import TaskList from './components/TaskList'

const cardClassNames = { body: 'p-md min-[992px]:p-lg' }

export default function LeaderHomePage({ user }: { user: AuthUser }) {
  const { isMobile, selectedBusiness, selectedBusinessId } = useOutletContext<AppLayoutContext>()
  const { refreshUser } = useAuth()
  const { message } = App.useApp()
  const [showAllAlerts, setShowAllAlerts] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)
  const [shown, setShown] = useState<{ businessId: string; data: LeaderHomeResponse }>()
  const saving = useRef(false)

  const businessId = selectedBusinessId ?? ''
  const load = useCallback((signal: AbortSignal) => getLeaderHome(businessId, signal), [businessId])
  const query = useApiQuery(businessId ? `leader-home:${businessId}:${refreshKey}` : null, load)
  const current = shown?.businessId === businessId ? shown.data : undefined
  if (query.data && query.data !== current) setShown({ businessId, data: query.data })

  async function review(tasks: TaskResponse[]) {
    if (saving.current || tasks.length === 0) return
    saving.current = true
    let reviewed = 0
    try {
      if (tasks.length === 1) {
        await processTask(tasks[0].id, 'REVIEW', { version: tasks[0].version, requestId: crypto.randomUUID() })
        reviewed = 1
      } else {
        await reviewTasks(tasks, (count) => { reviewed += count })
      }
      message.success(`${reviewed}건 확인했어요.`)
    } catch (error) {
      const reason = getApiErrorMessage(error)
      message.error(reviewed > 0 ? `${reviewed}건은 확인했고 나머지는 처리하지 못했어요. ${reason}` : reason)
      if (isAuthStateError(error)) void refreshUser()
    } finally {
      saving.current = false
      setRefreshKey((key) => key + 1)
    }
  }

  function reviewTask(taskId: string) {
    const task = current?.records.items.find((record) => record.task.id === taskId)?.task
    if (task) void review([task])
  }

  function reviewAll() {
    void review(current?.pendingReviews.items.filter((task) => task.canReview) ?? [])
  }

  function renderAlertDescription(task: LeaderHomeTask) {
    const description = [
      task.courseName,
      task.orgUnit.id !== user.orgUnit?.id && task.orgUnit.name,
      task.orgUnit.isClosed && '폐쇄',
      task.areaName,
      task.assigneeNames.join(' / '),
    ].filter(Boolean).join(' - ')

    return (
      <span className="flex min-w-0 items-center gap-xxs">
        <span className="min-w-0 flex-1 truncate" title={description}>{description}</span>
        {task.isReadOnly && <Tag color="processing" variant="outlined" className="m-0 shrink-0">보기만 가능</Tag>}
      </span>
    )
  }

  const homeData = current && getLeaderHomeData(current)
  const isError = !homeData && !!query.error
  const refreshError = !!homeData && !!query.error
  const isEmpty = homeData?.courses.length === 0
  const alerts = homeData?.alerts ?? []
  const alertLimit = isMobile ? 3 : 4
  const visibleAlerts = showAllAlerts ? alerts : alerts.slice(0, alertLimit)
  const overdueAreas = homeData
    ? [
        ...homeData.areas.map((area) => ({
          name: area.name,
          count: homeData.summary.overdueByArea.find((item) => item.areaId === area.id)?.count ?? 0,
        })),
        ...homeData.summary.overdueByArea
          .filter((item) => !homeData.areas.some((area) => area.id === item.areaId))
          .map((item) => ({ name: item.areaName, count: item.count })),
      ]
    : []
  const summaryCards = homeData
    ? [
        { label: '진행 중 과정', value: homeData.activeCourseCount, className: 'order-1', valueClassName: '' },
        { label: '확인 대기', value: homeData.summary.pendingReviewCount, className: 'order-2 min-[992px]:order-4', valueClassName: 'text-(--ant-color-primary)' },
        ...overdueAreas.map((area) => ({
          label: `기한 지남 - ${area.name}`, value: area.count,
          className: 'order-3 min-[992px]:order-2', valueClassName: 'text-status-overdue-text',
        })),
      ]
    : []

  return (
    <div className="flex min-w-0 flex-col gap-sm min-[992px]:gap-md">
      <div className="flex items-center justify-between gap-sm">
        <h2 className="m-0 text-section-title">{selectedBusiness} 과정 현황</h2>
        {!isMobile && <Button icon={<PlusOutlined />} disabled>공지 작성</Button>}
      </div>

      {refreshError && (
        <Alert
          type="warning"
          showIcon
          title="최신 내용을 불러오지 못했어요. 화면이 이전 상태일 수 있어요."
          action={<Button size="small" onClick={query.reload}>다시 시도</Button>}
        />
      )}

      {!selectedBusinessId ? (
        <Card variant="borderless" className="shadow-none" classNames={cardClassNames}>
          <div className="flex min-h-[136px] flex-col items-center justify-center gap-xs text-center">
            <h3 className="m-0 text-card-title">선택할 수 있는 사업이 없어요</h3>
            <p className="m-0 text-body text-(--ant-color-text-secondary)">관리자가 사업을 등록하면 과정 현황을 확인할 수 있어요.</p>
          </div>
        </Card>
      ) : isError ? (
        <HomeError title="과정 현황을 불러오지 못했어요" onRetry={query.reload} />
      ) : !homeData ? (
        <>
          <div className="grid grid-cols-2 gap-xs min-[992px]:auto-cols-fr min-[992px]:grid-flow-col min-[992px]:gap-md" aria-hidden="true">
            {[0, 1, 2, 3].map((index) => (
              <Card key={index} variant="borderless" className="shadow-none" classNames={{ body: 'p-md min-[992px]:p-5' }}>
                <Skeleton active title={{ width: 80 }} paragraph={{ rows: 1, width: 40 }} />
              </Card>
            ))}
          </div>
          <HomeSkeleton />
        </>
      ) : isEmpty ? (
        <Card variant="borderless" className="shadow-none" classNames={cardClassNames}>
          <div className="flex min-h-[136px] flex-col items-center justify-center gap-xs text-center">
            <h3 className="m-0 text-card-title">진행 중인 과정이 없어요</h3>
            <p className="m-0 text-body text-(--ant-color-text-secondary)">관리자가 과정을 등록하면 현황과 처리 기록이 여기에 보여요.</p>
          </div>
        </Card>
      ) : (
        <>
          <div className="flex flex-col items-start gap-xs min-[992px]:flex-row min-[992px]:items-center">
            <span className="text-caption text-(--ant-color-text-secondary)">내 확인 범위</span>
            {getLeaderReviewScope(user).labels.map((label) => <Tag key={label} color="processing" variant="outlined" className="m-0 rounded-lg px-xs py-xxs">{label}</Tag>)}
          </div>

          <div className="grid grid-cols-2 gap-xs min-[992px]:auto-cols-fr min-[992px]:grid-flow-col min-[992px]:gap-md" aria-label="과정 현황 요약">
            {summaryCards.map((card) => (
              <Card key={card.label} variant="borderless" className={`shadow-none ${card.className}`} classNames={{ body: 'px-md py-sm min-[992px]:p-5' }}>
                <p className="m-0 mb-xxs text-caption text-(--ant-color-text-secondary)">{card.label}</p>
                <p className={`m-0 text-section-title-lg min-[992px]:text-page-title ${card.valueClassName}`}>{card.value}</p>
              </Card>
            ))}
          </div>

          {alerts.length > 0 && (
            <Card variant="borderless" className="shadow-none" classNames={cardClassNames} role="region" aria-labelledby="leader-alerts-title">
              <div className="mb-xs flex flex-wrap items-center gap-xs">
                <h2 id="leader-alerts-title" className="m-0 text-card-title">리더 알림</h2>
                {homeData.summary.overdueCount > 0 && <Tag color="error" variant="outlined" className="m-0">{isMobile ? '지남' : '기한 지남'} {homeData.summary.overdueCount}</Tag>}
                {homeData.summary.dueSoonCount > 0 && <Tag color="warning" variant="outlined" className="m-0">임박 {homeData.summary.dueSoonCount}</Tag>}
                {!isMobile && <span className="ml-auto text-caption text-(--ant-color-text-tertiary)">{alerts.some((task) => task.isReadOnly) ? '보기만 가능한 업무 포함' : '내 확인 범위 전체'}</span>}
              </div>
              <TaskList tasks={visibleAlerts} hasMore={alerts.length > alertLimit} renderDescription={renderAlertDescription} />
              {alerts.length > alertLimit && (
                <Button type="link" block onClick={() => setShowAllAlerts(!showAllAlerts)}>
                  {showAllAlerts ? '접기' : `알림 ${alerts.length - visibleAlerts.length}건 더 보기`}
                </Button>
              )}
            </Card>
          )}

          <LeaderReviewList
            key={`records-${selectedBusiness}`} tasks={homeData.records} pendingCount={homeData.summary.pendingReviewCount}
            isMobile={isMobile} ownOrgUnitId={user.orgUnit?.id}
            onReview={reviewTask}
            onReviewAll={reviewAll}
          />

          <LeaderCourseList key={`courses-${selectedBusiness}`} courses={homeData.courses} areas={homeData.areas} isMobile={isMobile} ownOrgUnitId={user.orgUnit?.id} />
        </>
      )}
    </div>
  )
}
