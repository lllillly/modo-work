import type { Recalculation } from './courseApi'

export type Holiday = {
  id: string
  date: string
  name: string
  source: 'API' | 'MANUAL'
  version: number
}

export type HolidayRecalculation = Pick<Recalculation, 'updatedTaskCount' | 'deadlineChangedTaskCount'>
