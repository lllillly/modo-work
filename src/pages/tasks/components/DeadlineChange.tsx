import { ArrowRightOutlined } from '@ant-design/icons'

import { formatTaskDate } from '../courseTasksData'

type DeadlineChangeProps = {
  rawDueDate: string
  dueDate: string
  shiftReasons: string[]
  showReason?: boolean
}

export default function DeadlineChange({ rawDueDate, dueDate, shiftReasons, showReason = true }: DeadlineChangeProps) {
  return (
    <span className="inline-flex max-w-full flex-wrap items-center gap-x-xxs gap-y-xxs text-caption leading-4 text-deadline-adjusted-text">
      <span className="inline-flex items-center gap-xxs whitespace-nowrap">
        <s className="text-(--ant-color-text-tertiary)">{formatTaskDate(rawDueDate)}</s>
        <ArrowRightOutlined aria-hidden className="text-[10px] text-(--ant-color-text-tertiary)" />
        <span className="sr-only">에서 </span>
        <span className="font-medium text-(--ant-color-text)">{formatTaskDate(dueDate)}</span>
      </span>
      <span><span className="sr-only">로 </span>당김</span>
      {showReason && shiftReasons.length > 0 && <span className="text-(--ant-color-text-tertiary)">({shiftReasons.join(', ')})</span>}
    </span>
  )
}
