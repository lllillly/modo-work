import { useState } from 'react'
import { PlusOutlined, WarningOutlined } from '@ant-design/icons'
import { Button, Tag } from 'antd'

import type { CourseDraft } from '../../../../types/adminCourses'
import type { AssignedUser, AssigneeCandidate, OptionItem } from '../../../../types/courseApi'
import AssigneeSearch from './AssigneeSearch'

type AssigneeFieldsProps = {
  businessId: string
  orgUnitId: string
  areas: OptionItem[]
  courseId?: string
  orgUnitName?: string
  areaNames?: Record<string, string>
  pendingByArea?: Record<string, number>
  assignedUsers?: Record<string, AssignedUser[]>
  value?: CourseDraft['assignees']
  onChange?: (value: CourseDraft['assignees']) => void
  readOnly?: boolean
}

export default function AssigneeFields({
  businessId,
  orgUnitId,
  areas,
  courseId,
  orgUnitName,
  areaNames = {},
  pendingByArea,
  assignedUsers = {},
  value = {},
  onChange,
  readOnly = false,
}: AssigneeFieldsProps) {
  const [addingArea, setAddingArea] = useState<string | null>(null)
  const [replacingArea, setReplacingArea] = useState<string | null>(null)
  const [pickedUsers, setPickedUsers] = useState<Record<string, AssigneeCandidate>>({})

  const areaIds = [...new Set([...areas.map((area) => area.id), ...Object.keys(value)])]

  return (
    <div className="flex flex-col">
      {areaIds.map((areaId) => {
        const area = areas.find((item) => item.id === areaId)
        const areaName = area?.name ?? areaNames[areaId] ?? '-'
        const selectedIds = value[areaId] ?? []
        const selected = selectedIds.map((id) => {
          const existing = assignedUsers[areaId]?.find((user) => user.id === id)
          const picked = pickedUsers[id]
          return {
            id,
            name: picked?.name ?? existing?.name ?? '-',
            email: picked?.email ?? existing?.email,
            status: picked ? 'ACTIVE' : existing?.status,
          }
        })
        const inactive = selected.some((user) => user.status === 'INACTIVE')
        const pendingCount = pendingByArea?.[areaId] ?? 0

        return (
          <div
            key={areaId}
            className="grid grid-cols-1 gap-xs border-0 border-t border-solid
              border-(--ant-color-border-secondary) py-sm
              min-[992px]:grid-cols-[120px_minmax(0,1fr)] min-[992px]:gap-md"
          >
            <span className="pt-xxs text-body font-medium">{areaName}</span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-xs">
                {selected.map((user) => (
                  <Tag
                    key={user.id}
                    color={user.status === 'INACTIVE' ? 'warning' : undefined}
                    className="m-0 px-xs text-caption"
                    closable={!readOnly}
                    onClose={() =>
                      onChange?.({ ...value, [areaId]: selectedIds.filter((id) => id !== user.id) })
                    }
                  >
                    {user.name}{' '}
                    {user.email && (
                      <span className={user.status === 'INACTIVE' ? '' : 'text-(--ant-color-text-tertiary)'}>
                        {user.email}
                      </span>
                    )}
                    {user.status === 'INACTIVE' && ' · 비활성'}
                    {user.status === 'PENDING' && ' · 승인 대기'}
                  </Tag>
                ))}
                {!readOnly &&
                  area &&
                  (addingArea === areaId || !selected.length ? (
                    <AssigneeSearch
                      key={`${orgUnitId}:${areaId}`}
                      businessId={businessId}
                      orgUnitId={orgUnitId}
                      orgUnitName={orgUnitName}
                      areaId={areaId}
                      areaName={areaName}
                      courseId={courseId}
                      excludedIds={selectedIds}
                      onSelect={(user) => {
                        setPickedUsers((previous) => ({ ...previous, [user.id]: user }))
                        const keptIds =
                          replacingArea === areaId
                            ? selected
                                .filter((item) => item.status !== 'INACTIVE')
                                .map((item) => item.id)
                            : selectedIds
                        onChange?.({ ...value, [areaId]: [...keptIds, user.id] })
                        setAddingArea(null)
                        setReplacingArea(null)
                      }}
                    />
                  ) : (
                    <Button
                      type="dashed"
                      icon={<PlusOutlined aria-hidden />}
                      onClick={() => setAddingArea(areaId)}
                    >
                      담당자 추가
                    </Button>
                  ))}
                {readOnly && !selected.length && (
                  <span className="text-caption text-(--ant-color-text-tertiary)">미배정</span>
                )}
              </div>
              {readOnly && inactive && pendingByArea && (
                <p className="mt-xs mb-0 text-caption text-(--ant-color-warning)">
                  {pendingCount > 0
                    ? `이 영역에 미완료 할 일 ${pendingCount}건이 남아 있어요`
                    : '이 영역에 남은 미완료 할 일은 없어요'}
                </p>
              )}
              {!readOnly && !selected.length && (
                <p className="mt-xs mb-0 text-caption text-(--ant-color-warning)">
                  <WarningOutlined /> 아직 담당자가 없어요. 할 일은 만들어지고, 배정하면 그 담당자에게
                  보여요.
                </p>
              )}
              {inactive && (
                <p className="mt-xs mb-0 text-caption text-(--ant-color-warning)">
                  <WarningOutlined /> 비활성 담당자예요. 다른 담당자로 바꾸면 미완료 할 일이 새
                  담당자에게 보여요.
                  {!readOnly && area && (
                    <Button
                      type="link"
                      className="ml-xs h-auto p-0 text-caption"
                      onClick={() => {
                        setAddingArea(areaId)
                        setReplacingArea(areaId)
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
