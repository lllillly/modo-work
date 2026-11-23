import { Button } from 'antd'
import type { ReactNode } from 'react'

import HintTooltip from './HintTooltip'

type IconActionProps = {
  label: string
  icon: ReactNode
  onClick?: () => void
  tone?: 'default' | 'primary' | 'danger'
  disabled?: boolean
  ariaLabel?: string
  showLabel?: boolean
}

const toneClass = {
  default: 'text-(--ant-color-text-secondary)',
  primary: 'text-(--ant-color-primary-text)',
  danger: 'text-(--ant-color-error-text)',
}

export default function IconAction({ label, icon, onClick, tone = 'default', disabled = false, ariaLabel, showLabel = false }: IconActionProps) {
  const button = (
    <Button
      type="text"
      aria-label={ariaLabel ?? label}
      icon={showLabel ? undefined : icon}
      disabled={disabled}
      className={disabled ? '' : toneClass[tone]}
      onClick={onClick}
    >
      {showLabel && label}
    </Button>
  )

  return showLabel ? button : <HintTooltip title={label}>{button}</HintTooltip>
}
