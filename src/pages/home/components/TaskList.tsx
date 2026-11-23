import type { ReactNode } from 'react'
import { Checkbox, Empty } from 'antd'
import { Link } from 'react-router'

import type { HomeTask } from '../../../types/home'

import { getCourseTasksPath } from '../taskLinks'
import DeadlineTag from './DeadlineTag'

type TaskListProps<T extends HomeTask> = {
  tasks: T[]
  showCheckbox?: boolean
  hasMore?: boolean
  onComplete?: (taskId: string) => void
  renderDescription?: (task: T) => ReactNode
}

const rowClassName = 'm-0 flex min-h-14 min-w-0 flex-1 items-center gap-sm px-xxs py-xs min-[992px]:px-md'

export default function TaskList<T extends HomeTask>({ tasks, showCheckbox = false, hasMore = false, onComplete, renderDescription }: TaskListProps<T>) {
  const hasCheckbox = showCheckbox && tasks.some((task) => task.canComplete)

  if (tasks.length === 0) {
    return <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="이날의 할 일이 없어요" className="my-lg" />
  }

  return (
    <ul className="m-0 list-none p-0">
      {tasks.map((task) => {
        const content = (
          <Link to={getCourseTasksPath(task.courseId, task.id)} className="flex min-w-0 flex-1 items-center gap-sm">
            <span className="min-w-0 flex-1">
              <span className="block truncate text-body leading-[21px] text-(--ant-color-text)">{task.title}</span>
              <span className="block text-caption leading-[18px] text-(--ant-color-text-tertiary)">
                {renderDescription ? renderDescription(task) : (
                  <>
                    {task.courseName} - {task.areaName}
                    {task.isCompleted && task.completedBy && (
                      <span className="inline-block max-w-full truncate align-bottom"> - {task.completedBy} 완료</span>
                    )}
                  </>
                )}
              </span>
            </span>
            <span className="shrink-0"><DeadlineTag task={task} /></span>
          </Link>
        )

        return (
          <li key={task.id} className={`flex items-center border-0 border-b border-solid border-(--ant-color-border-secondary) transition-colors hover:rounded-lg hover:bg-(--row-hover) ${hasMore ? 'last:border-b-0' : ''}`}>
            <div className={rowClassName}>
              {task.canComplete && hasCheckbox ? (
                <Checkbox
                  aria-label={`${task.title} 완료`}
                  checked={task.isCompleted}
                  disabled={task.isCompleted}
                  onChange={() => onComplete?.(task.id)}
                  className="shrink-0"
                />
              ) : hasCheckbox && <span aria-hidden className="w-4 shrink-0" />}
              {content}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
