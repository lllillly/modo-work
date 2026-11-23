import { createContext, useContext } from 'react'

export const HeaderTitleSlot = createContext<HTMLElement | null>(null)

export function useHeaderTitleSlot() {
  return useContext(HeaderTitleSlot)
}
