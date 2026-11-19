import { useState } from 'react'
import { Button, Card, Progress, Select, Table } from 'antd'
import type { TableColumnsType } from 'antd'
import { Link } from 'react-router'

import type { HomeCourse } from '../../../types/home'

import { getCourseTasksPath } from '../taskLinks'
import DeadlineTag from './DeadlineTag'

type CourseListProps = {
  courses: HomeCourse[]
  isMobile: boolean
}

function CourseProgress({ course }: { course: HomeCourse }) {
  const percent = course.totalCount > 0
    ? Math.round((course.completedCount / course.totalCount) * 100)
    : 0

  return (
    <div className="flex items-center gap-xs">
      <Progress
        aria-label={`${course.name} 진행률`}
        percent={percent}
        showInfo={false}
        size="small"
        className="m-0 min-w-0 flex-1"
      />
      <span className="shrink-0 text-caption text-(--ant-color-text-secondary)">
        {course.completedCount} / {course.totalCount}
      </span>
    </div>
  )
}

export default function CourseList({ courses, isMobile }: CourseListProps) {
  const [selectedCourseId, setSelectedCourseId] = useState('all')
  const [sortBy, setSortBy] = useState('deadline')
  const [showAll, setShowAll] = useState(false)

  const filteredCourses = courses
    .filter((course) => isMobile || selectedCourseId === 'all' || course.id === selectedCourseId)
    .sort((a, b) => {
      if (sortBy === 'name') return a.name.localeCompare(b.name, 'ko')
      const aDueDate = a.nextTask?.dueDate
      const bDueDate = b.nextTask?.dueDate
      if (!aDueDate || !bDueDate) return Number(!aDueDate) - Number(!bDueDate)
      return aDueDate.localeCompare(bDueDate)
    })
  const visibleCourses = isMobile && !showAll ? filteredCourses.slice(0, 3) : filteredCourses
  const remainingCount = filteredCourses.length - visibleCourses.length

  function renderPeriod(course: HomeCourse) {
    return `${course.startDate.replaceAll('-', '.')} ~ ${course.endDate.replaceAll('-', '.')}`
  }

  const columns: TableColumnsType<HomeCourse> = [
    {
      title: '과정명',
      dataIndex: 'name',
      width: '30%',
      render: (name: string, course) => (
        <Link to={getCourseTasksPath(course.id)} className="text-(--ant-color-text)">{name}</Link>
      ),
    },
    {
      title: '기간',
      key: 'period',
      width: '23%',
      render: (_, course) => (
        <span className="text-(--ant-color-text-secondary)">{renderPeriod(course)}</span>
      ),
    },
    {
      title: '진행률',
      key: 'progress',
      width: '22%',
      render: (_, course) => (
        <div className="max-w-[180px]"><CourseProgress course={course} /></div>
      ),
    },
    {
      title: '다음 할 일',
      key: 'nextTask',
      render: (_, course) => {
        const task = course.nextTask
        return task ? (
          <div className="flex flex-wrap items-center gap-xs">
            <span>{task.title}</span>
            <DeadlineTag task={task} />
          </div>
        ) : <span className="text-(--ant-color-text-tertiary)">없음</span>
      },
    },
  ]

  return (
    <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-md min-[992px]:p-lg' }}>
      <div className="mb-sm flex flex-wrap items-center justify-between gap-xs">
        <h2 className="m-0 flex items-center gap-xs text-card-title">
          내 과정 <span className="text-caption font-regular text-(--ant-color-text-secondary)">{courses.length}개</span>
        </h2>
        <div className="flex items-center gap-xs">
          {!isMobile && (
            <Select
              aria-label="과정 필터"
              prefix="과정 필터:"
              value={selectedCourseId}
              onChange={setSelectedCourseId}
              className="min-w-[116px] max-w-[240px] text-caption"
              popupMatchSelectWidth={240}
              options={[
                { value: 'all', label: '전체' },
                ...courses.map((course) => ({ value: course.id, label: course.name })),
              ]}
            />
          )}
          <Select
            aria-label="과정 정렬"
            variant={isMobile ? 'borderless' : 'outlined'}
            value={sortBy}
            onChange={setSortBy}
            className="w-[96px] text-caption"
            options={[{ value: 'deadline', label: '마감순' }, { value: 'name', label: '과정명순' }]}
          />
        </div>
      </div>

      {isMobile ? (
        <>
          <ul className="m-0 list-none p-0">
            {visibleCourses.map((course) => {
              const { nextTask } = course
              return (
                <li key={course.id} className="border-0 border-t border-solid border-(--ant-color-border-secondary) py-md">
                  <h3 className="m-0 text-body font-medium">
                    <Link to={getCourseTasksPath(course.id)} className="text-(--ant-color-text)">{course.name}</Link>
                  </h3>
                  <p className="mt-xxs mb-xs text-caption text-(--ant-color-text-secondary)">{renderPeriod(course)}</p>
                  <CourseProgress course={course} />
                  <div className="mt-xs flex flex-wrap items-center gap-xs text-caption">
                    <span>다음: {nextTask?.title ?? '없음'}</span>
                    {nextTask && <DeadlineTag task={nextTask} />}
                  </div>
                </li>
              )
            })}
          </ul>
          {(remainingCount > 0 || showAll) && filteredCourses.length > 3 && (
            <Button type="link" block onClick={() => setShowAll(!showAll)}>
              {showAll ? '접기' : `과정 ${remainingCount}개 더 보기`}
            </Button>
          )}
        </>
      ) : (
        <Table<HomeCourse>
          rowKey="id"
          columns={columns}
          dataSource={filteredCourses}
          pagination={false}
          size="small"
          rowHoverable={false}
          classNames={{
            header: { cell: 'px-sm py-sm text-caption font-regular text-(--ant-color-text-secondary)' },
            body: { cell: 'px-sm py-md' },
          }}
        />
      )}
    </Card>
  )
}
