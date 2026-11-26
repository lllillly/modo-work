import { lazy, Suspense } from 'react'
import { Spin } from 'antd'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

import AuthLayout from './layouts/AuthLayout'
import RequireAuth from './layouts/RequireAuth'
import PageNotFound from './components/common/PageNotFound'

const AppLayout = lazy(() => import('./layouts/AppLayout'))
const LoginPage = lazy(() => import('./pages/auth/LoginPage'))
const HomePage = lazy(() => import('./pages/home/HomePage'))
const TasksPage = lazy(() => import('./pages/tasks/TasksPage'))
const DocumentsPage = lazy(() => import('./pages/documents/DocumentsPage'))
const AdminDocumentsPage = lazy(() => import('./pages/admin/documents/AdminDocumentsPage'))
const CoursesPage = lazy(() => import('./pages/admin/courses/CoursesPage'))
const TaskTemplatesPage = lazy(() => import('./pages/admin/templates/TaskTemplatesPage'))
const AskPage = lazy(() => import('./pages/ask/AskPage'))
const UsersPage = lazy(() => import('./pages/admin/users/UsersPage'))
const QuestionsAdminPage = lazy(() => import('./pages/admin/questions/QuestionsAdminPage'))
const SettingsTransferPage = lazy(() => import('./pages/admin/config/SettingsTransferPage'))
const SettingsPage = lazy(() => import('./pages/admin/settings/SettingsPage'))
const ServiceTokensPage = lazy(() => import('./pages/admin/service-tokens/ServiceTokensPage'))

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
              <Route path="/ask" element={<AskPage />} /> {/* 물어보기 */}
              <Route path="/documents/*" element={<DocumentsPage />} /> {/* 문서 */}
              <Route path="/admin/courses/*" element={<CoursesPage />} />
              <Route path="/admin/task-templates/*" element={<TaskTemplatesPage />} /> {/* 할 일 템플릿 */}
              <Route path="/admin/documents" element={<AdminDocumentsPage />} />
              <Route path="/admin/users" element={<UsersPage />} /> {/* 사용자와 승인 */}
              <Route path="/admin/questions" element={<QuestionsAdminPage />} /> {/* 물어보기 관리 */}
              <Route path="/admin/config" element={<SettingsTransferPage />} /> {/* 설정 내보내기와 가져오기 */}
              <Route path="/admin/service-tokens" element={<ServiceTokensPage />} /> {/* 서비스 토큰 관리 */}
              <Route path="/admin/settings" element={<SettingsPage />} /> {/* 휴무일 설정 */}
              <Route path="/admin/import" element={<Navigate to="/admin/courses/import" replace />} />
              <Route
                path="*"
                element={<PageNotFound />}
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
