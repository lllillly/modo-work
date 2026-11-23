import { useLayoutEffect, useState } from 'react'
import AppProvider from './providers/AppProvider'
import AuthProvider from './providers/AuthProvider'
import AppRouter from './router'
import { darkTheme, lightTheme } from './styles/theme'

function App() {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('portal-theme') === 'dark'
    } catch {
      return false
    }
  })
  const currentTheme = isDark ? darkTheme : lightTheme

  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.theme = isDark ? 'dark' : 'light'
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => root.classList.remove('theme-switching'))
    })
    return () => cancelAnimationFrame(frame)
  }, [isDark])

  function changeTheme(isDark: boolean) {
    document.documentElement.classList.add('theme-switching')
    setIsDark(isDark)
    try {
      localStorage.setItem('portal-theme', isDark ? 'dark' : 'light')
    } catch {
      return
    }
  }

  return (
    <AppProvider themeConfig={currentTheme}>
      <AuthProvider>
        <AppRouter isDark={isDark} onThemeChange={changeTheme} />
      </AuthProvider>
    </AppProvider>
  )
}

export default App
