import { Suspense } from 'react'
import { Spin } from 'antd'
import { Outlet } from 'react-router'

export default function AuthLayout() {
  return (
    <main className="flex min-h-svh items-center justify-center px-md py-lg">
      <div className="w-full max-w-[400px]">
        <Suspense fallback={<Spin className="flex justify-center" aria-label="화면 불러오는 중" />}>
          <Outlet />
        </Suspense>
      </div>
    </main>
  )
}
