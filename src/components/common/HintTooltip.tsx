import { useEffect, useState } from 'react'
import { Tooltip } from 'antd'
import type { TooltipProps } from 'antd'

export default function HintTooltip(props: TooltipProps) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const close = () => setOpen(false)
    const timer = window.setTimeout(close, 2000)
    document.addEventListener('pointerdown', close)
    return () => {
      window.clearTimeout(timer)
      document.removeEventListener('pointerdown', close)
    }
  }, [open])

  return <Tooltip {...props} open={open} onOpenChange={setOpen} />
}
