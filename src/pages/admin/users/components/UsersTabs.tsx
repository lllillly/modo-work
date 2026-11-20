import { Segmented, Tabs } from 'antd'
import type { TabsProps } from 'antd'

type UsersTabsProps<T extends string> = {
  activeKey: T
  items: NonNullable<TabsProps['items']>
  isMobile: boolean
  onChange: (key: T) => void
}

export default function UsersTabs<T extends string>({ activeKey, items, isMobile, onChange }: UsersTabsProps<T>) {
  return (
    <Tabs
      activeKey={activeKey}
      onChange={(key) => onChange(key as T)}
      items={items}
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
