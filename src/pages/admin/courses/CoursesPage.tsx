import { useState } from 'react'
import { Button, Result } from 'antd'
import { Link, Route, Routes, useOutletContext } from 'react-router'

import type { AppLayoutContext } from '../../../layouts/AppLayout'
import { useAuth } from '../../../providers/AuthContext'
import { createCourseManagementMockData } from './courseManagementMockData'
import CourseList from './components/CourseList'

export default function CoursesPage() {
  const { isMobile, selectedBusiness } = useOutletContext<AppLayoutContext>()
  const { user } = useAuth()
  const [courses] = useState(createCourseManagementMockData)
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

  return (
    <Routes>
      <Route index element={<CourseList key={selectedBusiness} courses={visibleCourses} isMobile={isMobile} />} />
      <Route
        path="*"
        element={
          <Result status="404" title="페이지를 찾을 수 없어요" extra={<Link to="/admin/courses">목록으로</Link>} />
        }
      />
    </Routes>
  )
}
