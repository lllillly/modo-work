import { BrowserRouter, Link, Route, Routes } from 'react-router'
import AppLayout from './layouts/AppLayout'
import AuthLayout from './layouts/AuthLayout'
import LoginPage from './pages/auth/LoginPage'
import AssigneeHomePage from './pages/home/AssigneeHomePage'
import TasksPage from './pages/tasks/TasksPage'

type AppRouterProps = {
  isDark: boolean
  onThemeChange: (isDark: boolean) => void
}

export default function AppRouter({ isDark, onThemeChange }: AppRouterProps) {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route
          element={<AppLayout isDark={isDark} onThemeChange={onThemeChange} />}
        >
          <Route index element={<AssigneeHomePage />} /> {/* 담당자 홈 */}
          <Route path="/tasks" element={<TasksPage />} /> {/* 과정별 할 일 */}
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
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<LoginPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
