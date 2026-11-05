import { useState } from 'react'
import { MinusOutlined } from '@ant-design/icons'
import { Button, Card, Progress, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import { Link, useNavigate } from 'react-router'

import type { LeaderArea, LeaderHomeCourse } from '../../../types/leaderHome'
import DeadlineTag from './DeadlineTag'

type LeaderCourseListProps = {
  courses: LeaderHomeCourse[]
  areas: LeaderArea[]
  isMobile: boolean
  ownOrgUnitId?: string
}

function getCourseUrl(courseId: string) {
  return `/tasks?courseId=${encodeURIComponent(courseId)}`
}

function AreaProgress({ course, areaId }: { course: LeaderHomeCourse; areaId: string }) {
  const assignment = course.areas.find(({ area }) => area.id === areaId)
  if (!assignment?.canView) {
    return <span className="flex items-center gap-xxs text-caption text-(--ant-color-text-tertiary)"><MinusOutlined />범위 밖</span>
  }

  const percent = assignment.totalCount > 0 ? Math.round(assignment.completedCount / assignment.totalCount * 100) : 0
  return (
    <div className="flex max-w-[180px] flex-col gap-xxs">
      <div className="flex items-center gap-xs">
        <Progress aria-label={`${course.name} ${assignment.area.name} 진행률`} percent={percent} showInfo={false} size="small" className="m-0 min-w-0 flex-1" />
        <span className="w-9 shrink-0 text-caption text-(--ant-color-text-secondary)">{percent}%</span>
      </div>
      {!assignment.canReview && <span className="text-caption text-(--ant-color-text-tertiary)">보기만 가능</span>}
    </div>
  )
}

export default function LeaderCourseList({ courses, areas, isMobile, ownOrgUnitId }: LeaderCourseListProps) {
  const navigate = useNavigate()
  const [showAll, setShowAll] = useState(false)
  const visibleCourses = isMobile && !showAll ? courses.slice(0, 4) : courses

  const columns: TableColumnsType<LeaderHomeCourse> = [
    {
      title: '과정', dataIndex: 'name', width: '20%',
      render: (name: string, course) => (
        <Link to={getCourseUrl(course.id)} className="text-(--ant-color-text)">{name}</Link>
      ),
    },
    {
      title: '조직 단위', key: 'orgUnit',
      render: (_, course) => (
        <span className="flex flex-wrap items-center gap-xxs">
          {course.orgUnit.name}
          {course.orgUnit.isClosed && <Tag className="m-0">폐쇄</Tag>}
        </span>
      ),
    },
    { title: '담당', key: 'assignees', render: (_, course) => course.assigneeNames.join(' / ') },
    ...areas.map((area) => ({
      title: area.name, key: area.id, width: '17%',
      render: (_: unknown, course: LeaderHomeCourse) => <AreaProgress course={course} areaId={area.id} />,
    })),
    {
      title: '기한 지남', key: 'overdue',
      render: (_, course) => (
        <span className={course.overdueCount > 0 ? 'font-medium text-status-overdue-text' : 'text-(--ant-color-text-tertiary)'}>
          {course.overdueCount}
        </span>
      ),
    },
    {
      title: '다음 마감', key: 'deadline',
      render: (_, course) => course.nextTask
        ? <DeadlineTag task={course.nextTask} />
        : <span className="text-caption text-(--ant-color-text-tertiary)">없음</span>,
    },
  ]

  return (
    <Card variant="borderless" className="min-w-0 shadow-none" classNames={{ body: 'p-md min-[992px]:p-lg' }}>
      <div className="mb-sm flex flex-wrap items-center justify-between gap-xs">
        <h2 className="m-0 flex items-center gap-xs text-card-title">
          과정별 진행 <span className="text-caption font-regular text-(--ant-color-text-secondary)">{courses.length}개</span>
        </h2>
        {!isMobile && <span className="text-caption text-(--ant-color-text-tertiary)">행을 누르면 과정별 할 일로 이동해요</span>}
      </div>

      {isMobile ? (
        <ul className="m-0 list-none p-0">
          {visibleCourses.map((course) => (
            <li key={course.id} className="border-0 border-t border-solid border-(--ant-color-border-secondary) py-md">
              <div className="flex items-start justify-between gap-xs">
                <Link to={getCourseUrl(course.id)} className="min-w-0 text-body font-medium text-(--ant-color-text)">{course.name}</Link>
                {course.nextTask && <DeadlineTag task={course.nextTask} />}
              </div>
              <p className={`mt-xxs mb-xs text-caption ${course.overdueCount > 0 ? 'text-status-overdue-text' : 'text-(--ant-color-text-secondary)'}`}>
                {course.orgUnit.id !== ownOrgUnitId && `${course.orgUnit.name} - `}
                {course.orgUnit.isClosed && '폐쇄 - '}
                {course.assigneeNames.join(' / ')}
                {course.overdueCount > 0 && ` - 기한 지남 ${course.overdueCount}건`}
              </p>
              <div className="flex flex-col gap-xxs">
                {areas.map((area) => (
                  <div key={area.id} className="flex items-center gap-xs">
                    <span className="w-9 shrink-0 text-caption text-(--ant-color-text-tertiary)">{area.name}</span>
                    <div className="min-w-0 flex-1"><AreaProgress course={course} areaId={area.id} /></div>
                  </div>
                ))}
              </div>
            </li>
          ))}
          {visibleCourses.length < courses.length && (
            <li><Button type="link" block onClick={() => setShowAll(true)}>과정 {courses.length - visibleCourses.length}개 더 보기</Button></li>
          )}
        </ul>
      ) : (
        <Table<LeaderHomeCourse>
          rowKey="id" columns={columns} dataSource={courses} pagination={false} size="small" scroll={{ x: 900 }}
          onRow={(course) => ({
            onClick: (event) => {
              if (event.target instanceof Element && event.target.closest('a')) return
              void navigate(getCourseUrl(course.id))
            },
          })}
          rowClassName="cursor-pointer"
          classNames={{
            header: { cell: 'px-sm py-sm text-caption font-regular text-(--ant-color-text-secondary)' },
            body: { cell: 'px-sm py-md' },
          }}
        />
      )}
    </Card>
  )
}
