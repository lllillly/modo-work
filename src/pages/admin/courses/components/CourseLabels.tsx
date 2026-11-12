import { WarningOutlined } from '@ant-design/icons'
import { Tag } from 'antd'

import type { ManagedCourse } from '../../../../types/adminCourses'
import { getCourseState, getInactiveAssignees } from '../courseManagementData'

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

export function CourseLengthTag({ lengthType }: Pick<ManagedCourse, 'lengthType'>) {
  return (
    <Tag variant="filled" className="m-0 text-caption">
      {lengthType === 'LONG' ? '장기' : '단기'}
    </Tag>
  )
}

export function AssignmentStatus({ course, requiredAreaIds }: {
  course: ManagedCourse
  requiredAreaIds?: string[]
}) {
  const assignedCount = Object.values(course.assignees).filter((ids) => ids.length > 0).length
  const inactive = getInactiveAssignees(course).length
  const targetAreas = new Set([...(requiredAreaIds ?? []), ...Object.keys(course.assignees)])
  const unassigned = [...targetAreas].filter((id) => !course.assignees[id]?.length).length

  let assignmentLabel = `영역 ${assignedCount}개 배정`
  if (requiredAreaIds !== undefined) {
    if (targetAreas.size === 0) assignmentLabel = '배정 대상 영역 없음'
    else if (unassigned > 0) assignmentLabel = `미배정 영역 ${unassigned}개`
    else assignmentLabel = `영역 ${targetAreas.size}개 모두 배정`
  }

  return (
    <span className="flex flex-wrap gap-xxs">
      <span className="text-caption text-(--ant-color-text-secondary)">
        {assignmentLabel}
      </span>
      {inactive > 0 && (
        <Tag variant="outlined" icon={<WarningOutlined />} color="warning" className="m-0 text-caption">
          비활성 담당자 {inactive}명
        </Tag>
      )}
    </span>
  )
}
