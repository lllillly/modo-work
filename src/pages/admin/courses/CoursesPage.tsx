import { useCallback } from 'react'
import { Button, Result, Spin } from 'antd'
import { Link, Route, Routes, useOutletContext, useParams } from 'react-router'

import { getAssignmentContext, getCourse, getCourseOptions, getScheduleContext } from '../../../api/courses'
import { ApiError, getApiErrorMessage } from '../../../api/client'
import useApiQuery from '../../../hooks/useApiQuery'
import type { AppLayoutContext } from '../../../layouts/AppLayout'
import { useAuth } from '../../../providers/AuthContext'
import { toManagedCourse } from './courseManagementData'
import ArchivedCourses from './components/ArchivedCourses'
import CourseEditor from './components/CourseEditor'
import CourseImport from './components/CourseImport'
import CourseList from './components/CourseList'

// 백엔드 삭제와 보관, 복원 API 구현되면 연동 예정
// 목업의 상태 변경과 version 계산은 서버 응답으로 교체
/*
  function archiveCourse(course: ManagedCourse) {
    const archive = course.hasProcessingHistory
    modal.confirm({
      title: `${course.name}를 ${archive ? '보관' : '삭제'}할까요?`,
      centered: true,
      content: archive
        ? '처리 기록(완료·확인 등)이 있어 삭제하지 않고 보관해요. 보관한 과정은 목록에서 빠지고, 보관 목록에서 다시 복원할 수 있어요.'
        : '처리 기록이 없는 과정이에요. 과정과 미처리 할 일은 완전히 삭제되고 복원할 수 없어요.',
      okText: archive ? '보관' : '삭제',
      cancelText: '취소',
      okButtonProps: { danger: !archive },
      onOk: () => {
        setCourses((current) =>
          archive
            ? current.map((item) =>
                item.id === course.id
                  ? { ...item, archivedAt: new Date().toISOString(), archivedBy: actorName, version: item.version + 1 }
                  : item,
              )
            : current.filter((item) => item.id !== course.id),
        )
        message.success(archive ? '과정을 보관했어요.' : '과정을 삭제했어요.')
      },
    })
  }

  function restoreCourse(course: ManagedCourse) {
    setCourses((current) =>
      current.map((item) =>
        item.id === course.id ? { ...item, archivedAt: null, archivedBy: null, version: item.version + 1 } : item,
      ),
    )
    message.success('과정을 복원했어요.')
  }
*/

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
      <Result
        status="warning"
        title="과정을 불러오지 못했어요"
        subTitle={getApiErrorMessage(query.error)}
        extra={
          <>
            <Button onClick={query.reload}>다시 시도</Button>
            <Link to="/admin/courses">목록으로</Link>
          </>
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

  if (!user?.roles.some((role) => role.role === 'ADMIN')) {
    return (
      <Result
        status="403"
        title="이 화면에 접근할 권한이 없어요"
        subTitle="과정과 담당 배정은 관리자만 관리할 수 있어요."
        extra={
          <Link to="/">
            <Button type="primary">홈으로</Button>
          </Link>
        }
      />
    )
  }
  if (!selectedBusinessId) {
    return <Result status="info" title="선택할 수 있는 사업이 없어요" />
  }

  return (
    <Routes key={selectedBusinessId}>
      <Route index element={<CourseList businessId={selectedBusinessId} isMobile={isMobile} />} />
      <Route path="new" element={<CourseEditorRoute businessId={selectedBusinessId} />} />
      <Route path=":courseId" element={<CourseEditorRoute businessId={selectedBusinessId} />} />
      <Route path="archived" element={<ArchivedCourses />} />
      <Route
        path="import"
        element={
          <CourseImport businessId={selectedBusinessId} business={selectedBusiness} isMobile={isMobile} />
        }
      />
      <Route
        path="*"
        element={
          <Result
            status="404"
            title="페이지를 찾을 수 없어요"
            extra={<Link to="/admin/courses">목록으로</Link>}
          />
        }
      />
    </Routes>
  )
}
