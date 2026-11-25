import { useCallback, useState } from 'react'
import { Button, Divider, Pagination, Select } from 'antd'

import { getCourses } from '../../../api/courses'
import { PAGE_SIZE } from '../../../api/pagination'
import useApiQuery from '../../../hooks/useApiQuery'

type ApiCourseSelectProps = {
  businessId: string
  courseId: string
  courseName: string
  courses?: { id: string; name: string }[]
  onChange: (id: string) => void
}

export default function ApiCourseSelect({
  businessId,
  courseId,
  courseName,
  courses,
  onChange,
}: ApiCourseSelectProps) {
  const [open, setOpen] = useState(false)
  const [page, setPage] = useState(0)
  const load = useCallback(
    (signal: AbortSignal) => getCourses(businessId, page, {}, signal),
    [businessId, page],
  )
  const query = useApiQuery(open && !courses ? `${businessId}:${page}` : null, load)
  const options = (courses ?? query.data?.items ?? []).map((course) => ({ value: course.id, label: course.name }))

  return (
    <Select
      aria-label="과정 선택"
      value={{ value: courseId, label: courseName }}
      labelInValue
      open={open}
      onOpenChange={setOpen}
      loading={query.isLoading}
      className="w-full min-[992px]:w-[320px]"
      options={options}
      onChange={(option) => onChange(option.value)}
      notFoundContent={
        query.isLoading ? (
          '불러오는 중'
        ) : query.error ? (
          <Button size="small" onClick={query.reload}>
            다시 시도
          </Button>
        ) : (
          '과정이 없어요'
        )
      }
      popupRender={courses ? undefined : (menu) => (
        <>
          {menu}
          <Divider className="my-xs" />
          <Pagination
            size="small"
            current={page + 1}
            pageSize={PAGE_SIZE}
            total={query.data?.totalElements ?? 0}
            showSizeChanger={false}
            hideOnSinglePage
            onChange={(value) => setPage(value - 1)}
          />
        </>
      )}
    />
  )
}
