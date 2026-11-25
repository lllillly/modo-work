import type { ReactNode } from 'react'
import { WarningOutlined } from '@ant-design/icons'
import { Card } from 'antd'

type NoticeCardProps = {
  icon: ReactNode
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
  role?: 'alert' | 'status'
  plain?: boolean
  compact?: boolean
}

export function ErrorTriangle() {
  return <WarningOutlined aria-hidden className="text-4xl text-(--ant-color-error-text)" />
}

export default function NoticeCard({ icon, title, description, action, role, plain, compact }: NoticeCardProps) {
  const content = (
    <div role={role} className={`flex flex-col items-center gap-sm text-center ${compact ? 'px-md py-lg' : 'px-lg py-xl'}`}>
      {icon}
      <h3 className="m-0 text-card-title font-medium leading-normal text-(--ant-color-text)">{title}</h3>
      {description && (
        <p className="m-0 text-caption leading-normal text-(--ant-color-text-secondary)">{description}</p>
      )}
      {action}
    </div>
  )

  if (plain) return content

  return (
    <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-0' }}>
      {content}
    </Card>
  )
}
