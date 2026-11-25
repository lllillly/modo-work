import type { ReactNode } from 'react'
import { Button } from 'antd'

import { getApiErrorMessage } from '../../api/client'
import NoticeCard, { ErrorTriangle } from './NoticeCard'

type LoadingErrorProps = {
  title: string
  error?: unknown
  description?: string
  onRetry: () => void
  retrying?: boolean
  extra?: ReactNode
  plain?: boolean
}

export default function LoadingError({ title, error, description, onRetry, retrying, extra, plain }: LoadingErrorProps) {
  return (
    <NoticeCard
      role="alert"
      plain={plain}
      icon={<ErrorTriangle />}
      title={title}
      description={description ?? (error === undefined ? '잠시 후 다시 시도해 주세요.' : getApiErrorMessage(error))}
      action={
        <span className="flex flex-wrap items-center justify-center gap-xs">
          <Button className="h-7" loading={retrying} onClick={onRetry}>
            다시 시도
          </Button>
          {extra}
        </span>
      }
    />
  )
}
