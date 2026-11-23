import type { ReactNode } from 'react'

import { useHeaderTitleSlot } from './headerTitleSlot'
import PageTitle from './PageTitle'

type PageHeaderProps = {
  title: string
  description?: ReactNode
  actions?: ReactNode
}

export default function PageHeader({ title, description, actions }: PageHeaderProps) {
  const inHeader = !!useHeaderTitleSlot()
  if (inHeader && !actions && !description) return <PageTitle>{title}</PageTitle>

  return (
    <div className={`flex flex-wrap items-center justify-between gap-x-md gap-y-sm ${inHeader && !actions ? 'max-[991px]:hidden' : ''}`}>
      <div className="flex min-w-0 flex-col gap-xxs">
        <PageTitle>{title}</PageTitle>
        {description && (
          <p className="m-0 text-caption text-(--ant-color-text-secondary) max-[991px]:hidden">{description}</p>
        )}
      </div>
      {actions && <div className="ml-auto flex flex-wrap items-center gap-xs">{actions}</div>}
    </div>
  )
}
