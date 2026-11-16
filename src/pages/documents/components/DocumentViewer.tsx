import { useRef, useState } from 'react'
import { ArrowLeftOutlined, FullscreenOutlined, LeftOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Input, InputNumber, Skeleton } from 'antd'
import { Link, useParams, useSearchParams } from 'react-router'

import { getDocumentFileUrl } from '../../../api/documents'
import NoticeCard, { ErrorTriangle } from '../../../components/common/NoticeCard'
import { getExternalHref, getViewerMeta } from '../documentData'
import useDocuments from '../useDocuments'

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
      <NoticeCard
        icon={<ErrorTriangle />}
        title="문서를 불러오지 못했어요"
        description="잠시 후 다시 시도해 주세요."
        action={
          <Button className="h-7" onClick={query.reload}>
            다시 시도
          </Button>
        }
      />
    )
  }

  if (!item) {
    return (
      <NoticeCard
        icon={<ErrorTriangle />}
        title="문서를 찾을 수 없어요"
        description="삭제됐거나 볼 수 없는 문서예요."
        action={
          <Link to="/documents">
            <Button className="h-7">문서 목록으로</Button>
          </Link>
        }
      />
    )
  }

  const externalHref = getExternalHref(item)

  if (item.sourceType === 'LINK' || !item.originalFilename) {
    return (
      <NoticeCard
        icon={<ErrorTriangle />}
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
  const pageControls = <PageControls key={page} page={page} onMove={movePage} />

  if (isMobile) {
    return (
      <div className="-m-md flex min-h-0 flex-1 flex-col bg-(--ant-color-bg-container)">
        <div className="flex items-center justify-between gap-sm border-0 border-b border-solid border-(--ant-color-border-secondary) px-md py-sm">
          <div className="min-w-0">
            <h2 className="m-0 truncate text-body font-medium">{item.title}</h2>
            <p className="m-0 text-caption text-(--ant-color-text-tertiary)">{getViewerMeta(item, businessName)}</p>
          </div>
          <span className="flex shrink-0 items-center">
            <Button type="text" aria-label="문서 안에서 찾기" icon={<SearchOutlined />} disabled />
            {fullscreenButton}
          </span>
        </div>
        <div className="min-h-0 flex-1 bg-(--ant-color-fill-tertiary)">{frame}</div>
        <div className="flex justify-center border-0 border-t border-solid border-(--ant-color-border-secondary) py-2.5">
          {pageControls}
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-md">
      <div className="flex flex-wrap items-center gap-sm rounded-lg bg-(--ant-color-bg-container) px-md py-2.5">
        <Link to="/documents" className="text-caption">
          <ArrowLeftOutlined aria-hidden /> 문서
        </Link>
        <h2 className="m-0 text-card-title font-bold">{item.title}</h2>
        <span className="text-caption text-(--ant-color-text-tertiary)">{getViewerMeta(item, businessName)}</span>
        <span className="ml-auto flex items-center gap-xs">
          {pageControls}
          {fullscreenButton}
        </span>
      </div>
      <div className="flex min-h-120 flex-1 gap-md">
        <div className="min-w-0 flex-1 overflow-hidden rounded-lg bg-(--ant-color-fill-tertiary)">{frame}</div>
        <aside className="flex w-80 shrink-0 flex-col gap-xs rounded-lg bg-(--ant-color-bg-container) p-md">
          <p className="m-0 text-body font-medium">이 문서에서 찾기</p>
          <Input
            aria-label="이 문서에서 찾기"
            prefix={<SearchOutlined className="text-(--ant-color-text-tertiary)" />}
            placeholder="문서 안 검색은 준비 중이에요"
            disabled
          />
        </aside>
      </div>
      <div className="flex items-center gap-xs rounded-lg bg-(--ant-color-bg-container) px-md py-2.5 text-caption">
        <span className="font-medium">연결된 할 일</span>
        <span className="text-(--ant-color-text-tertiary)">준비 중이에요</span>
      </div>
    </div>
  )
}

type PageControlsProps = {
  page: number
  onMove: (page: number | null) => void
}

function PageControls({ page, onMove }: PageControlsProps) {
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
        controls={false}
        value={draft}
        onChange={setDraft}
        onPressEnter={() => onMove(draft)}
        onBlur={() => onMove(draft)}
        className="w-14"
      />
      <span className="text-body text-(--ant-color-text-secondary)">쪽</span>
      <Button type="text" size="small" aria-label="다음 쪽" icon={<RightOutlined />} onClick={() => onMove(page + 1)} />
    </span>
  )
}
