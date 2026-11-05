import { useState } from 'react'
import { Button, Card, Empty } from 'antd'

import type { LeaderHomeTask } from '../../../types/leaderHome'
import DeadlineTag from './DeadlineTag'

type LeaderReviewListProps = {
  tasks: LeaderHomeTask[]
  pendingCount: number
  isMobile: boolean
  ownOrgUnitId?: string
  onReview: (taskId: string) => void
  onReviewAll: () => void
}

const actionTimeFormatter = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
})

function formatActionTime(value?: string) {
  if (!value) return ''
  const parts = Object.fromEntries(actionTimeFormatter.formatToParts(new Date(value)).map((part) => [part.type, part.value]))
  return `${parts.month}/${parts.day} ${parts.hour}:${parts.minute}`
}

export default function LeaderReviewList({ tasks, pendingCount, isMobile, ownOrgUnitId, onReview, onReviewAll }: LeaderReviewListProps) {
  const [showAll, setShowAll] = useState(false)
  const visibleTasks = showAll ? tasks : tasks.slice(0, isMobile ? 3 : 5)

  return (
    <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-md min-[992px]:p-lg' }}>
      <div className="mb-xs flex flex-wrap items-center justify-between gap-xs">
        <h2 className="m-0 flex items-center gap-xs text-card-title">
          처리 기록 <span className="text-caption font-regular text-(--ant-color-text-tertiary)">최신순</span>
        </h2>
        {pendingCount > 0 && (
          <Button type="primary" block={isMobile} onClick={onReviewAll}>
            확인 대기 {pendingCount}건 모두 확인
          </Button>
        )}
      </div>

      {tasks.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="처리 기록이 없어요" className="my-lg" />
      ) : (
        <ul className="m-0 list-none p-0">
          {visibleTasks.map((task) => (
            <li key={task.id} className="flex min-h-14 items-center gap-sm border-0 border-b border-solid border-(--ant-color-border-secondary) px-xxs py-xs min-[992px]:px-md">
              <div className="min-w-0 flex-1">
                <p className="m-0 text-body">{task.title}</p>
                <p className="m-0 text-caption leading-[18px] text-(--ant-color-text-tertiary)">
                  {[
                    !isMobile && task.courseName,
                    task.orgUnit.id !== ownOrgUnitId && task.orgUnit.name,
                    task.completedBy,
                    formatActionTime(task.completedAt),
                    task.reviewedBy && `확인 ${task.reviewedBy} ${formatActionTime(task.reviewedAt)}`,
                    task.completionMemo && `"${task.completionMemo}"`,
                  ].filter(Boolean).join(' - ')}
                </p>
              </div>
              {task.requiresReview && task.reviewStatus === 'pending' && !task.isReadOnly ? (
                <Button size="small" aria-label={`${task.title} 확인`} onClick={() => onReview(task.id)}>확인</Button>
              ) : (
                <span className="flex shrink-0 flex-col items-end gap-xxs">
                  <DeadlineTag task={task} showReviewStatus={task.requiresReview} />
                  {task.isReadOnly && <span className="text-caption text-(--ant-color-text-tertiary)">보기만 가능</span>}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}

      {visibleTasks.length < tasks.length && (
        <Button type="link" block onClick={() => setShowAll(true)}>기록 더 보기</Button>
      )}
    </Card>
  )
}
