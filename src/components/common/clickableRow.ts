import type { KeyboardEvent, MouseEvent } from 'react'

export function clickableRowProps(open: (event?: MouseEvent<HTMLElement>) => void) {
  return {
    tabIndex: 0,
    onClick: (event: MouseEvent<HTMLElement>) => open(event),
    onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
      if (event.key === 'Enter' && event.target === event.currentTarget) open()
    },
  }
}
