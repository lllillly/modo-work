import type { ReactNode } from 'react'
import { InboxOutlined } from '@ant-design/icons'

import NoticeCard from './NoticeCard'

type EmptyDataProps = {
  title: string
  description?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  plain?: boolean
  compact?: boolean
}

export default function EmptyData({ title, description, action, icon, plain, compact }: EmptyDataProps) {
  return (
    <NoticeCard
      role="status"
      plain={plain}
      compact={compact}
      icon={icon ?? <InboxOutlined aria-hidden className={`${compact ? 'text-3xl' : 'text-4xl'} text-(--ant-color-text-tertiary)`} />}
      title={title}
      description={description}
      action={action}
    />
  )
}
