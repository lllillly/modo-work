import type { ReactNode } from 'react'
import { WarningOutlined } from '@ant-design/icons'
import { Card } from 'antd'

type NoticeCardProps = {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}

export function ErrorTriangle() {
  return <WarningOutlined aria-hidden className="text-4xl text-(--ant-color-error)" />
}

export default function NoticeCard({ icon, title, description, action }: NoticeCardProps) {
  return (
    <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-0' }}>
      <div role="alert" className="flex flex-col items-center gap-sm px-lg py-xl text-center">
        {icon}
        <h3 className="m-0 text-card-title font-medium leading-normal">{title}</h3>
        {description && (
          <p className="m-0 text-caption leading-normal text-(--ant-color-text-secondary)">{description}</p>
        )}
        {action}
      </div>
    </Card>
  )
}
