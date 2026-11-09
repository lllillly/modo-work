import { useState } from 'react'
import { ArrowRightOutlined } from '@ant-design/icons'
import { Button, Card, Input, Modal } from 'antd'

import type { CourseTasksCourse } from '../../../types/courseTasks'
import { getToday } from '../../home/dateUtils'
import { formatActionTime } from '../courseTasksData'

type CourseScheduleProps = {
  course: CourseTasksCourse
  isMobile: boolean
}

export default function CourseSchedule({ course, isMobile }: CourseScheduleProps) {
  const [showHistory, setShowHistory] = useState(false)
  const isReadOnly = course.archived || course.endDate < getToday()

  return (
    <>
      <Card variant="borderless" className="shadow-none" classNames={{ body: isMobile ? 'p-0' : 'px-lg py-12' }}>
        <div className="flex flex-wrap items-center gap-xs min-[992px]:gap-sm">
          {isMobile ? <span className="text-body">{course.startDate} ~ {course.endDate}</span> : (
            <>
              <label htmlFor="course-start-date" className="text-caption text-(--ant-color-text-secondary)">시작일</label>
              <Input id="course-start-date" value={course.startDate} readOnly disabled={isReadOnly} className="w-[140px]" />
              <label htmlFor="course-end-date" className="text-caption text-(--ant-color-text-secondary)">종료일</label>
              <Input id="course-end-date" value={course.endDate} readOnly disabled={isReadOnly} className="w-[140px]" />
            </>
          )}
          <Button type="link" className="ml-auto px-0 text-caption" onClick={() => setShowHistory(true)}>변경 이력 {course.changeHistory.length}건</Button>
        </div>
      </Card>
      <Modal
        open={showHistory} title={<span className="text-card-title leading-5 font-bold">변경 이력 · {course.name}</span>}
        width={560} centered footer={null} className="max-w-[calc(100vw-32px)] pb-0" onCancel={() => setShowHistory(false)}
        mask={{ blur: false }} classNames={{ container: 'flex max-h-[calc(100svh-32px)] flex-col overflow-hidden p-lg shadow-none',
          header: 'mb-0 shrink-0 border-0 border-b border-solid border-(--ant-color-border-secondary) pb-md leading-5', title: 'pr-lg leading-5', body: 'min-h-0 overflow-y-auto' }}
      >
        {course.changeHistory.length === 0 ? <p className="my-md text-(--ant-color-text-secondary)">변경 이력이 없어요.</p> : (
          <ul aria-label="과정 변경 이력" className="m-0 list-none p-0">
            {[...course.changeHistory].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).map((entry) => (
              <li key={entry.id} className="flex flex-col gap-xs border-0 border-b border-solid border-(--ant-color-border-secondary) py-md last:border-b-0 last:pb-0">
                <p className="m-0 flex flex-wrap items-center gap-x-xs gap-y-xxs text-body leading-5">
                  <span className="font-medium">{entry.label}</span>
                  <span className="inline-flex flex-wrap items-center gap-xxs text-(--ant-color-primary)">
                    {entry.before}<ArrowRightOutlined aria-hidden className="text-caption" /><span className="sr-only">에서 </span>{entry.after}
                  </span>
                </p>
                <p className="m-0 text-caption text-(--ant-color-text-secondary)">{entry.reason ? `사유: ${entry.reason}` : '사유 없음 (진행 중 과정의 일반 수정)'}{entry.description && ` · ${entry.description}`}</p>
                <p className="m-0 text-caption text-(--ant-color-text-tertiary)"><time dateTime={entry.createdAt}>{formatActionTime(entry.createdAt, true)}</time> · {entry.actor}</p>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </>
  )
}
