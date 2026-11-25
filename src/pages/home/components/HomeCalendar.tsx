import { useState } from 'react'
import { Button } from 'antd'
import { CaretDownOutlined, CaretUpOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons'

import type { CalendarDay } from '../../../types/homeApi'
import { parseDate, toDateText } from '../../../utils/date'

type HomeCalendarProps = {
  selectedDate: string
  onSelectDate: (date: string) => void
  onMonthChange: (month: string) => void
  calendar: CalendarDay[]
  isMobile: boolean
  today: string
}

const weekdays = ['일', '월', '화', '수', '목', '금', '토']

export default function HomeCalendar({ selectedDate, onSelectDate, onMonthChange, calendar, isMobile, today }: HomeCalendarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [displayDate, setDisplayDate] = useState(selectedDate)
  const showMonth = !isMobile || isExpanded
  const date = parseDate(showMonth ? displayDate : selectedDate)
  const year = date.getFullYear()
  const month = date.getMonth()
  const firstWeekday = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cellCount = showMonth ? Math.ceil((firstWeekday + daysInMonth) / 7) * 7 : 7
  const weekStart = date.getDate() - date.getDay()
  const taskDates = new Map(calendar.map((day) => [day.date, day.overdueCount > 0]))

  function showDate(value: string) {
    setDisplayDate(value)
    onMonthChange(value.slice(0, 7))
  }

  function changeMonth(offset: number) {
    showDate(toDateText(new Date(year, month + offset, 1)))
  }

  function selectDate(value: string) {
    showDate(value)
    onSelectDate(value)
  }

  function toggleMonth() {
    if (!isExpanded) showDate(selectedDate)
    setIsExpanded(!isExpanded)
  }

  return (
    <div>
      {showMonth && (
        <div className="mb-xs flex items-center justify-between gap-xs">
          <h3 className="m-0 text-card-title">{year}년 {month + 1}월</h3>
          <div className="flex">
            <Button type="text" size="small" className="hit-area" aria-label="이전 달" icon={<LeftOutlined />} onClick={() => changeMonth(-1)} />
            <Button type="text" size="small" className="hit-area" aria-label="다음 달" icon={<RightOutlined />} onClick={() => changeMonth(1)} />
          </div>
        </div>
      )}

      <table className="w-full table-fixed border-collapse text-center" aria-label={showMonth ? `${year}년 ${month + 1}월 달력` : '주간 달력'}>
        <thead>
          <tr>
            {weekdays.map((weekday) => (
              <th key={weekday} scope="col" className="h-5 p-0 text-caption font-regular text-(--ant-color-text-tertiary) min-[992px]:h-6">{weekday}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: cellCount / 7 }, (_, week) => (
            <tr key={week}>
              {weekdays.map((_, weekday) => {
                const day = showMonth ? week * 7 + weekday - firstWeekday + 1 : weekStart + weekday
                const isEmpty = showMonth && (day < 1 || day > daysInMonth)
                const cellDate = new Date(year, month, day)
                const value = toDateText(cellDate)
                const isSelected = value === selectedDate
                const isToday = value === today
                const hasTask = taskDates.has(value)
                const hasOverdue = taskDates.get(value)
                let dateClassName = 'bg-transparent text-(--ant-color-text) hover:bg-(--ant-color-fill-tertiary)'
                if (isToday) dateClassName = 'bg-transparent font-medium text-(--ant-color-primary-text) hover:bg-(--ant-color-fill-tertiary)'
                if (isSelected) dateClassName = 'bg-(--ant-color-primary-bg) font-medium text-(--ant-color-primary-text)'

                return (
                  <td key={weekday} className="h-11 p-0 min-[992px]:h-12">
                    {!isEmpty && (
                      <button
                        type="button"
                        aria-label={`${cellDate.getFullYear()}년 ${cellDate.getMonth() + 1}월 ${cellDate.getDate()}일`}
                        aria-pressed={isSelected}
                        aria-current={isToday ? 'date' : undefined}
                        onClick={() => selectDate(value)}
                        className={`mx-auto flex h-11 w-full max-w-10 cursor-pointer flex-col items-center justify-center gap-xxs rounded-md border-0 text-body focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ant-color-primary) ${dateClassName}`}
                      >
                        {cellDate.getDate()}
                        <span className={`h-1 w-1 rounded-full ${hasTask ? hasOverdue ? 'bg-status-overdue-base' : 'bg-(--ant-color-text-tertiary)' : 'bg-transparent'}`} />
                      </button>
                    )}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {isMobile ? (
        <div className="text-right">
          <Button
            type="link"
            size="small"
            className="px-0"
            icon={isExpanded ? <CaretUpOutlined aria-hidden="true" /> : <CaretDownOutlined aria-hidden="true" />}
            iconPlacement="end"
            aria-expanded={isExpanded}
            onClick={toggleMonth}
          >
            {isExpanded ? '월 접기' : '월 전체 보기'}
          </Button>
        </div>
      ) : (
        <div className="mt-xs flex flex-wrap gap-sm text-caption text-(--ant-color-text-tertiary)">
          <span className="flex items-center gap-xxs"><span className="h-2 w-2 rounded-full bg-(--ant-color-text-tertiary)" />미완료 할 일</span>
          <span className="flex items-center gap-xxs text-status-overdue-text"><span className="h-2 w-2 rounded-full bg-status-overdue-base" />기한 지남 포함</span>
        </div>
      )}
    </div>
  )
}
