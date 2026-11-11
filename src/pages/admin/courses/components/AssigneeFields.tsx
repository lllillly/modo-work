import { useState } from 'react'
import { PlusOutlined, WarningOutlined } from '@ant-design/icons'
import { Button, Select, Tag } from 'antd'

import type { CourseDraft } from '../../../../types/adminCourses'
import { courseAreas, courseAssignees, courseOrgUnits } from '../courseManagementMockData'

type AssigneeFieldsProps = {
  orgUnitId: string
  value?: CourseDraft['assignees']
  onChange?: (value: CourseDraft['assignees']) => void
  readOnly?: boolean
  pendingByArea?: Record<string, number>
}

export default function AssigneeFields({
  orgUnitId,
  value = {},
  onChange,
  readOnly = false,
  pendingByArea,
}: AssigneeFieldsProps) {
  const [addingArea, setAddingArea] = useState<string | null>(null)
  const [replacingArea, setReplacingArea] = useState<string | null>(null)
  const orgUnitName = courseOrgUnits.find((org) => org.id === orgUnitId)?.name

  return (
    <div className="flex flex-col">
      {courseAreas.map((area) => {
        const selectedIds = value[area.id] ?? []
        const selected = courseAssignees.filter((user) => selectedIds.includes(user.id))
        const inactive = selected.some((user) => user.status === 'INACTIVE')
        const showPendingCount = readOnly && inactive && pendingByArea?.[area.id] !== undefined
        const options = courseAssignees.filter(
          (user) =>
            user.status === 'ACTIVE' &&
            user.orgUnitId === orgUnitId &&
            user.areaIds.includes(area.id) &&
            !selectedIds.includes(user.id),
        )

        return (
          <div
            key={area.id}
            className="grid grid-cols-1 gap-xs border-0 border-t border-solid border-(--ant-color-border-secondary) py-sm min-[992px]:grid-cols-[120px_minmax(0,1fr)] min-[992px]:gap-md"
          >
            <span className="pt-xxs text-body font-medium">{area.name}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-xs">
                {selected.map((user) => (
                  <Tag
                    key={user.id}
                    color={user.status === 'INACTIVE' ? 'warning' : undefined}
                    className="m-0 px-xs text-caption"
                    closable={!readOnly}
                    onClose={() => onChange?.({ ...value, [area.id]: selectedIds.filter((id) => id !== user.id) })}
                  >
                    {user.name}{' '}
                    <span className={user.status === 'INACTIVE' ? '' : 'text-(--ant-color-text-tertiary)'}>
                      {user.email}
                    </span>
                    {user.status === 'INACTIVE' && ' · 비활성'}
                  </Tag>
                ))}
                {!readOnly &&
                  (addingArea === area.id || !selected.length ? (
                    <Select
                      aria-label={`${area.name} 담당자 검색`}
                      value={undefined}
                      placeholder="이름·이메일로 찾기"
                      className="w-[280px] max-w-full"
                      disabled={!orgUnitId}
                      showSearch={{ optionFilterProp: 'label' }}
                      options={options.map((user) => ({
                        value: user.id,
                        label: `${user.name} ${user.email}`,
                        name: user.name,
                        email: user.email,
                      }))}
                      optionRender={(option) => (
                        <span className="flex flex-wrap gap-x-xxs text-caption [overflow-wrap:anywhere]">
                          <span>{option.data.name}</span>
                          <span className="text-(--ant-color-text-tertiary)">
                            {option.data.email} · {orgUnitName}
                          </span>
                        </span>
                      )}
                      popupMatchSelectWidth={320}
                      classNames={{ popup: { root: 'max-w-[calc(100vw-32px)]' } }}
                      popupRender={(menu) => (
                        <>
                          {menu}
                          <div className="border-0 border-t border-solid border-(--ant-color-border-secondary) px-sm py-xxs text-caption text-(--ant-color-text-tertiary)">
                            활성 담당자만 보여요 · 이름이나 이메일로 찾기
                          </div>
                        </>
                      )}
                      notFoundContent="배정 가능한 활성 담당자가 없어요"
                      onChange={(id: string) => {
                        const keptIds =
                          replacingArea === area.id
                            ? selected.filter((user) => user.status === 'ACTIVE').map((user) => user.id)
                            : selectedIds
                        onChange?.({ ...value, [area.id]: [...keptIds, id] })
                        setAddingArea(null)
                        setReplacingArea(null)
                      }}
                    />
                  ) : (
                    <Button type="dashed" icon={<PlusOutlined aria-hidden />} onClick={() => setAddingArea(area.id)}>
                      담당자 추가
                    </Button>
                  ))}
                {readOnly && !selected.length && (
                  <span className="text-caption text-(--ant-color-text-tertiary)">미배정</span>
                )}
                {showPendingCount && (
                  <span className="text-caption text-(--ant-color-warning)">
                    미완료 할 일 {pendingByArea?.[area.id]}건이 비활성 담당자에게 남아 있어요
                  </span>
                )}
              </div>
              {!readOnly && !selected.length && (
                <p className="mt-xs mb-0 text-caption text-(--ant-color-warning)">
                  <WarningOutlined /> 아직 담당자가 없어요. 할 일은 만들어지고, 배정하면 그 담당자에게 보여요.
                </p>
              )}
              {inactive && !showPendingCount && (
                <p className="mt-xs mb-0 text-caption text-(--ant-color-warning)">
                  <WarningOutlined /> 비활성 담당자예요. 다른 담당자로 바꾸면 미완료 할 일이 새 담당자에게 넘어가요.
                  {!readOnly && (
                    <Button
                      type="link"
                      className="ml-xs h-auto p-0 text-caption"
                      onClick={() => {
                        setAddingArea(area.id)
                        setReplacingArea(area.id)
                      }}
                    >
                      재배정
                    </Button>
                  )}
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
