import { useCallback, useEffect, useState } from 'react'
import { Button, Pagination, Select, Spin } from 'antd'

import { getAssigneeCandidates } from '../../../../api/courses'
import { getApiErrorMessage } from '../../../../api/client'
import useApiQuery from '../../../../hooks/useApiQuery'
import type { AssigneeCandidate } from '../../../../types/courseApi'

type AssigneeSearchProps = {
  businessId: string
  orgUnitId: string
  orgUnitName?: string
  areaId: string
  areaName: string
  courseId?: string
  excludedIds: string[]
  disabled?: boolean
  onSelect: (user: AssigneeCandidate) => void
}

export default function AssigneeSearch({
  businessId,
  orgUnitId,
  orgUnitName,
  areaId,
  areaName,
  courseId,
  excludedIds,
  disabled = false,
  onSelect,
}: AssigneeSearchProps) {
  const [text, setText] = useState('')
  const [search, setSearch] = useState({ q: '', page: 0 })

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const q = text.trim()
      setSearch((previous) => (previous.q === q ? previous : { q, page: 0 }))
    }, 300)
    return () => window.clearTimeout(timer)
  }, [text])

  const load = useCallback(
    (signal: AbortSignal) =>
      getAssigneeCandidates(
        { businessId, orgUnitId, areaId, q: search.q, page: search.page, courseId },
        signal,
      ),
    [businessId, orgUnitId, areaId, search, courseId],
  )
  const query = useApiQuery(
    orgUnitId
      ? `${businessId}:${orgUnitId}:${areaId}:${search.q}:${search.page}:${courseId ?? ''}`
      : null,
    load,
  )
  const waitingForSearch = text.trim() !== search.q
  const candidates = waitingForSearch ? [] : (query.data?.items ?? [])

  return (
    <Select
      aria-label={`${areaName} 담당자 검색`}
      value={undefined}
      placeholder="이름·이메일로 찾기"
      className="w-[280px] max-w-full"
      disabled={disabled || !orgUnitId}
      loading={query.isLoading || waitingForSearch}
      showSearch={{
        filterOption: false,
        searchValue: text,
        onSearch: (value) => setText(value.slice(0, 100)),
      }}
      options={candidates
        .filter((user) => !excludedIds.includes(user.id))
        .map((user) => ({
          value: user.id,
          label: `${user.name} ${user.email}`,
          name: user.name,
          email: user.email,
        }))}
      optionRender={(option) => (
        <span className="flex flex-wrap gap-x-xxs text-caption [overflow-wrap:anywhere]">
          <span>{option.data.name}</span>
          <span className="text-(--ant-color-text-tertiary)">
            {option.data.email}
            {orgUnitName && ` · ${orgUnitName}`}
          </span>
        </span>
      )}
      popupMatchSelectWidth={320}
      classNames={{ popup: { root: 'max-w-[calc(100vw-32px)]' } }}
      notFoundContent={
        query.isLoading || waitingForSearch ? (
          <Spin size="small" />
        ) : query.error ? (
          <span role="alert">
            {getApiErrorMessage(query.error)}{' '}
            <Button size="small" onClick={query.reload}>
              다시 시도
            </Button>
          </span>
        ) : (
          '배정 가능한 활성 담당자가 없어요'
        )
      }
      popupRender={(menu) => (
        <>
          {menu}
          <div
            className="border-0 border-t border-solid border-(--ant-color-border-secondary)
            px-sm py-xs"
          >
            <span className="text-caption text-(--ant-color-text-tertiary)">
              활성 담당자만 보여요 · 이름이나 이메일로 찾기
            </span>
            <Pagination
              size="small"
              simple
              current={search.page + 1}
              pageSize={20}
              total={query.data?.totalElements ?? 0}
              showSizeChanger={false}
              hideOnSinglePage
              onChange={(page) => setSearch((previous) => ({ ...previous, page: page - 1 }))}
            />
          </div>
        </>
      )}
      onChange={(id: string) => {
        const user = candidates.find((candidate) => candidate.id === id)
        if (user) onSelect(user)
        setText('')
      }}
    />
  )
}
