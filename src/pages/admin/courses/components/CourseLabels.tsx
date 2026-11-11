import { WarningOutlined } from '@ant-design/icons'
import { Tag } from 'antd'

import type { ManagedCourse } from '../../../../types/adminCourses'
import { getAssignmentIssues, getCoursePeriod, getCourseState } from '../courseManagementData'
import { courseAreas } from '../courseManagementMockData'

export function CourseStateTag({ course }: { course: ManagedCourse }) {
  const state = getCourseState(course)
  return (
    <Tag
      variant="outlined"
      className="m-0 text-caption"
      color={state === '예정' ? 'processing' : state === '진행 중' ? 'success' : undefined}
    >
      {state}
    </Tag>
  )
}

export function CourseLengthTag({ startDate, endDate }: { startDate: string; endDate: string }) {
  return (
    <Tag variant="filled" className="m-0 text-caption">
      {getCoursePeriod(startDate, endDate).label}
    </Tag>
  )
}

export function AssignmentStatus({ course }: { course: ManagedCourse }) {
  const { empty, inactive } = getAssignmentIssues(course.assignees)

  if (!empty && !inactive)
    return <span className="text-caption text-(--ant-color-text-secondary)">영역 {courseAreas.length}개 모두 배정</span>

  return (
    <span className="flex flex-wrap gap-xxs">
      {empty > 0 && (
        <Tag variant="outlined" icon={<WarningOutlined />} color="error" className="m-0 text-caption">
          담당자 없는 영역 {empty}개
        </Tag>
      )}
      {inactive > 0 && (
        <Tag variant="outlined" icon={<WarningOutlined />} color="warning" className="m-0 text-caption">
          비활성 담당자 {inactive}명
        </Tag>
      )}
    </span>
  )
}
