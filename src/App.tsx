import { useId, useState } from 'react'
import { Switch } from 'antd'
import AppProvider from './providers/AppProvider'
import { darkTheme, lightTheme } from './styles/theme'

function App() {
  const [isDark, setIsDark] = useState(false)
  const switchId = useId()
  const currentTheme = isDark ? darkTheme : lightTheme

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
            onChange={setIsDark}
          />
        </div>
      </main>
    </AppProvider>
  )
}

export default App
