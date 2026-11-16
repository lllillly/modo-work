import type { AskTurn } from './askData'

export type AskSession = {
  turns: AskTurn[]
  conversationId: string | null
  draft: string
}

const emptySession: AskSession = { turns: [], conversationId: null, draft: '' }
const sessions = new Map<string, AskSession>()
const listeners = new Set<() => void>()
let lastTurnId = 0

export const createTurnId = () => ++lastTurnId

export const getAskSession = (key: string) => sessions.get(key) ?? emptySession

export function subscribeAskSession(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function updateAskSession(key: string, update: (session: AskSession) => AskSession) {
  sessions.set(key, update(getAskSession(key)))
  listeners.forEach((listener) => listener())
}

export function resetAskSession(key?: string) {
  if (key) sessions.delete(key)
  else sessions.clear()
  listeners.forEach((listener) => listener())
}
