import { CheckCircleOutlined, ClockCircleOutlined, HourglassOutlined, SyncOutlined, WarningOutlined } from '@ant-design/icons'
import { Tag } from 'antd'

import type { HomeTask } from '../../../types/home'

type DeadlineTagProps = {
  task: HomeTask
}

export default function DeadlineTag({ task }: DeadlineTagProps) {
  if (task.isCompleted) {
    if (task.reviewStatus === 'pending') {
      return <Tag color="processing" variant="outlined" icon={<SyncOutlined />} className="m-0">확인 대기</Tag>
    }
    return <Tag color="success" variant="outlined" icon={<CheckCircleOutlined />} className="m-0">{task.reviewStatus === 'confirmed' ? '확인됨' : '완료'}</Tag>
  }

  if (task.deadlineLabel === 'D-day') {
    return (
      <Tag color="warning" variant="outlined" icon={<ClockCircleOutlined />} className="m-0 border-status-due-today-border bg-status-due-today-bg text-status-due-today-text font-bold">
        D-day
      </Tag>
    )
  }

  if (task.deadlineStatus === 'upcoming') {
    return <Tag variant="filled" className="m-0 bg-status-upcoming-bg">{task.deadlineLabel}</Tag>
  }

  const isOverdue = task.deadlineStatus === 'overdue'
  const isDueSoon = task.deadlineStatus === 'dueSoon'
  let icon
  if (isOverdue) icon = <WarningOutlined />
  if (isDueSoon) icon = <HourglassOutlined />

  return (
    <Tag color={isOverdue ? 'error' : isDueSoon ? 'warning' : undefined} variant="outlined" icon={icon} className="m-0">
      {task.deadlineLabel}
    </Tag>
  )
}
