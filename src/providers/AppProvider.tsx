import type { PropsWithChildren } from 'react'
import { StyleProvider } from '@ant-design/cssinjs'
import { App as AntdApp, ConfigProvider } from 'antd'
import type { ThemeConfig } from 'antd'
import koKR from 'antd/locale/ko_KR'

type AppProviderProps = PropsWithChildren<{
  themeConfig: ThemeConfig
}>

export default function AppProvider({ themeConfig, children }: AppProviderProps) {
  return (
    <StyleProvider layer>
      <ConfigProvider locale={koKR} theme={themeConfig}>
        <AntdApp className="min-h-svh bg-(--ant-color-bg-layout) text-body font-regular text-(--ant-color-text)">
          {children}
        </AntdApp>
      </ConfigProvider>
    </StyleProvider>
  )
}
