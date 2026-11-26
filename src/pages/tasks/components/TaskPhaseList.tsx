import { useState } from 'react'
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons'
import { Button, Card, Checkbox, Progress } from 'antd'

import type { AuthUser } from '../../../types/auth'
import type { CourseTasksCourse, CourseTaskView } from '../../../types/courseTasks'

import DeadlineTag from '../../home/components/DeadlineTag'
import { getCurrentAction, getTaskPermissions } from '../courseTasksData'

import DeadlineChange from './DeadlineChange'
import { formatDateWithDay } from '../../../utils/date'

const taskLimit = 3

type TaskPhaseListProps = {
  course: CourseTasksCourse
  tasks: CourseTaskView[]
  user: AuthUser
  isMobile: boolean
  onOpenTask: (taskId: string) => void
  onComplete: (taskId: string) => void
  disabled?: boolean
}

export default function TaskPhaseList({
  course,
  tasks,
  user,
  isMobile,
  onOpenTask,
  onComplete,
  disabled = false,
}: TaskPhaseListProps) {
  const [openPhases, setOpenPhases] = useState<Record<string, boolean>>({})
  const [expandedTasks, setExpandedTasks] = useState<Record<string, boolean>>({})

  function togglePhase(phaseId: string, isOpen: boolean) {
    setOpenPhases((current) => ({ ...current, [phaseId]: !isOpen }))
  }

  return (
    <div className="flex flex-col gap-sm min-[992px]:gap-lg">
      {course.phases.map((phase, phaseIndex) => {
        const phaseTasks = tasks.filter((task) => task.phaseId === phase.id)
        const completedTasks = phaseTasks.filter((task) => task.isCompleted)
        const pendingTasks = phaseTasks.filter((task) => !task.isCompleted)
        const totalCount = phaseTasks.length
        const completedCount = completedTasks.length

        const hasPendingReview = completedTasks.some((task) =>
          getTaskPermissions(user, course, task).canReview,
        )
        const isAllCompleted = totalCount > 0 && pendingTasks.length === 0
        const isInitiallyOpen = isMobile ? phaseIndex === 0 : phase.defaultOpen
        const defaultOpen = hasPendingReview || (!isAllCompleted && isInitiallyOpen)

        const isOpen = openPhases[phase.id] ?? defaultOpen
        const isTasksOpen = expandedTasks[phase.id] ?? false
        const orderedTasks = [...pendingTasks, ...completedTasks]
        const hasMore = orderedTasks.length > taskLimit
        const visibleTasks = isTasksOpen ? orderedTasks : orderedTasks.slice(0, taskLimit)
        const hasCheckbox = visibleTasks.some((task) => getTaskPermissions(user, course, task).showCheckbox)
        const progressPercent = totalCount > 0
          ? Math.round(completedCount / totalCount * 100)
          : 0

        return (
          <Card key={phase.id} variant="borderless" className={`shadow-none min-[992px]:rounded-none min-[992px]:border-0 min-[992px]:border-solid min-[992px]:border-(--ant-color-border-secondary) min-[992px]:last:border-b-0 ${isOpen && !hasMore ? 'min-[992px]:border-b' : ''}`}
            classNames={{ body: `p-md min-[992px]:p-0 ${isOpen && !hasMore && phaseIndex < course.phases.length - 1 ? 'min-[992px]:pb-xs' : ''}` }}>
            <div className="flex min-w-0 items-center gap-xs min-[992px]:px-md">
              <button
                type="button" aria-label={phase.name}
                aria-expanded={isOpen} aria-controls={`${course.id}-${phase.id}`} onClick={() => togglePhase(phase.id, isOpen)}
                className="flex min-w-0 flex-1 items-center gap-xs border-0 bg-transparent p-0 text-left text-body text-(--ant-color-text) min-[992px]:flex-initial"
              >
                <span className="truncate font-bold">{phase.name}</span>
                <span className="shrink-0 text-caption text-(--ant-color-text-secondary)">{completedCount} / {totalCount}{!isMobile && ' 완료'}</span>
                {!isMobile && <span className="w-20 shrink-0"><Progress percent={progressPercent} status="normal" strokeColor="var(--ant-color-primary)" showInfo={false} size="small" className="m-0" /></span>}
              </button>
              <Button
                type="link" size="small" aria-label={`${phase.name} ${isOpen ? '접기' : '펼치기'}`}
                aria-expanded={isOpen} aria-controls={`${course.id}-${phase.id}`} onClick={() => togglePhase(phase.id, isOpen)}
                className="h-auto shrink-0 gap-xxs px-0 py-0 text-caption"
                icon={isOpen ? <CaretUpOutlined /> : <CaretDownOutlined />} iconPlacement="end"
              >
                {isOpen ? '접기' : '펼치기'}
              </Button>
            </div>

            {isOpen && (
              <div id={`${course.id}-${phase.id}`} className="mt-xs min-[992px]:mt-sm">
                <ul className="m-0 list-none p-0">
                  {visibleTasks.map((task) => {
                    const permissions = getTaskPermissions(user, course, task)
                    const completion = getCurrentAction(task, 'COMPLETE')
                    const review = getCurrentAction(task, 'REVIEW')

                    return (
                      <li key={task.id} className="flex min-h-14 items-center gap-xs border-0 border-b border-solid border-(--ant-color-border-secondary) px-xxs py-xs last:border-b-0 min-[992px]:px-md">
                        {permissions.showCheckbox ? (
                          <Checkbox aria-label={`${task.title} 완료`} checked={task.isCompleted} disabled={disabled || !permissions.canComplete}
                            onChange={() => onComplete(task.id)} className="shrink-0"
                            classNames={{ icon: task.isCompleted ? 'border-(--ant-color-primary)! bg-(--ant-color-primary)! after:border-(--ant-color-white)!' : '' }} />
                        ) : hasCheckbox && <span aria-hidden className="w-4 shrink-0" />}
                        <div className="flex min-w-0 flex-1 flex-col gap-xxs">
                          <button type="button" onClick={() => onOpenTask(task.id)} className="block max-w-full truncate border-0 bg-transparent p-0 text-left text-body leading-5 text-(--ant-color-text) hover:text-(--ant-color-primary-text)">
                            {task.title}
                          </button>
                          <p className="m-0 truncate text-caption leading-4 text-(--ant-color-text-tertiary)">
                            {(!isMobile || !completion) && `${task.tag ? `${task.tag} · ` : ''}${task.areaName} · `}
                            {completion ? `${completion.actor.name} 완료 ${formatDateWithDay(completion.createdAt)}` : task.isCompleted && task.completedBy ? `${task.completedBy} 완료` : task.assignees.map((assignee) => assignee.name).join(', ')}
                            {review && ` · 확인 ${review.actor.name}`}
                          </p>
                          {task.rawDueDate !== task.dueDate && task.rawDueDate && task.dueDate && (
                            <p className="m-0 leading-4">
                              <DeadlineChange rawDueDate={task.rawDueDate} dueDate={task.dueDate} shiftReasons={task.shiftReasons} showReason={!isMobile} />
                            </p>
                          )}
                        </div>
                        <span className="shrink-0"><DeadlineTag task={task} showReviewStatus={task.requiresReview} /></span>
                      </li>
                    )
                  })}
                </ul>
                {hasMore && (
                  <Button type="link" block aria-expanded={isTasksOpen} aria-label={`${phase.name} 할 일 ${isTasksOpen ? '접기' : `${orderedTasks.length - taskLimit}건 더 보기`}`}
                    className={`h-11 items-center px-md py-xs text-caption leading-5 ${isMobile ? '' : 'justify-start'}`} onClick={() => setExpandedTasks((current) => ({ ...current, [phase.id]: !isTasksOpen }))}>
                    <span className="inline-flex items-center gap-xs">{isTasksOpen ? '접기' : `${orderedTasks.length - taskLimit}건 더 보기`}{isTasksOpen ? <CaretUpOutlined /> : <CaretDownOutlined />}</span>
                  </Button>
                )}
                {totalCount === 0 && <p className="m-0 py-sm text-caption text-(--ant-color-text-tertiary)">해당하는 할 일이 없어요.</p>}
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}
