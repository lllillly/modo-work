import { useCallback, useRef, useState } from 'react'
import { Alert, App, Button, Card, Skeleton, Tag } from 'antd'
import { useOutletContext } from 'react-router'

import { getApiErrorMessage } from '../../api/client'
import { getLeaderHome } from '../../api/home'
import { processTask, reviewTasks } from '../../api/tasks'
import useApiQuery from '../../hooks/useApiQuery'
import type { AppLayoutContext } from '../../layouts/AppLayout'
import type { AuthUser } from '../../types/auth'
import type { LeaderHomeResponse } from '../../types/homeApi'
import type { LeaderHomeTask } from '../../types/leaderHome'
import type { TaskResponse } from '../../types/taskApi'
import { getLeaderHomeData, getLeaderReviewScope } from './leaderHomeData'

import LoadingError from '../../components/common/LoadingError'
import HomeSkeleton from './components/AssigneeHomeSkeleton'
import LeaderCourseList from './components/LeaderCourseList'
import LeaderReviewList from './components/LeaderReviewList'
import TaskList from './components/TaskList'
import { clickableRowProps } from '../../components/common/clickableRow'
import PageTitle from '../../components/layout/PageTitle'
import EmptyData from '../../components/common/EmptyData'
import ContentCard from '../../components/common/ContentCard'
import useApiErrorHandler from '../../hooks/useApiErrorHandler'

export default function LeaderHomePage({ user }: { user: AuthUser }) {
  const { isMobile, selectedBusiness, selectedBusinessId } = useOutletContext<AppLayoutContext>()
  const { showError } = useApiErrorHandler()
  const { message, modal } = App.useApp()
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
      showError(error, reviewed > 0 ? `${reviewed}건은 확인했고 나머지는 처리하지 못했어요. ${reason}` : reason)
    } finally {
      saving.current = false
      setRefreshKey((key) => key + 1)
    }
  }

  function reviewTask(taskId: string) {
    const task = current?.records.items.find((record) => record.task.id === taskId)?.task
    if (!task) return
    modal.confirm({
      title: '확인 처리할까요?',
      content: `${task.title} 완료 내용을 확인한 것으로 기록해요.`,
      okText: '확인 처리',
      cancelText: '닫기',
      onOk: () => review([task]),
    })
  }

  function reviewAll() {
    const tasks = current?.pendingReviews.items.filter((task) => task.canReview) ?? []
    if (tasks.length === 0) return
    modal.confirm({
      title: `확인 대기 ${tasks.length}건을 모두 확인 처리할까요?`,
      content: '완료 내용을 확인한 것으로 한 번에 기록해요.',
      okText: '모두 확인 처리',
      cancelText: '닫기',
      onOk: () => review(tasks),
    })
  }

  function goTo(target: string | null, label: string) {
    if (!target) return {}
    return {
      role: 'button',
      'aria-label': `${label} 보기`,
      ...clickableRowProps(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' })),
    }
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
        <span className="min-w-0 truncate" title={description}>{description}</span>
        {task.hasInactiveAssignee && <Tag color="warning" variant="outlined" className="m-0 shrink-0">재배정 필요</Tag>}
        {task.isReadOnly && <Tag color="processing" variant="outlined" className="ml-auto shrink-0">보기만 가능</Tag>}
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
        { label: '진행 중 과정', value: homeData.activeCourseCount, className: 'order-1', valueClassName: '', target: 'leader-courses' },
        { label: '확인 대기', value: homeData.summary.pendingReviewCount, className: 'order-4', valueClassName: 'text-(--ant-color-primary-text)', target: 'leader-records' },
        ...overdueAreas.map((area) => ({
          label: `기한 지남 - ${area.name}`, value: area.count,
          className: 'order-2', valueClassName: 'text-status-overdue-text', target: null,
        })),
      ]
    : []
  const mobileSummary = homeData
    ? [
        { label: '진행 중 과정', value: homeData.activeCourseCount, valueClassName: '', tileClassName: 'bg-(--ant-color-fill-quaternary)', target: 'leader-courses' },
        { label: '기한 지남', value: homeData.summary.overdueCount, valueClassName: 'text-status-overdue-text', tileClassName: 'bg-(--ant-color-error-bg)', target: null },
        { label: '확인 대기', value: homeData.summary.pendingReviewCount, valueClassName: 'text-(--ant-color-primary-text)', tileClassName: 'bg-(--ant-color-primary-bg)', target: 'leader-records' },
      ]
    : []

  return (
    <div className="flex min-w-0 flex-col gap-sm min-[992px]:gap-md">
      <PageTitle>{selectedBusiness} 과정 현황</PageTitle>

      {refreshError && (
        <Alert
          type="warning"
          showIcon
          title="최신 내용을 불러오지 못했어요. 화면이 이전 상태일 수 있어요."
          action={<Button size="small" onClick={query.reload}>다시 시도</Button>}
        />
      )}

      {!selectedBusinessId ? (
        <EmptyData title="선택할 수 있는 사업이 없어요" description="관리자가 사업을 등록하면 과정 현황을 확인할 수 있어요." />
      ) : isError ? (
        <LoadingError title="과정 현황을 불러오지 못했어요" error={query.error} onRetry={query.reload} />
      ) : !homeData ? (
        <>
          <div className="grid auto-cols-fr grid-flow-col gap-xs min-[992px]:gap-md" aria-hidden="true">
            {(isMobile ? [0] : [0, 1, 2, 3]).map((index) => (
              <Card key={index} variant="borderless" className="shadow-none" classNames={{ body: 'px-md py-sm min-[992px]:px-lg min-[992px]:py-md' }}>
                <Skeleton active title={{ width: 80 }} paragraph={{ rows: 1, width: 40 }} />
              </Card>
            ))}
          </div>
          <HomeSkeleton />
        </>
      ) : isEmpty ? (
        <EmptyData title="진행 중인 과정이 없어요" description="관리자가 과정을 등록하면 현황과 처리 기록이 여기에 보여요." />
      ) : (
        <>
          {isMobile ? (
            <Card variant="borderless" className="shadow-none" classNames={{ body: 'px-md py-sm' }} aria-label="과정 현황 요약">
              <dl className="m-0 grid grid-cols-3 gap-xs">
                {mobileSummary.map((item) => (
                  <div key={item.label} {...goTo(item.target, item.label)} className={`flex flex-col gap-xxs rounded-lg px-sm py-xs ${item.target ? 'cursor-pointer' : ''} ${item.tileClassName}`}>
                    <dt className="text-caption text-(--ant-color-text-secondary)">{item.label}</dt>
                    <dd className={`m-0 text-section-title ${item.valueClassName}`}>{item.value}</dd>
                  </div>
                ))}
              </dl>
              <p className="m-0 mt-sm border-0 border-t border-solid border-(--ant-color-border-secondary) pt-xs text-caption text-(--ant-color-text-tertiary)">
                내 확인 범위: {getLeaderReviewScope(user).labels.join(', ')}
              </p>
            </Card>
          ) : (
            <>
              <div className="flex flex-row items-center gap-xs">
                <span className="text-caption text-(--ant-color-text-secondary)">내 확인 범위</span>
                {getLeaderReviewScope(user).labels.map((label) => <Tag key={label} color="processing" variant="outlined" className="m-0 rounded-lg px-xs py-xxs">{label}</Tag>)}
              </div>

              <div className="grid auto-cols-fr grid-flow-col gap-md" aria-label="과정 현황 요약">
                {summaryCards.map((card) => (
                  <Card key={card.label} {...goTo(card.target, card.label)} variant="borderless" className={`shadow-none ${card.target ? 'cursor-pointer transition-shadow hover:shadow-(--card-hover-shadow) focus-visible:shadow-(--card-hover-shadow)' : ''} ${card.className}`} classNames={{ body: 'px-lg py-md' }}>
                    <p className="m-0 mb-xxs text-caption text-(--ant-color-text-secondary)">{card.label}</p>
                    <p className={`m-0 text-section-title-lg ${card.valueClassName}`}>{card.value}</p>
                  </Card>
                ))}
              </div>
            </>
          )}

          <div className="grid grid-cols-1 gap-sm min-[992px]:gap-md min-[1200px]:grid-cols-2">
            {alerts.length > 0 && (
              <ContentCard id="leader-alerts" className="h-full scroll-mt-md" role="region" aria-labelledby="leader-alerts-title">
                <div className="mb-xs flex min-h-8 flex-wrap items-center gap-xs">
                  <h2 id="leader-alerts-title" className="m-0 text-card-title">알림</h2>
                  {homeData.summary.overdueCount > 0 && <Tag color="error" variant="outlined" className="m-0">{isMobile ? '지남' : '기한 지남'} {homeData.summary.overdueCount}</Tag>}
                  {homeData.summary.dueSoonCount > 0 && <Tag color="warning" variant="outlined" className="m-0">임박 {homeData.summary.dueSoonCount}</Tag>}
                  {!isMobile && <span className="ml-auto text-caption text-(--ant-color-text-tertiary)">{alerts.some((task) => task.isReadOnly) ? '보기만 가능한 업무 포함' : '내 확인 범위 전체'}</span>}
                </div>
                <div className={showAllAlerts ? 'min-[1200px]:max-h-[456px] min-[1200px]:overflow-y-auto' : ''}>
                  <TaskList tasks={visibleAlerts} hasMore={alerts.length > alertLimit} renderDescription={renderAlertDescription} />
                </div>
                {alerts.length > alertLimit && (
                  <Button type="link" block onClick={() => setShowAllAlerts(!showAllAlerts)}>
                    {showAllAlerts ? '접기' : `알림 ${alerts.length - visibleAlerts.length}건 더 보기`}
                  </Button>
                )}
              </ContentCard>
            )}

            <div id="leader-records" className={`scroll-mt-md ${alerts.length > 0 ? '' : 'min-[1200px]:col-span-2'}`}>
              <LeaderReviewList
                key={`records-${selectedBusiness}`} tasks={homeData.records} pendingCount={homeData.summary.pendingReviewCount}
                isMobile={isMobile} ownOrgUnitId={user.orgUnit?.id}
                onReview={reviewTask}
                onReviewAll={reviewAll}
              />
            </div>
          </div>

          <div id="leader-courses" className="scroll-mt-md">
            <LeaderCourseList key={`courses-${selectedBusiness}`} courses={homeData.courses} areas={homeData.areas} isMobile={isMobile} ownOrgUnitId={user.orgUnit?.id} />
          </div>
        </>
      )}
    </div>
  )
}
