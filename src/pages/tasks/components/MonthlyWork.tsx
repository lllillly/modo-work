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

export default function MonthlyWork({ cycles, tasks, today, courseEndDate, offsetDays, onOpenTask }: MonthlyWorkProps) {
  const columns: TableColumnsType<MonthlyCycle> = [
    { title: '주기', dataIndex: 'number', width: 48 },
    { title: '기간', key: 'period', width: '44%', render: (_, cycle) => `${formatTaskDate(cycle.startDate).split('(')[0]} ~ ${formatTaskDate(cycle.endDate).split('(')[0]}` },
    {
      title: '주기 할 일 마감', key: 'deadline',
      render: (_, cycle) => (
        <span className="flex flex-wrap items-center gap-xxs">
          {formatTaskDate(cycle.dueDate)}
          {cycle.title && <span className="text-[11px] text-(--ant-color-text-tertiary)">{cycle.title}</span>}
          {cycle.rawDueDate !== cycle.dueDate && <span className="text-[11px] text-(--ant-color-text-tertiary)">{formatTaskDate(cycle.rawDueDate).split('(')[0]} 당김</span>}
          {cycle.dueDate > courseEndDate && <span className="text-[11px] text-(--ant-color-text-tertiary)">종료일 뒤</span>}
          {cycle.startDate <= today && cycle.endDate >= today && <span className="text-[11px] font-medium text-(--ant-color-primary)">현재</span>}
        </span>
      ),
    },
  ]

  return (
    <>
      <h3 className="m-0 mb-md flex flex-wrap items-center gap-xs text-body leading-5 font-medium">
        월 주기 <span className="text-caption font-regular text-(--ant-color-text-tertiary)">{offsetDays !== undefined && <>주기 종료일 {offsetDays >= 0 ? '+' : '-'} {Math.abs(offsetDays)}일</>}{today > courseEndDate && ' · 모든 주기 종료'}</span>
      </h3>
      <Table<MonthlyCycle>
        rowKey={(cycle) => cycle.id ?? String(cycle.number)} columns={columns} dataSource={cycles} size="small" pagination={false} rowHoverable={false}
        rowClassName={(cycle) => cycle.startDate <= today && cycle.endDate >= today ? '[&>td]:bg-(--ant-color-primary-bg) [&>td:first-child]:rounded-l-md [&>td:last-child]:rounded-r-md [&>td:not(:last-child)]:text-(--ant-color-primary)' : ''}
        classNames={{ header: { cell: 'rounded-none! px-xs py-xs text-caption font-regular text-(--ant-color-text-secondary)' }, body: { cell: 'border-b-0! px-xs py-sm text-caption' } }}
      />

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
