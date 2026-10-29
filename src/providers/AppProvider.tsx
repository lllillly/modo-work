import type { PropsWithChildren } from 'react'
import { App as AntdApp, ConfigProvider } from 'antd'
import type { ThemeConfig } from 'antd'
import koKR from 'antd/locale/ko_KR'
import { brandCssVariables } from '../styles/theme'
import './AppProvider.css'

type AppProviderProps = PropsWithChildren<{
  themeConfig: ThemeConfig
}>

export default function AppProvider({ themeConfig, children }: AppProviderProps) {
  return (
    <ConfigProvider locale={koKR} theme={themeConfig}>
      <AntdApp className="app-shell" style={brandCssVariables}>
        {children}
      </AntdApp>
    </ConfigProvider>
  )
}
