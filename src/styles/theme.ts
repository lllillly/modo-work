import { theme } from 'antd'
import type { ThemeConfig } from 'antd'

const commonTheme = {
  cssVar: { prefix: 'ant' },
  token: {
    fontFamily: 'Pretendard, system-ui, sans-serif',
    fontWeightStrong: 700,
  },
} satisfies ThemeConfig

export const lightTheme: ThemeConfig = {
  ...commonTheme,
  algorithm: theme.defaultAlgorithm,
}

export const darkTheme: ThemeConfig = {
  ...commonTheme,
  algorithm: theme.darkAlgorithm,
}
