import { useCallback } from 'react'
import { Button, Spin } from 'antd'
import { Link, Route, Routes, useOutletContext, useParams } from 'react-router'

import { getAssignmentContext, getCourse, getCourseOptions, getScheduleContext } from '../../../api/courses'
import { ApiError } from '../../../api/client'
import useApiQuery from '../../../hooks/useApiQuery'
import type { AppLayoutContext } from '../../../layouts/AppLayout'
import { useAuth } from '../../../providers/AuthContext'
import LoadingError from '../../../components/common/LoadingError'
import EmptyData from '../../../components/common/EmptyData'
import NoPermission from '../../../components/common/NoPermission'
import PageNotFound from '../../../components/common/PageNotFound'
import { isAdmin } from '../../../utils/roles'
import { toManagedCourse } from './courseManagementData'
import ArchivedCourses from './components/ArchivedCourses'
import CourseEditor from './components/CourseEditor'
import CourseImport from './components/CourseImport'
import CourseList from './components/CourseList'

type CourseRouteProps = { businessId: string }

function CourseEditorRoute({ businessId }: CourseRouteProps) {
  const { courseId } = useParams()
  const load = useCallback(
    async (signal: AbortSignal) => {
      if (!courseId) {
        const options = await getCourseOptions(businessId, signal)
        return { ...options, course: undefined, schedule: undefined, assignment: undefined }
      }

      const [options, detail, schedule, assignment] = await Promise.all([
        getCourseOptions(businessId, signal),
        getCourse(courseId, signal),
        getScheduleContext(courseId, signal),
        getAssignmentContext(courseId, signal),
      ])
      if (detail.course.businessId !== businessId) {
        throw new ApiError(404, {
          code: 'NOT_FOUND',
          message: '선택한 사업의 과정이 아니에요.',
          fieldErrors: [],
        })
      }
      // 서로 다른 시점의 조회 결과로 저장하지 않고 전체 정보를 다시 받도록 안내한다.
      if (
        detail.course.version !== schedule.course.version ||
        detail.course.version !== assignment.course.version
      ) {
        throw new ApiError(409, {
          code: 'CONFLICT',
          message: '조회 중 과정이 변경됐어요. 다시 불러와 주세요.',
          fieldErrors: [],
        })
      }
      return { ...options, course: toManagedCourse(detail.course), schedule, assignment }
    },
    [businessId, courseId],
  )
  const query = useApiQuery(`${businessId}:${courseId ?? 'new'}`, load)

  if (query.isLoading) return <Spin className="m-auto" aria-label="과정 정보 불러오는 중" />
  if (query.error) {
    return (
      <LoadingError
        title="과정을 불러오지 못했어요"
        error={query.error}
        onRetry={query.reload}
        extra={
          <Link to="/admin/courses">
            <Button className="h-7">목록으로</Button>
          </Link>
        }
      />
    )
  }
  if (!query.data) return null

  return (
    <CourseEditor
      key={`${businessId}:${courseId ?? 'new'}`}
      businessId={businessId}
      {...query.data}
      onReload={query.reload}
    />
  )
}

export default function CoursesPage() {
  const { isMobile, selectedBusiness, selectedBusinessId } = useOutletContext<AppLayoutContext>()
  const { user } = useAuth()

  if (!isAdmin(user)) {
    return (
      <NoPermission description="과정과 담당 배정은 관리자만 관리할 수 있어요." />
    )
  }
  if (!selectedBusinessId) {
    return <EmptyData title="선택할 수 있는 사업이 없어요" />
  }

  return (
    <Routes key={selectedBusinessId}>
      <Route index element={<CourseList businessId={selectedBusinessId} isMobile={isMobile} />} />
      <Route path="new" element={<CourseEditorRoute businessId={selectedBusinessId} />} />
      <Route path=":courseId" element={<CourseEditorRoute businessId={selectedBusinessId} />} />
      <Route path="archived" element={<ArchivedCourses businessId={selectedBusinessId} isMobile={isMobile} />} />
      <Route
        path="import"
        element={
          <CourseImport businessId={selectedBusinessId} business={selectedBusiness} isMobile={isMobile} />
        }
      />
      <Route
        path="*"
        element={
          <PageNotFound backTo="/admin/courses" backLabel="과정 목록으로" />
        }
      />
    </Routes>
  )
}
