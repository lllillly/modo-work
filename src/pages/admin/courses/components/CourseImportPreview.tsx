import { useCallback, useRef, useState } from 'react'
import { ArrowRightOutlined, UploadOutlined, WarningOutlined } from '@ant-design/icons'
import { Alert, Button, Card, Checkbox, Pagination, Steps, Table, Tag } from 'antd'
import type { TableColumnsType } from 'antd'
import { Link } from 'react-router'

import {
  applyCourseImport,
  cancelCourseImport,
  getImportJob,
  getImportRows,
  getMissingCourses,
} from '../../../../api/courses'
import { ApiError, getApiErrorMessage, isAuthStateError } from '../../../../api/client'
import useApiQuery from '../../../../hooks/useApiQuery'
import { useAuth } from '../../../../providers/AuthContext'
import type { ApplyImportRequest, ImportJob, ImportRow } from '../../../../types/courseApi'

const rowLabels: Record<ImportRow['disposition'], string> = {
  ADDED: '신규',
  CHANGED: '갱신',
  UNCHANGED: '변경 없음',
  ERROR: '오류',
}

function displayChange(value: unknown): string {
  if (value === null) return '미지정'
  if (Array.isArray(value)) return value.map(displayChange).join(', ') || '없음'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

function getImportNotice(job: ImportJob) {
  if (job.status === 'APPLIED') {
    return { type: 'success' as const, title: '전체 적용을 마쳤어요.' }
  }
  if (job.status === 'CANCELLED') {
    return { type: 'info' as const, title: '미리보기를 취소했어요.' }
  }
  if (job.canApply) {
    return { type: 'info' as const, title: '변경 내용과 모든 페이지의 경고를 확인한 뒤 적용해 주세요.' }
  }
  return {
    type: 'error' as const,
    title: '오류가 있어 전체를 적용할 수 없어요. 파일을 고쳐 다시 올려 주세요.',
  }
}

type ImportPreviewProps = {
  jobId: string
  businessId: string
  isMobile: boolean
  onReset: () => void
}

export default function CourseImportPreview({ jobId, businessId, isMobile, onReset }: ImportPreviewProps) {
  const { refreshUser } = useAuth()
  const [page, setPage] = useState(0)
  const [missingPage, setMissingPage] = useState(0)
  const [confirmed, setConfirmed] = useState<string[]>([])
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [mustPreview, setMustPreview] = useState(false)
  const [needsCheck, setNeedsCheck] = useState(false)
  const [resolvedJob, setResolvedJob] = useState<ImportJob | null>(null)
  const applyRequest = useRef<ApplyImportRequest | null>(null)

  const loadJob = useCallback(
    async (signal: AbortSignal) => {
      const detail = await getImportJob(jobId, signal)
      if (detail.job.businessId !== businessId) {
        throw new ApiError(404, {
          code: 'NOT_FOUND',
          message: '선택한 사업의 가져오기 작업이 아니에요.',
          fieldErrors: [],
        })
      }
      return detail.job
    },
    [jobId, businessId],
  )
  const loadRows = useCallback((signal: AbortSignal) => getImportRows(jobId, page, signal), [jobId, page])
  const loadMissing = useCallback(
    (signal: AbortSignal) => getMissingCourses(jobId, missingPage, signal),
    [jobId, missingPage],
  )
  const jobQuery = useApiQuery(`${businessId}:${jobId}`, loadJob)
  const job = resolvedJob ?? jobQuery.data
  const rowsQuery = useApiQuery(job ? `${jobId}:${page}` : null, loadRows)
  const missingQuery = useApiQuery(
    job?.summary.missingCourseCount ? `${jobId}:${missingPage}` : null,
    loadMissing,
  )
  const queryError = jobQuery.error ?? rowsQuery.error ?? missingQuery.error

  function reloadQueries() {
    jobQuery.reload()
    rowsQuery.reload()
    missingQuery.reload()
  }

  const pending = job?.status === 'PREVIEW'
  const allConfirmed =
    !!job &&
    job.requiredWarningKeys.length === confirmed.length &&
    job.requiredWarningKeys.every((key) => confirmed.includes(key))

  async function checkJob() {
    setBusy(true)
    try {
      const response = await getImportJob(jobId)
      setResolvedJob(response.job)
      setNeedsCheck(false)
      setError('')
      reloadQueries()
    } catch (error) {
      handleError(error)
    } finally {
      setBusy(false)
    }
  }

  function handleError(error: unknown) {
    setError(getApiErrorMessage(error))
    if (isAuthStateError(error)) {
      void refreshUser()
    }
  }

  async function apply() {
    if (!job || busy || mustPreview || !allConfirmed) return
    setBusy(true)
    setError('')
    // 응답 유실 뒤 재전송에도 최초 version과 확인 키를 그대로 사용한다.
    applyRequest.current ??= { version: job.version, confirmedWarningKeys: [...confirmed] }
    try {
      const response = await applyCourseImport(jobId, applyRequest.current)
      setResolvedJob(response.job)
      setNeedsCheck(false)
    } catch (error) {
      handleError(error)
      if (error instanceof ApiError && error.status === 409) {
        setMustPreview(true)
      }
      setNeedsCheck(true)
    } finally {
      setBusy(false)
    }
  }

  async function cancel() {
    if (!job || busy || needsCheck || applyRequest.current) return
    setBusy(true)
    setError('')
    try {
      const response = await cancelCourseImport(jobId, job.version)
      setResolvedJob(response.job)
    } catch (error) {
      handleError(error)
      setNeedsCheck(true)
    } finally {
      setBusy(false)
    }
  }

  const columns: TableColumnsType<ImportRow> = [
    { title: '행', dataIndex: 'rowNumber', width: 52 },
    {
      title: '결과',
      key: 'disposition',
      width: 98,
      render: (_, row) => (
        <Tag
          className="m-0"
          color={
            row.disposition === 'ERROR' ? 'error' : row.disposition === 'ADDED' ? 'processing' : undefined
          }
        >
          {rowLabels[row.disposition]}
        </Tag>
      ),
    },
    { title: '외부 키', dataIndex: 'externalKey', width: 150 },
    {
      title: '변경 내용',
      key: 'changes',
      width: 340,
      render: (_, row) => (
        <div className="flex flex-col gap-xs [overflow-wrap:anywhere]">
          {row.changes.length ? (
            row.changes.map((change) => (
              <span key={change.field}>
                {change.field}: {displayChange(change.before)} <ArrowRightOutlined aria-label="에서" />{' '}
                {displayChange(change.after)}
              </span>
            ))
          ) : (
            <span className="text-(--ant-color-text-tertiary)">변경 항목 없음</span>
          )}
        </div>
      ),
    },
    {
      title: '확인할 내용',
      key: 'issues',
      width: 360,
      render: (_, row) => (
        <div className="flex flex-col gap-xs [overflow-wrap:anywhere]">
          {row.errors.map((issue, index) => (
            <span key={`${issue.field}:${index}`} className="text-(--ant-color-error-text)">
              {issue.field}: {issue.message}
            </span>
          ))}
          {row.warnings.map((warning) => (
            <Checkbox
              key={warning.key}
              checked={confirmed.includes(warning.key)}
              disabled={
                !pending || busy || !!applyRequest.current || !job?.requiredWarningKeys.includes(warning.key)
              }
              onChange={(event) =>
                setConfirmed((previous) =>
                  event.target.checked
                    ? [...previous, warning.key]
                    : previous.filter((key) => key !== warning.key),
                )
              }
            >
              <span className="text-caption text-(--ant-color-warning-text)">
                <WarningOutlined /> {warning.field}: {warning.message}
              </span>
            </Checkbox>
          ))}
          {!row.errors.length && !row.warnings.length && (
            <span className="text-(--ant-color-text-tertiary)">-</span>
          )}
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-md">
      <Steps
        current={job?.status === 'APPLIED' ? 2 : 1}
        size="small"
        responsive={false}
        titlePlacement={isMobile ? 'vertical' : 'horizontal'}
        className="max-w-[450px]"
        items={[{ title: '파일 선택' }, { title: '미리보기 확인' }, { title: '등록' }]}
      />
      {error && (
        <Alert
          type="error"
          showIcon
          title={error}
          description={
            mustPreview
              ? '기준이 바뀌었을 수 있어요. 작업 상태를 확인하고 적용 전이면 새 미리보기를 만들어 주세요.'
              : needsCheck
                ? '응답을 확인하지 못했어요. 적용·취소 결과를 먼저 확인해 주세요.'
                : undefined
          }
          action={
            <Button loading={busy} onClick={checkJob}>
              작업 상태 확인
            </Button>
          }
        />
      )}
      {!!queryError && (
        <Alert
          type="error"
          showIcon
          title={getApiErrorMessage(queryError)}
          action={<Button onClick={reloadQueries}>다시 시도</Button>}
        />
      )}
      {job && (
        <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-md min-[992px]:p-lg' }}>
          <div className="mb-sm flex flex-wrap items-center gap-xs">
            <span className="break-all text-body font-medium">{job.fileName}</span>
            <span className="text-caption">총 {job.summary.totalRowCount}행</span>
            <Tag color="processing">신규 {job.summary.addedCount}</Tag>
            <Tag color="success">갱신 {job.summary.changedCount}</Tag>
            <Tag>변경 없음 {job.summary.unchangedCount}</Tag>
            <Tag color="warning">경고 행 {job.summary.warningRowCount}</Tag>
            <Tag color="error">오류 행 {job.summary.errorRowCount}</Tag>
          </div>
          <Alert showIcon {...getImportNotice(job)} />
          {job.result && (
            <p className="mb-0 text-caption">
              신규 {job.result.addedCount}건, 갱신 {job.result.changedCount}건, 변경 없음{' '}
              {job.result.unchangedCount}건 · 생성된 할 일 {job.result.recalculation.createdTaskCount}건 ·
              마감 변경 {job.result.recalculation.deadlineChangedTaskCount}건
            </p>
          )}
        </Card>
      )}
      <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-md min-[992px]:p-lg' }}>
        <Table
          rowKey="rowNumber"
          dataSource={rowsQuery.data?.items ?? []}
          columns={columns}
          loading={jobQuery.isLoading || rowsQuery.isLoading}
          size="small"
          rowHoverable={false}
          scroll={{ x: 1000 }}
          pagination={{
            current: page + 1,
            pageSize: 20,
            total: rowsQuery.data?.totalElements ?? 0,
            showSizeChanger: false,
            onChange: (value) => setPage(value - 1),
          }}
          rowClassName={(row) =>
            row.errors.length
              ? '[&>td]:bg-(--ant-color-error-bg)'
              : row.warnings.length
                ? '[&>td]:bg-(--ant-color-warning-bg)'
                : ''
          }
          classNames={{
            header: { cell: 'text-caption font-medium' },
            body: { cell: 'px-sm py-xs text-caption' },
          }}
        />
        {!!job?.requiredWarningKeys.length && (
          <p className="mb-0 text-caption">
            경고 확인 {confirmed.length} / {job.requiredWarningKeys.length}건 · 페이지를 이동해 각 경고를
            확인해 주세요.
          </p>
        )}
      </Card>
      {!!job?.summary.missingCourseCount && (
        <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-md min-[992px]:p-lg' }}>
          <h3 className="mt-0 mb-sm text-card-title">
            파일에 없는 기존 과정 {job.summary.missingCourseCount}개
          </h3>
          <p className="text-caption text-(--ant-color-text-secondary)">
            아래 과정은 삭제하거나 변경하지 않아요.
          </p>
          <ul className="pl-md text-caption">
            {missingQuery.data?.items.map((course) => (
              <li key={course.id}>
                {course.externalKey} · {course.name}
              </li>
            ))}
          </ul>
          <Pagination
            size="small"
            current={missingPage + 1}
            pageSize={20}
            total={missingQuery.data?.totalElements ?? 0}
            showSizeChanger={false}
            hideOnSinglePage
            onChange={(value) => setMissingPage(value - 1)}
          />
        </Card>
      )}
      <div className={`flex flex-wrap gap-xs ${isMobile ? '[&>button]:flex-1' : 'justify-end'}`}>
        <Button icon={<UploadOutlined aria-hidden />} disabled={busy} onClick={onReset}>
          다른 파일 올리기
        </Button>
        {pending && (
          <>
            <Button disabled={busy || needsCheck || !!applyRequest.current} onClick={cancel}>
              미리보기 취소
            </Button>
            <Button
              type="primary"
              loading={busy}
              disabled={
                !job.canApply ||
                !allConfirmed ||
                mustPreview ||
                needsCheck ||
                !!queryError ||
                jobQuery.isLoading ||
                rowsQuery.isLoading
              }
              onClick={apply}
            >
              {job.summary.totalRowCount}건 전체 적용
            </Button>
          </>
        )}
        {pending && needsCheck && !mustPreview && applyRequest.current && (
          <Button disabled={busy} onClick={apply}>
            동일 요청 다시 보내기
          </Button>
        )}
        {job?.status === 'APPLIED' && (
          <Link to="/admin/courses">
            <Button type="primary">과정 목록으로</Button>
          </Link>
        )}
      </div>
    </div>
  )
}
