import { Outlet } from 'react-router'

export default function AuthLayout() {
  return (
    <main className="flex min-h-svh items-center justify-center p-lg">
      <div className="w-full max-w-[28rem]">
        <Outlet />
      </div>
    </main>
  )
}
