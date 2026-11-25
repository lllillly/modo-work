import { useRef, useState } from 'react'
import { ArrowLeftOutlined, FullscreenOutlined, HistoryOutlined, LeftOutlined, LinkOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, InputNumber, Skeleton, Tag } from 'antd'
import { Link, useParams, useSearchParams } from 'react-router'

import { getDocumentFileUrl } from '../../../api/documents'
import LoadingError from '../../../components/common/LoadingError'
import NoticeCard from '../../../components/common/NoticeCard'
import PageNotFound from '../../../components/common/PageNotFound'
import { getDocumentScope, getExternalHref, getViewerMeta } from '../documentData'
import DocumentSearchPanel from './DocumentSearchPanel'
import DocumentVersionsDrawer from './DocumentVersionsDrawer'
import useDocuments from '../useDocuments'
import IconAction from '../../../components/common/IconAction'
import { formatMonthDay } from '../../../utils/date'

type DocumentViewerProps = {
  businessId: string
  businessName: string
  isMobile: boolean
}

export default function DocumentViewer({ businessId, businessName, isMobile }: DocumentViewerProps) {
  const { documentId } = useParams()
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number.parseInt(params.get('page') ?? '', 10) || 1)
  const frameBox = useRef<HTMLDivElement>(null)
  const [showVersions, setShowVersions] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const query = useDocuments(businessId)
  const item = query.data?.find((candidate) => candidate.id === documentId)

  function movePage(next: number | null) {
    setParams({ page: String(Math.max(1, next ?? page)) }, { replace: true })
  }

  function openFullscreen(fileUrl: string) {
    const openInTab = () => window.open(fileUrl, '_blank', 'noreferrer')
    if (!document.fullscreenEnabled || !frameBox.current) {
      openInTab()
      return
    }
    frameBox.current.requestFullscreen().catch(openInTab)
  }

  if (query.isLoading) {
    return (
      <Card
        variant="borderless"
        className="shadow-none"
        classNames={{ body: isMobile ? 'p-md' : 'p-lg' }}
        aria-label="문서 불러오는 중"
        aria-busy="true"
      >
        <Skeleton active title={{ width: '40%' }} paragraph={{ rows: 10, width: '100%' }} />
      </Card>
    )
  }

  if (query.error) {
    return (
      <LoadingError title="문서를 불러오지 못했어요" onRetry={query.reload} />
    )
  }

  if (!item) {
    return (
      <PageNotFound
        title="문서를 찾을 수 없어요"
        description="삭제됐거나 볼 수 없는 문서예요."
        backTo="/documents"
        backLabel="문서 목록으로"
      />
    )
  }

  const externalHref = getExternalHref(item)

  if (item.sourceType === 'LINK' || !item.originalFilename) {
    return (
      <NoticeCard
        icon={<LinkOutlined aria-hidden className="text-4xl text-(--ant-color-primary-text)" />}
        title={item.title}
        description="외부 링크 문서는 새 탭에서 열려요."
        action={
          <span className="flex gap-xs">
            {externalHref && (
              <a href={externalHref} target="_blank" rel="noreferrer">
                <Button type="primary" className="h-7">새 탭에서 열기</Button>
              </a>
            )}
            <Link to="/documents">
              <Button className="h-7">문서 목록으로</Button>
            </Link>
          </span>
        }
      />
    )
  }

  const fileUrl = getDocumentFileUrl(item.id, businessId, page)
  const frame = (
    <div ref={frameBox} className="h-full w-full">
      <iframe key={page} title={`${item.title} 문서`} src={fileUrl} className="h-full w-full border-0" />
    </div>
  )
  const fullscreenButton = (
    <Button
      type="text"
      aria-label="전체 화면"
      title="전체 화면"
      icon={<FullscreenOutlined />}
      onClick={() => openFullscreen(fileUrl)}
    />
  )
  const pageControls = <PageControls key={page} page={page} total={item.pageCount} onMove={movePage} />
  const revisedTag = item.contentRevision > 1 && (
    <Tag variant="outlined" color="processing" className="m-0 text-caption">
      개정됨 {formatMonthDay(item.updatedAt)}
    </Tag>
  )
  const versionsButton = (
    <IconAction label="버전 기록" icon={<HistoryOutlined />} onClick={() => setShowVersions(true)} />
  )
  const versionsDrawer = showVersions && (
    <DocumentVersionsDrawer
      item={item}
      meta={`${item.documentTypeName} · ${getDocumentScope(item, businessName)}`}
      businessId={businessId}
      isMobile={isMobile}
      onClose={() => setShowVersions(false)}
    />
  )

  if (isMobile) {
    return (
      <div className="-m-md flex min-h-0 flex-1 flex-col bg-(--ant-color-bg-container)">
        <div className="flex items-center justify-between gap-sm border-0 border-b border-solid border-(--ant-color-border-secondary) px-md py-sm">
          <div className="min-w-0">
            <h1 className="m-0 truncate text-body font-medium">{item.title}</h1>
            <p className="m-0 flex items-center gap-xs text-caption text-(--ant-color-text-tertiary)">
              {getViewerMeta(item, businessName)}
              {revisedTag}
            </p>
          </div>
          <span className="flex shrink-0 items-center">
            {versionsButton}
            <Button
              type="text"
              aria-label="문서 안에서 찾기"
              aria-expanded={showSearch}
              icon={<SearchOutlined />}
              onClick={() => setShowSearch((open) => !open)}
            />
            {fullscreenButton}
          </span>
        </div>
        {showSearch && (
          <div className="max-h-[45vh] overflow-y-auto border-0 border-b border-solid border-(--ant-color-border-secondary) p-md">
            <DocumentSearchPanel businessId={businessId} documentId={item.id} autoFocus />
          </div>
        )}
        <div className="min-h-0 flex-1 bg-(--ant-color-fill-tertiary)">{frame}</div>
        <div className="flex justify-center border-0 border-t border-solid border-(--ant-color-border-secondary) py-2.5">
          {pageControls}
        </div>
        {versionsDrawer}
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-md">
      <div className="flex flex-wrap items-center gap-sm rounded-lg bg-(--ant-color-bg-container) px-md py-2.5">
        <Link to="/documents" className="text-caption">
          <ArrowLeftOutlined aria-hidden /> 문서
        </Link>
        <h1 className="m-0 text-card-title font-bold">{item.title}</h1>
        <span className="text-caption text-(--ant-color-text-tertiary)">{getViewerMeta(item, businessName)}</span>
        {revisedTag}
        {versionsButton}
        <span className="ml-auto flex items-center gap-xs">
          {pageControls}
          {fullscreenButton}
        </span>
      </div>
      <div className="flex min-h-120 flex-1 gap-md">
        <div className="min-w-0 flex-1 overflow-hidden rounded-lg bg-(--ant-color-fill-tertiary)">{frame}</div>
        <aside className="flex w-80 shrink-0 flex-col gap-xs rounded-lg bg-(--ant-color-bg-container) p-md">
          <p className="m-0 text-body font-medium">이 문서에서 찾기</p>
          <DocumentSearchPanel businessId={businessId} documentId={item.id} />
        </aside>
      </div>
      <div className="flex items-center gap-xs rounded-lg bg-(--ant-color-bg-container) px-md py-2.5 text-caption">
        <span className="font-medium">연결된 할 일</span>
        <span className="text-(--ant-color-text-tertiary)">준비 중이에요</span>
      </div>
      {versionsDrawer}
    </div>
  )
}

type PageControlsProps = {
  page: number
  total: number | null
  onMove: (page: number | null) => void
}

function PageControls({ page, total, onMove }: PageControlsProps) {
  const [draft, setDraft] = useState<number | null>(page)

  return (
    <span className="flex items-center gap-xs">
      <Button
        type="text"
        size="small"
        aria-label="이전 쪽"
        icon={<LeftOutlined />}
        disabled={page <= 1}
        onClick={() => onMove(page - 1)}
      />
      <InputNumber
        aria-label="쪽 번호"
        size="small"
        min={1}
        max={total ?? undefined}
        controls={false}
        value={draft}
        onChange={setDraft}
        onPressEnter={() => onMove(draft)}
        onBlur={() => onMove(draft)}
        className="w-14"
      />
      <span className="text-body text-(--ant-color-text-secondary)">{total ? `/ ${total}쪽` : '쪽'}</span>
      <Button
        type="text"
        size="small"
        aria-label="다음 쪽"
        icon={<RightOutlined />}
        disabled={total !== null && page >= total}
        onClick={() => onMove(page + 1)}
      />
    </span>
  )
}
