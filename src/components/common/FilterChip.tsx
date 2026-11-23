import { Button } from 'antd'
import type { ReactNode } from 'react'

type FilterChipProps = {
  selected: boolean
  onClick: () => void
  children: ReactNode
  className?: string
}

export default function FilterChip({ selected, onClick, children, className = '' }: FilterChipProps) {
  return (
    <Button
      shape="round"
      variant="outlined"
      aria-pressed={selected}
      onClick={onClick}
      className={`shrink-0 shadow-none ${selected ? 'border-(--ant-color-info)! bg-(--ant-color-primary-bg)! text-(--ant-color-primary-text)!' : ''} ${className}`}
    >
      {children}
    </Button>
  )
}
