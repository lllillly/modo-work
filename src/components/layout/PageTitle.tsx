import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'

import { useHeaderTitleSlot } from './headerTitleSlot'

type PageTitleProps = {
  children: ReactNode
  className?: string
}

export default function PageTitle({ children, className = 'm-0 text-section-title' }: PageTitleProps) {
  const slot = useHeaderTitleSlot()
  if (slot) return createPortal(<h1 className="m-0 truncate text-card-title font-bold min-[992px]:text-section-title">{children}</h1>, slot)
  return <h1 className={className}>{children}</h1>
}
