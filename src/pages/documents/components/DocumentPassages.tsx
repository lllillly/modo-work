import { Button, Skeleton, Tag } from 'antd'
import { Link } from 'react-router'

import LoadingError from '../../../components/common/LoadingError'
import type { DocumentPassage } from '../../../types/documents'

type DocumentPassagesProps = {
  passages: DocumentPassage[]
  query: string
  isLoading: boolean
  isLoadingMore: boolean
  error: unknown
  hasMore: boolean
  onMore: () => void
  onRetry: () => void
  linkTo: (passage: DocumentPassage) => string
  showTitle?: boolean
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getExcerpt(text: string, query: string) {
  const terms = query.split(/\s+/).filter(Boolean)
  const found = terms.map((term) => text.toLowerCase().indexOf(term.toLowerCase())).filter((index) => index >= 0)
  if (found.length === 0) return text
  const start = Math.min(...found)
  return start > 60 ? `…${text.slice(start - 30)}` : text
}

function Highlighted({ text, query }: { text: string; query: string }) {
  const terms = query.split(/\s+/).filter(Boolean).map(escapeRegExp)
  if (terms.length === 0) return text
  const pattern = new RegExp(`(${terms.join('|')})`, 'gi')
  return text.split(pattern).map((part, index) =>
    index % 2 === 1 ? (
      <mark key={index} className="rounded-xs bg-(--ant-color-primary-bg) px-px text-inherit">
        {part}
      </mark>
    ) : (
      part
    ),
  )
}

export default function DocumentPassages({
  passages,
  query,
  isLoading,
  isLoadingMore,
  error,
  hasMore,
  onMore,
  onRetry,
  linkTo,
  showTitle = true,
}: DocumentPassagesProps) {
  if (isLoading) return <Skeleton active title={false} paragraph={{ rows: 3, width: '100%' }} />
  if (error && passages.length === 0) {
    return <LoadingError plain title="본문 검색 결과를 불러오지 못했어요" error={error} onRetry={onRetry} />
  }
  if (passages.length === 0) return null

  return (
    <ul className="m-0 list-none p-0">
      {passages.map((passage, index) => (
        <li key={`${passage.documentId}:${passage.page}:${index}`}>
          <Link
            to={linkTo(passage)}
            className="flex flex-col gap-xxs border-0 border-t border-solid border-(--ant-color-border-secondary) py-sm text-(--ant-color-text) hover:text-(--ant-color-text)"
          >
            <span className="flex items-center gap-xs">
              {showTitle && <span className="truncate text-body font-medium">{passage.documentTitle}</span>}
              <Tag className="m-0 shrink-0">{passage.page}쪽</Tag>
            </span>
            <span className="line-clamp-3 text-caption text-(--ant-color-text-secondary)">
              <Highlighted text={getExcerpt(passage.quote, query)} query={query} />
            </span>
          </Link>
        </li>
      ))}
      {error ? (
        <li className="py-sm text-caption text-(--ant-color-error-text)">
          더 불러오지 못했어요. <Button type="link" size="small" onClick={onMore}>다시 시도</Button>
        </li>
      ) : (
        hasMore && (
          <li className="flex justify-center border-0 border-t border-solid border-(--ant-color-border-secondary) pt-sm">
            <Button loading={isLoadingMore} onClick={onMore}>
              더 보기
            </Button>
          </li>
        )
      )}
    </ul>
  )
}
