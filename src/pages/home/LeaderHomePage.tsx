import { useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { App, Button, Card, Skeleton, Tag } from 'antd'
import { useOutletContext, useSearchParams } from 'react-router'

import type { AppLayoutContext } from '../../layouts/AppLayout'
import type { AuthUser } from '../../types/auth'
import type { LeaderHomeTask } from '../../types/leaderHome'
import { getToday } from './dateUtils'
import { createLeaderHomeMockData } from './leaderHomeMockData'
import { getLeaderHomeData } from './leaderHomeData'

import HomeError from './components/AssigneeHomeError'
import HomeSkeleton from './components/AssigneeHomeSkeleton'
import LeaderCourseList from './components/LeaderCourseList'
import LeaderReviewList from './components/LeaderReviewList'
import TaskList from './components/TaskList'

const cardClassNames = { body: 'p-md min-[992px]:p-lg' }

export default function LeaderHomePage({ user }: { user: AuthUser }) {
  const { isMobile, selectedBusiness } = useOutletContext<AppLayoutContext>()
  const { message } = App.useApp()
  const [searchParams, setSearchParams] = useSearchParams()
  const today = getToday()

  const [mockData] = useState(() => createLeaderHomeMockData(user, today))
  const [tasks, setTasks] = useState(mockData.tasks)
  const [showAllAlerts, setShowAllAlerts] = useState(false)

  const preview = searchParams.get('preview')
  const homeData = getLeaderHomeData({
    user, businessName: selectedBusiness, areas: mockData.areas,
    courses: preview === 'closed-org' ? mockData.closedOrgCourses : mockData.courses,
    tasks: preview === 'no-reviews'
      ? tasks.map((task) => task.isCompleted && task.requiresReview
        ? { ...task, reviewStatus: 'confirmed' as const, reviewedBy: task.reviewedBy ?? user.name }
        : task)
      : tasks,
    today,
  })

  const isLoading = preview === 'loading'
  const isError = preview === 'error'
  const isEmpty = preview === 'empty' || homeData.courses.length === 0
  const visibleAlerts = showAllAlerts ? homeData.alerts : homeData.alerts.slice(0, isMobile ? 3 : 4)
  const summaryCards = [
    { label: '진행 중 과정', value: homeData.activeCourseCount, className: 'order-1', valueClassName: '' },
    { label: '확인 대기', value: homeData.pendingReviews.length, className: 'order-2 min-[992px]:order-4', valueClassName: 'text-(--ant-color-primary)' },
    ...homeData.overdueByArea.map((area) => ({
      label: `기한 지남 - ${area.name}`, value: area.count,
      className: 'order-3 min-[992px]:order-2', valueClassName: 'text-status-overdue-text',
    })),
  ]

  function reviewTasks(taskIds: string[]) {
    const pendingIds = new Set(homeData.pendingReviews.map((task) => task.id))
    const reviewIds = new Set(taskIds.filter((id) => pendingIds.has(id)))
    if (reviewIds.size === 0) return

    const reviewedAt = new Date().toISOString()
    setTasks((currentTasks) => currentTasks.map((task) => reviewIds.has(task.id)
      ? { ...task, reviewStatus: 'confirmed', reviewedBy: user.name, reviewedAt }
      : task))
    message.success(`${reviewIds.size}건 확인했어요.`)
  }

  function retry() {
    const nextParams = new URLSearchParams(searchParams)
    nextParams.delete('preview')
    setSearchParams(nextParams, { replace: true })
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

  return (
    <div className="flex min-w-0 flex-col gap-sm min-[992px]:gap-md">
      <div className="flex items-center justify-between gap-sm">
        <h2 className="m-0 text-section-title">{selectedBusiness} 과정 현황</h2>
        {!isMobile && <Button icon={<PlusOutlined />} disabled>공지 작성</Button>}
      </div>

      {isLoading ? (
        <>
          <div className="grid grid-cols-2 gap-xs min-[992px]:grid-cols-4 min-[992px]:gap-md" aria-hidden="true">
            {summaryCards.map((card) => (
              <Card key={card.label} variant="borderless" className="shadow-none" classNames={{ body: 'p-md min-[992px]:p-5' }}>
                <Skeleton active title={{ width: 80 }} paragraph={{ rows: 1, width: 40 }} />
              </Card>
            ))}
          </div>
          <HomeSkeleton />
        </>
      ) : isError ? (
        <HomeError title="과정 현황을 불러오지 못했어요" onRetry={retry} />
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
            {homeData.reviewScope.labels.map((label) => <Tag key={label} color="processing" variant="outlined" className="m-0 rounded-lg px-xs py-xxs">{label}</Tag>)}
          </div>

          <div className="grid grid-cols-2 gap-xs min-[992px]:grid-cols-4 min-[992px]:gap-md" aria-label="과정 현황 요약">
            {summaryCards.map((card) => (
              <Card key={card.label} variant="borderless" className={`shadow-none ${card.className}`} classNames={{ body: 'px-md py-sm min-[992px]:p-5' }}>
                <p className="m-0 mb-xxs text-caption text-(--ant-color-text-secondary)">{card.label}</p>
                <p className={`m-0 text-section-title-lg min-[992px]:text-page-title ${card.valueClassName}`}>{card.value}</p>
              </Card>
            ))}
          </div>

          {homeData.alerts.length > 0 && (
            <Card variant="borderless" className="shadow-none" classNames={cardClassNames} role="region" aria-labelledby="leader-alerts-title">
              <div className="mb-xs flex flex-wrap items-center gap-xs">
                <h2 id="leader-alerts-title" className="m-0 text-card-title">리더 알림</h2>
                {homeData.overdueCount > 0 && <Tag color="error" variant="outlined" className="m-0">{isMobile ? '지남' : '기한 지남'} {homeData.overdueCount}</Tag>}
                {homeData.dueSoonCount > 0 && <Tag color="warning" variant="outlined" className="m-0">임박 {homeData.dueSoonCount}</Tag>}
                {!isMobile && <span className="ml-auto text-caption text-(--ant-color-text-tertiary)">{homeData.alerts.some((task) => task.isReadOnly) ? '보기만 가능한 업무 포함' : '내 확인 범위 전체'}</span>}
              </div>
              <TaskList tasks={visibleAlerts} renderDescription={renderAlertDescription} />
              {visibleAlerts.length < homeData.alerts.length && (
                <Button type="link" block onClick={() => setShowAllAlerts(true)}>알림 {homeData.alerts.length - visibleAlerts.length}건 더 보기</Button>
              )}
            </Card>
          )}

          <LeaderReviewList
            key={`records-${selectedBusiness}`} tasks={homeData.records} pendingCount={homeData.pendingReviews.length}
            isMobile={isMobile} ownOrgUnitId={user.orgUnit?.id}
            onReview={(taskId) => reviewTasks([taskId])}
            onReviewAll={() => reviewTasks(homeData.pendingReviews.map((task) => task.id))}
          />

          <LeaderCourseList key={`courses-${selectedBusiness}`} courses={homeData.courses} areas={mockData.areas} isMobile={isMobile} ownOrgUnitId={user.orgUnit?.id} />
        </>
      )}
    </div>
  )
}
