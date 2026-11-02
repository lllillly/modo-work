import { Outlet } from 'react-router'

export default function AuthLayout() {
  return (
    <main className="flex min-h-svh items-center justify-center px-md py-lg">
      <div className="w-full max-w-[400px]">
        <Outlet />
      </div>
    </main>
  )
}
