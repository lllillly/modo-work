import { useEffect, useRef, useState } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { Button, Tooltip } from 'antd'

const LONG_PRESS_MS = 450
const TIP_HIDE_MS = 1200

export default function NewChatFab({ onClick }: { onClick: () => void }) {
  const [isTipOpen, setIsTipOpen] = useState(false)
  const pressTimer = useRef<number | undefined>(undefined)
  const hideTimer = useRef<number | undefined>(undefined)
  const wasLongPress = useRef(false)

  useEffect(() => {
    return () => {
      window.clearTimeout(pressTimer.current)
      window.clearTimeout(hideTimer.current)
    }
  }, [])

  function startPress() {
    wasLongPress.current = false
    window.clearTimeout(hideTimer.current)
    pressTimer.current = window.setTimeout(() => {
      wasLongPress.current = true
      setIsTipOpen(true)
    }, LONG_PRESS_MS)
  }

  function endPress() {
    window.clearTimeout(pressTimer.current)
    if (wasLongPress.current) hideTimer.current = window.setTimeout(() => setIsTipOpen(false), TIP_HIDE_MS)
  }

  return (
    <Tooltip title="새 대화" open={isTipOpen} placement="left">
      <Button
        type="primary"
        shape="circle"
        size="large"
        aria-label="새 대화"
        icon={<PlusOutlined />}
        className="absolute right-md bottom-[88px] z-10 size-12 shadow-lg"
        onPointerDown={startPress}
        onPointerUp={endPress}
        onPointerLeave={endPress}
        onPointerCancel={endPress}
        onContextMenu={(event) => event.preventDefault()}
        onClick={() => {
          if (wasLongPress.current) {
            wasLongPress.current = false
            return
          }
          onClick()
        }}
      />
    </Tooltip>
  )
}
