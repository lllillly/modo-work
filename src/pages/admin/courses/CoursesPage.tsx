import { useState } from 'react'
import { App, Button, Result } from 'antd'
import { Link, Route, Routes, useOutletContext, useParams } from 'react-router'

import type { AppLayoutContext } from '../../../layouts/AppLayout'
import type { CourseDraft, CourseSaveResult, ManagedCourse } from '../../../types/adminCourses'
import { useAuth } from '../../../providers/AuthContext'
import { formatCourseHistoryValue, getCourseState } from './courseManagementData'
import {
  courseSaveSummaryMock,
  createCourseManagementMockData,
} from './courseManagementMockData'
import ArchivedCourses from './components/ArchivedCourses'
import CourseEditor from './components/CourseEditor'
import CourseImport from './components/CourseImport'
import CourseList from './components/CourseList'

type CourseEditorRouteProps = {
  courses: ManagedCourse[]
  business: string
  onSave: (draft: CourseDraft, version?: number, reason?: string, courseId?: string) => CourseSaveResult | null
}

function CourseEditorRoute({ courses, business, onSave }: CourseEditorRouteProps) {
  const { courseId } = useParams()
  const course = courses.find((item) => item.id === courseId)
  if (courseId && !course)
    return <Result status="404" title="과정을 찾을 수 없어요" extra={<Link to="/admin/courses">목록으로</Link>} />
  return (
    <CourseEditor
      key={`${business}-${courseId ?? 'new'}`}
      course={course}
      onSave={(draft, version, reason) => onSave(draft, version, reason, courseId)}
    />
  )
}

export default function CoursesPage() {
  const { isMobile, selectedBusiness } = useOutletContext<AppLayoutContext>()
  const { user } = useAuth()
  const { modal, message } = App.useApp()
  const [courses, setCourses] = useState(createCourseManagementMockData)
  const visibleCourses = courses.filter((course) => course.businessName === selectedBusiness)

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

  const actorName = user.name

  function buildCourse(draft: CourseDraft, previous?: ManagedCourse, reason = ''): ManagedCourse {
    const now = new Date().toISOString()
    const history = [...(previous?.history ?? [])]
    if (previous) {
      const fields = ['externalKey', 'name', 'orgUnitId', 'startDate', 'endDate', 'capacity', 'assignees'] as const
      const labels = {
        externalKey: '외부 키 변경',
        name: '과정명 변경',
        orgUnitId: '조직 단위 변경',
        startDate: '시작일 변경',
        endDate: '종료일 변경',
        capacity: '정원 변경',
        assignees: '담당자 교체',
      }
      for (const key of fields) {
        if (JSON.stringify(previous[key]) === JSON.stringify(draft[key])) continue
        const before = formatCourseHistoryValue(previous, key)
        const after = formatCourseHistoryValue(draft, key)
        history.push({
          id: crypto.randomUUID(),
          label: labels[key],
          before,
          after,
          reason,
          actor: actorName,
          createdAt: now,
        })
      }
    }
    return {
      id: previous?.id ?? crypto.randomUUID(),
      businessName: selectedBusiness,
      ...draft,
      version: previous ? previous.version + 1 : 0,
      updatedAt: now,
      updatedBy: actorName,
      archivedAt: null,
      archivedBy: null,
      hasProcessingHistory: previous?.hasProcessingHistory ?? false,
      pendingByArea: previous?.pendingByArea ?? {},
      history,
    }
  }

  function saveCourse(draft: CourseDraft, version?: number, reason = '', courseId?: string): CourseSaveResult | null {
    const previous = courses.find((course) => course.id === courseId)
    if (previous && (previous.version !== version || previous.archivedAt)) return null
    if (previous && getCourseState(previous) === '종료' && !reason.trim()) return null

    const saved = buildCourse(draft, previous, reason)
    setCourses((current) =>
      previous ? current.map((course) => (course.id === previous.id ? saved : course)) : [saved, ...current],
    )
    return {
      course: saved,
      ...courseSaveSummaryMock,
    }
  }

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

  return (
    <Routes>
      <Route
        index
        element={
          <CourseList key={selectedBusiness} courses={visibleCourses} isMobile={isMobile} onArchive={archiveCourse} />
        }
      />
      <Route
        path="new"
        element={<CourseEditorRoute courses={visibleCourses} business={selectedBusiness} onSave={saveCourse} />}
      />
      <Route
        path=":courseId"
        element={<CourseEditorRoute courses={visibleCourses} business={selectedBusiness} onSave={saveCourse} />}
      />
      <Route
        path="archived"
        element={<ArchivedCourses courses={visibleCourses} isMobile={isMobile} onRestore={restoreCourse} />}
      />
      <Route
        path="import"
        element={
          <CourseImport
            key={selectedBusiness}
            business={selectedBusiness}
            isMobile={isMobile}
          />
        }
      />
      <Route
        path="*"
        element={
          <Result status="404" title="페이지를 찾을 수 없어요" extra={<Link to="/admin/courses">목록으로</Link>} />
        }
      />
    </Routes>
  )
}
