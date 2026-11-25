import { useCallback, useState } from 'react'
import type { MouseEvent } from 'react'
import { BellOutlined } from '@ant-design/icons'
import { Badge, Button, Popover, Spin } from 'antd'
import { Link, useLocation } from 'react-router'

import { getHeaderAlerts } from '../../api/home'
import useApiQuery from '../../hooks/useApiQuery'
import { useAuth } from '../../providers/AuthContext'
import type { AssigneeHomeResponse } from '../../types/homeApi'

import { toHomeTask } from '../../pages/home/assigneeHomeData'
import TaskList from '../../pages/home/components/TaskList'
import EmptyData from '../common/EmptyData'
import LoadingError from '../common/LoadingError'

type HeaderAlertsProps = {
  businessId?: string
  isMobile: boolean
}

type ShownAlerts = {
  businessId: string
  data: Pick<AssigneeHomeResponse, 'today' | 'alerts'>
}

export default function HeaderAlerts({ businessId, isMobile }: HeaderAlertsProps) {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [isOpen, setIsOpen] = useState(false)
  const isLeader = !!user?.roles.some((item) => item.role === 'LEADER' || item.role === 'ADMIN')
  const loadAlerts = useCallback(
    (signal: AbortSignal) => getHeaderAlerts(businessId ?? '', isLeader, signal),
    [businessId, isLeader],
  )
  const alerts = useApiQuery(user && businessId ? `header-alerts:${user.id}:${businessId}:${pathname}` : null, loadAlerts)
  const [shown, setShown] = useState<ShownAlerts>()
  if (businessId && alerts.data && alerts.data !== shown?.data) setShown({ businessId, data: alerts.data })

  const data = shown && shown.businessId === businessId ? shown.data : undefined
  const alertIds = new Set(data?.alerts.items.map((task) => task.id))
  const tasks = data ? data.alerts.items.map((task) => toHomeTask(task, data.today, alertIds)) : []
  const count = data?.alerts.totalElements ?? 0

  function handleOpenChange(open: boolean) {
    setIsOpen(open)
    if (open) alerts.reload()
  }

  function handleContentClick(event: MouseEvent<HTMLDivElement>) {
    if ((event.target as HTMLElement).closest('a')) setIsOpen(false)
  }

  let content
  if (!data && alerts.error) {
    content = <LoadingError plain title="알림을 불러오지 못했어요" error={alerts.error} onRetry={alerts.reload} />
  } else if (!data) {
    content = <Spin className="flex justify-center py-lg" aria-label="알림 불러오는 중" />
  } else if (tasks.length === 0) {
    content = <EmptyData plain compact title="새 알림이 없어요" description="기한이 지났거나 다가오는 할 일이 생기면 보여 드려요." />
  } else {
    content = (
      <>
        <TaskList tasks={tasks} hasMore={count > tasks.length} />
        {count > tasks.length && (
          <Link to="/" className="block pt-xs text-center text-caption">
            홈에서 {count - tasks.length}건 더 보기
          </Link>
        )}
      </>
    )
  }

  return (
    <Popover
      title="알림"
      trigger="click"
      placement={isMobile ? 'bottom' : 'bottomRight'}
      open={isOpen}
      onOpenChange={handleOpenChange}
      content={
        <div className="max-h-[60vh] w-[360px] max-w-[calc(100vw-32px)] overflow-y-auto" onClick={handleContentClick}>
          {content}
        </div>
      }
    >
      <Button
        type="text"
        aria-label={`알림 ${count}건`}
        icon={
          <Badge count={count} size="small">
            <BellOutlined className="text-[18px]" />
          </Badge>
        }
      />
    </Popover>
  )
}
