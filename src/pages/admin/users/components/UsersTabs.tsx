import { Segmented, Tabs } from 'antd'
import type { TabsProps } from 'antd'

type UsersTabsProps<T extends string> = {
  activeKey: T
  items: NonNullable<TabsProps['items']>
  isMobile: boolean
  onChange: (key: T) => void
}

export function TabCount({ value, highlight = false }: { value: number; highlight?: boolean }) {
  return (
    <span
      className={`ml-xs inline-flex min-w-5 justify-center rounded-full px-1.5 text-caption ${
        highlight
          ? 'bg-(--ant-color-warning-bg) font-medium text-(--ant-color-warning-text)'
          : 'bg-(--ant-color-fill-tertiary) text-(--ant-color-text-secondary) max-[991px]:hidden'
      }`}
    >
      {value}
    </span>
  )
}

export default function UsersTabs<T extends string>({ activeKey, items, isMobile, onChange }: UsersTabsProps<T>) {
  return (
    <Tabs
      activeKey={activeKey}
      onChange={(key) => onChange(key as T)}
      items={items}
      tabBarGutter={24}
      renderTabBar={
        isMobile
          ? () => (
              <Segmented
                block
                aria-label="사용자와 승인 화면"
                value={activeKey}
                onChange={(key) => onChange(key as T)}
                options={items.map((item) => ({ value: item.key, label: item.label }))}
                className="mb-md bg-(--ant-color-fill-secondary) [&_.ant-segmented-item-label]:py-0.5"
              />
            )
          : undefined
      }
    />
  )
}
