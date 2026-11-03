import { useState } from 'react'
import { Button, Card, Segmented, Tag } from 'antd'
import { useOutletContext } from 'react-router'

import type { AppLayoutContext } from '../../layouts/AppLayout'
import type { ViewScope } from '../../types/home'
import { formatSelectedDate, getToday } from './dateUtils'
import { courses, tasks as mockTasks } from './assigneeHomeMockData'
import { getAssigneeHomeData } from './assigneeHomeData'

import CourseList from './components/CourseList'
import TaskList from './components/TaskList'

const cardClassNames = { body: 'p-md min-[992px]:p-lg' }

export default function AssigneeHomePage() {
  const { isMobile, selectedBusiness, userName } = useOutletContext<AppLayoutContext>()

  const today = getToday()

  const [tasks, setTasks] = useState(mockTasks)
  const selectedDate = today
  const [viewScope, setViewScope] = useState<ViewScope>('mine')
  const [showAllAlerts, setShowAllAlerts] = useState(false)

  const homeData = getAssigneeHomeData({
    businessName: selectedBusiness,
    courses,
    tasks,
    viewScope,
    selectedDate,
    today,
  })

  const isEmpty = homeData.courses.length === 0
  const alerts = homeData.alerts
  const visibleAlerts = isMobile && !showAllAlerts ? alerts.slice(0, 3) : alerts

  function completeTask(taskId: string) {
    const task = homeData.myTasks.find((item) => item.id === taskId)
    if (!task || task.isCompleted) return

    setTasks((currentTasks) => currentTasks.map((task) => (
      task.id === taskId ? { ...task, isCompleted: true, completedBy: userName } : task
    )))
  }

  const overdueSummary = homeData.overdueCount === 0 ? '없음' : `${homeData.overdueCount}건`
  let summary = `오늘 마감 ${homeData.todayCount}건 - 기한 지남 ${overdueSummary}`
  if (isEmpty) summary = '아직 배정된 과정이 없어요'

  return (
    <div className="flex flex-col gap-sm min-[992px]:gap-md">
      <div className="flex flex-col gap-sm min-[992px]:flex-row min-[992px]:items-center min-[992px]:justify-between">
        <div className="flex flex-col gap-xs min-[992px]:gap-xxs">
          <h2 className="m-0 text-section-title">{userName}님, 안녕하세요</h2>
          <p className="m-0 text-caption text-(--ant-color-text-secondary)">{summary}</p>
        </div>
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
      </div>

      {isEmpty ? (
        <Card variant="borderless" className="shadow-none" classNames={cardClassNames}>
          <div className="flex min-h-[136px] flex-col items-center justify-center gap-xs text-center">
            <h3 className="m-0 text-card-title">배정된 과정이 없어요</h3>
            <p className="m-0 text-body text-(--ant-color-text-secondary)">관리자가 과정을 배정하면 여기에서 할 일과 마감을 확인할 수 있어요.</p>
          </div>
        </Card>
      ) : (
        <>
          {alerts.length > 0 && (
            <Card variant="borderless" className="shadow-none" classNames={cardClassNames}>
              <div className="mb-xs flex flex-wrap items-center gap-xs">
                <h2 className="m-0 text-card-title">내 알림</h2>
                {homeData.overdueCount > 0 && <Tag color="error" variant="outlined" className="m-0">{isMobile ? '지남' : '기한 지남'} {homeData.overdueCount}</Tag>}
                {homeData.dueSoonCount > 0 && <Tag color="warning" variant="outlined" className="m-0">임박 {homeData.dueSoonCount}</Tag>}
              </div>
              <TaskList tasks={visibleAlerts} />
              {visibleAlerts.length < alerts.length && (
                <Button type="link" block onClick={() => setShowAllAlerts(true)}>알림 {alerts.length - visibleAlerts.length}건 더 보기</Button>
              )}
            </Card>
          )}

          <Card variant="borderless" className="min-w-0 shadow-none" classNames={cardClassNames}>
            <h2 className="m-0 mb-xs flex flex-wrap items-center gap-xs text-card-title min-[992px]:mb-sm">
              {formatSelectedDate(selectedDate)} 할 일
              <span className="text-caption font-regular text-(--ant-color-text-secondary)">{homeData.dayTasks.length}건</span>
            </h2>
            <TaskList tasks={homeData.dayTasks} showCheckbox onComplete={completeTask} />
            {homeData.otherTasks.length > 0 && (
              <div className="mt-md">
                <div className="mb-xs flex items-center gap-xs">
                  <h3 className="m-0 text-body font-medium">다른 영역</h3>
                  <Tag color="processing" className="m-0">보기만 가능</Tag>
                </div>
                <TaskList tasks={homeData.otherTasks} />
              </div>
            )}
          </Card>

          <CourseList
            key={selectedBusiness}
            courses={homeData.courses}
            tasks={homeData.myTasks}
            isMobile={isMobile}
          />
        </>
      )}
    </div>
  )
}
