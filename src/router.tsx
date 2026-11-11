import { lazy, Suspense } from 'react'
import { Spin } from 'antd'
import { BrowserRouter, Link, Navigate, Route, Routes } from 'react-router'

import AuthLayout from './layouts/AuthLayout'
import RequireAuth from './layouts/RequireAuth'

const AppLayout = lazy(() => import('./layouts/AppLayout'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const HomePage = lazy(() => import('./pages/home/HomePage'))
const TasksPage = lazy(() => import('./pages/tasks/TasksPage'))
const CoursesPage = lazy(() => import('./pages/admin/courses/CoursesPage'))

type AppRouterProps = {
  isDark: boolean
  onThemeChange: (isDark: boolean) => void
}

export default function AppRouter({ isDark, onThemeChange }: AppRouterProps) {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Suspense fallback={<Spin fullscreen aria-label="화면 불러오는 중" />}>
        <Routes>
          <Route element={<RequireAuth />}>
            <Route
              element={<AppLayout isDark={isDark} onThemeChange={onThemeChange} />}
            >
              <Route index element={<HomePage />} /> {/* 홈(역할별로 화면 변경) */}
              <Route path="/tasks" element={<TasksPage />} /> {/* 과정별 할 일 */}
              <Route path="/admin/courses/*" element={<CoursesPage />} />
              <Route path="/admin/import" element={<Navigate to="/admin/courses/import" replace />} />
              <Route
                path="*"
                element={
                  <>
                    <h2 className="text-section-title">페이지를 찾을 수 없습니다.</h2>
                    <Link to="/">홈으로 이동</Link>
                  </>
                }
              />
            </Route>
          </Route>
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}
