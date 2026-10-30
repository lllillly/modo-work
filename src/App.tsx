import { useId, useState } from 'react'
import { Switch } from 'antd'
import AppProvider from './providers/AppProvider'
import { darkTheme, lightTheme } from './styles/theme'

function App() {
  const [isDark, setIsDark] = useState(() => {
    try {
      return localStorage.getItem('portal-theme') === 'dark'
    } catch {
      return false
    }
  })
  const switchId = useId()
  const currentTheme = isDark ? darkTheme : lightTheme

  function changeTheme(isDark: boolean) {
    setIsDark(isDark)
    try {
      localStorage.setItem('portal-theme', isDark ? 'dark' : 'light')
    } catch {
      return
    }
  }

  return (
    <AppProvider themeConfig={currentTheme}>
      <main>
        <h1 className="text-page-title font-bold text-brand-accent">MODO WORKAX</h1>
        <div className="flex flex-wrap items-center gap-sm">
          <label htmlFor={switchId}>다크 모드</label>
          <Switch
            id={switchId}
            aria-label="다크 모드"
            checked={isDark}
            onChange={changeTheme}
          />
        </div>
      </main>
    </AppProvider>
  )
}

export default App
