import type { CSSProperties } from 'react'
import { theme } from 'antd'
import type { ThemeConfig } from 'antd'

export const brandColors = {
  accent: '#FF6000',
} as const

export const brandCssVariables: CSSProperties & Record<`--${string}`, string> = {
  '--brand-accent': brandColors.accent,
}

const commonTheme = {
  cssVar: { prefix: 'ant' },
  token: {
    fontFamily: 'Pretendard, system-ui, sans-serif',
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
