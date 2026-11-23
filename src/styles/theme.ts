import { theme } from 'antd'
import type { ThemeConfig } from 'antd'

const commonTheme = {
  cssVar: { prefix: 'ant' },
  token: {
    fontFamily: 'Pretendard, system-ui, sans-serif',
    fontWeightStrong: 700,
  },
} satisfies ThemeConfig

const brandButton = {
  colorPrimary: '#FF6100',
  colorPrimaryHover: '#E25500',
  colorPrimaryActive: '#CD4100',
}

const lightText = {
  primary: '#0958d9',
}

const darkText = {
  primary: '#69b1ff',
  error: '#ff7875',
}

export const lightTheme: ThemeConfig = {
  ...commonTheme,
  algorithm: theme.defaultAlgorithm,
  token: {
    ...commonTheme.token,
    colorBgLayout: '#F3F4F6',
    borderRadiusLG: 12,
    colorTextTertiary: 'rgba(0, 0, 0, 0.6)',
    colorLink: lightText.primary,
    colorPrimaryText: lightText.primary,
    colorInfoText: lightText.primary,
  },
  components: {
    Button: {
      ...brandButton,
      defaultHoverColor: '#4096FF',
      defaultHoverBorderColor: '#4096FF',
      defaultActiveColor: '#0958D9',
      defaultActiveBorderColor: '#0958D9',
    },
    Menu: { itemSelectedColor: '#BF4C00', itemSelectedBg: '#FFF3EB' },
  },
}

export const darkTheme: ThemeConfig = {
  ...commonTheme,
  algorithm: theme.darkAlgorithm,
  token: {
    ...commonTheme.token,
    colorBgLayout: '#141414',
    colorBgContainer: '#1F1F1F',
    colorBgElevated: '#262626',
    borderRadiusLG: 12,
    colorTextTertiary: 'rgba(255, 255, 255, 0.6)',
    colorLink: darkText.primary,
    colorPrimaryText: darkText.primary,
    colorInfoText: darkText.primary,
    colorErrorText: darkText.error,
  },
  components: {
    Button: {
      ...brandButton,
      defaultHoverColor: '#3C89E8',
      defaultHoverBorderColor: '#3C89E8',
      defaultActiveColor: '#1554AD',
      defaultActiveBorderColor: '#1554AD',
    },
    Menu: { itemSelectedColor: '#FFA066', itemSelectedBg: '#43291A' },
    Tag: { colorInfo: darkText.primary },
  },
}
