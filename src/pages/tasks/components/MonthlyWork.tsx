import { useState } from 'react'
import { Button, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'

import type { CourseTaskView, MonthlyCycle } from '../../../types/courseTasks'
import { formatTaskDate } from '../courseTasksData'

type MonthlyWorkProps = {
  cycles: MonthlyCycle[]
  tasks: CourseTaskView[]
  today: string
  courseEndDate: string
  offsetDays?: number
  onOpenTask: (taskId: string) => void
}

type CycleGroup = {
  key: string
  number: number
  startDate: string
  endDate: string
  items: MonthlyCycle[]
}

function groupCycles(cycles: MonthlyCycle[]) {
  const groups = new Map<string, CycleGroup>()
  for (const cycle of cycles) {
    const key = `${cycle.number}:${cycle.startDate}`
    const group = groups.get(key) ?? { key, number: cycle.number, startDate: cycle.startDate, endDate: cycle.endDate, items: [] }
    group.items.push(cycle)
    groups.set(key, group)
  }
  return [...groups.values()]
}

export default function MonthlyWork({ cycles, tasks, today, courseEndDate, offsetDays, onOpenTask }: MonthlyWorkProps) {
  const [showAll, setShowAll] = useState(false)
  const groups = groupCycles(cycles)
  const isCurrent = (group: CycleGroup) => group.startDate <= today && group.endDate >= today
  const upcomingIndex = groups.findIndex((group) => group.endDate >= today)
  const centerIndex = upcomingIndex === -1 ? groups.length - 1 : upcomingIndex
  const visibleGroups = showAll ? groups : groups.slice(centerIndex, centerIndex + 1)

  const columns: TableColumnsType<CycleGroup> = [
    { title: '주기', dataIndex: 'number', width: 48 },
    {
      title: '기간', key: 'period', width: '44%',
      render: (_, group) => (
        <span className="flex flex-wrap items-center gap-xxs">
          {formatTaskDate(group.startDate).split('(')[0]} ~ {formatTaskDate(group.endDate).split('(')[0]}
          {isCurrent(group) && <span className="text-[11px] font-medium text-(--ant-color-primary)">현재</span>}
        </span>
      ),
    },
    {
      title: '주기 할 일 마감', key: 'deadline',
      render: (_, group) => (
        <ul className="m-0 flex list-none flex-col gap-xs p-0">
          {group.items.map(({ taskId, ...cycle }) => (
            <li key={cycle.id ?? cycle.dueDate} className="flex flex-wrap items-center gap-xxs">
              {formatTaskDate(cycle.dueDate)}
              {cycle.title && (taskId ? (
                <Button type="link" onClick={() => onOpenTask(taskId)} className="h-auto p-0 text-[11px] text-(--ant-color-text-tertiary)">{cycle.title}</Button>
              ) : <span className="text-[11px] text-(--ant-color-text-tertiary)">{cycle.title}</span>)}
              {cycle.rawDueDate !== cycle.dueDate && <span className="text-[11px] text-(--ant-color-text-tertiary)">{formatTaskDate(cycle.rawDueDate).split('(')[0]} 당김</span>}
              {cycle.dueDate > courseEndDate && <span className="text-[11px] text-(--ant-color-text-tertiary)">종료일 뒤</span>}
            </li>
          ))}
        </ul>
      ),
    },
  ]

  return (
    <>
      <h3 className="m-0 mb-md flex flex-wrap items-center gap-xs text-body leading-5 font-medium">
        월 주기 <span className="text-caption font-regular text-(--ant-color-text-tertiary)">{offsetDays !== undefined && <>주기 종료일 {offsetDays >= 0 ? '+' : '-'} {Math.abs(offsetDays)}일</>}{today > courseEndDate && ' · 모든 주기 종료'}</span>
      </h3>
      <Table<CycleGroup>
        rowKey="key" columns={columns} dataSource={visibleGroups} size="small" pagination={false} rowHoverable={false}
        rowClassName={(group) => isCurrent(group) ? '[&>td]:bg-(--ant-color-primary-bg) [&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md [&>td:not(:last-child)]:text-(--ant-color-primary)' : ''}
        classNames={{ header: { cell: 'rounded-none! px-xs py-xs text-caption font-regular text-(--ant-color-text-secondary)' }, body: { cell: 'border-b-0! px-xs py-sm text-caption' } }}
      />
      {groups.length > 1 && (
        <Button type="link" block onClick={() => setShowAll(!showAll)}>{showAll ? '접기' : `회차 ${groups.length - 1}개 더 보기`}</Button>
      )}

      <div className="mt-md border-0 border-t border-solid border-(--ant-color-border-secondary) pt-md">
        <h3 className="m-0 mb-sm flex items-center gap-xs text-body leading-5 font-bold">상시 업무 <span className="text-caption font-regular text-(--ant-color-text-tertiary)">마감 없음</span></h3>
        <ul className="m-0 list-none p-0">
          {tasks.map((task) => (
            <li key={task.id} className="flex items-center justify-between gap-xs border-0 border-b border-solid border-(--ant-color-border-secondary) py-xs">
              <div className="min-w-0">
                <Button type="link" onClick={() => onOpenTask(task.id)} className="h-auto max-w-full truncate p-0 text-body leading-5 text-(--ant-color-text)">{task.title}</Button>
                <p className="m-0 truncate text-caption leading-[18px] text-(--ant-color-text-tertiary)">{task.areaName} · {task.assignees.map((assignee) => assignee.name).join(', ')}</p>
              </div>
              <Tag className="m-0 shrink-0" variant="filled">상시</Tag>
            </li>
          ))}
        </ul>
      </div>
    </>
  )
}
