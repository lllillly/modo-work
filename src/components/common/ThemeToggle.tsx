import { MoonOutlined, SunOutlined } from '@ant-design/icons'
import styles from './ThemeToggle.module.css'

type ThemeToggleProps = {
  isDark: boolean
  onThemeChange: (isDark: boolean) => void
}

export default function ThemeToggle({ isDark, onThemeChange }: ThemeToggleProps) {
  return (
    <button
      type="button"
      className={styles.button}
      data-dark={isDark}
      aria-label="다크 모드"
      aria-pressed={isDark}
      title={isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}
      onClick={() => onThemeChange(!isDark)}
    >
      <span aria-hidden="true" className={`${styles.icon} ${styles.sun}`}>
        <SunOutlined />
      </span>
      <span aria-hidden="true" className={`${styles.icon} ${styles.moon}`}>
        <MoonOutlined />
      </span>
    </button>
  )
}
