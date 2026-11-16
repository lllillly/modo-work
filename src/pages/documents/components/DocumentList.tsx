import { useState } from 'react'
import { InboxOutlined, RightOutlined, SearchOutlined } from '@ant-design/icons'
import { Button, Card, Input, Skeleton } from 'antd'
import { Link } from 'react-router'

import NoticeCard, { ErrorTriangle } from '../../../components/common/NoticeCard'
import type { DocumentItem } from '../../../types/documents'
import { ALL_TYPES, getDocumentMeta, getDocumentTypes, getExternalHref, isSearchExcluded } from '../documentData'
import useDocuments from '../useDocuments'

type DocumentListProps = {
  businessId: string
  businessName: string
  isMobile: boolean
}

export default function DocumentList({ businessId, businessName, isMobile }: DocumentListProps) {
  const [typeId, setTypeId] = useState(ALL_TYPES)
  const [keyword, setKeyword] = useState('')
  const query = useDocuments(businessId)
  const documents = query.data ?? []
  const types = getDocumentTypes(documents)
  const trimmedKeyword = keyword.trim().toLowerCase()
  const visibleDocuments = documents.filter(
    (item) =>
      (typeId === ALL_TYPES || item.documentTypeId === typeId) &&
      item.title.toLowerCase().includes(trimmedKeyword),
  )

  const search = (
    <Input
      aria-label="문서 제목 검색"
      prefix={<SearchOutlined className="text-(--ant-color-text-tertiary)" />}
      placeholder="문서 제목 검색"
      allowClear
      value={keyword}
      onChange={(event) => setKeyword(event.target.value)}
    />
  )

  const filters = (
    <div
      className={`flex items-center gap-xs ${
        isMobile ? 'overflow-x-auto' : 'flex-wrap'
      }`}
    >
      {[{ id: ALL_TYPES, name: '전체' }, ...types].map((type) => (
        <Button
          key={type.id}
          shape="round"
          color={typeId === type.id ? 'primary' : 'default'}
          variant="outlined"
          aria-pressed={typeId === type.id}
          onClick={() => setTypeId(type.id)}
          className={`shrink-0 text-caption ${
            typeId === type.id ? 'bg-(--ant-color-primary-bg)' : ''
          }`}
        >
          {type.name}
        </Button>
      ))}
      {!isMobile && (
        <span className="text-caption text-(--ant-color-text-tertiary)">사업: {businessName} + 공통</span>
      )}
    </div>
  )

  return (
    <div className="flex flex-col gap-md">
      {!isMobile && (
        <div className="flex flex-col gap-xxs">
          <h2 className="m-0 text-section-title">문서</h2>
          <p className="m-0 text-caption text-(--ant-color-text-secondary)">
            운영에 필요한 문서를 보고, 문서 안의 내용을 찾을 수 있어요.
          </p>
        </div>
      )}

      {query.isLoading ? (
        <Card
          variant="borderless"
          className="shadow-none"
          classNames={{ body: isMobile ? 'p-md' : 'p-lg' }}
          aria-label="문서 목록 불러오는 중"
          aria-busy="true"
        >
          <Skeleton active title={false} paragraph={{ rows: 6, width: '100%' }} />
        </Card>
      ) : query.error ? (
        <NoticeCard
          icon={<ErrorTriangle />}
          title="문서 목록을 불러오지 못했어요"
          description="잠시 후 다시 시도해 주세요."
          action={
            <Button className="h-7" onClick={query.reload}>
              다시 시도
            </Button>
          }
        />
      ) : documents.length === 0 ? (
        <NoticeCard
          icon={<InboxOutlined className="text-3xl text-(--ant-color-text-tertiary)" />}
          title="아직 볼 수 있는 문서가 없어요"
          description="관리자가 문서를 올리면 여기에 보여요. 필요한 문서가 있으면 관리자에게 요청해 주세요."
        />
      ) : (
        <>
          {isMobile ? (
            <>
              {search}
              {filters}
            </>
          ) : (
            <>
              {filters}
              {search}
            </>
          )}
          {visibleDocuments.length === 0 && trimmedKeyword ? (
            <NoticeCard
              icon={<SearchOutlined aria-hidden className="text-4xl text-(--ant-color-text-tertiary)" />}
              title={`"${keyword.trim()}"이 나온 문서가 없어요`}
              description="다른 단어로 찾거나, 물어보기에 질문해 보세요. 텍스트가 없는 PDF는 검색되지 않아요."
              action={
                <Button className="h-7" disabled>
                  물어보기로 질문하기
                </Button>
              }
            />
          ) : (
            <div className="rounded-lg bg-(--ant-color-bg-container) px-md min-[992px]:px-lg">
              <p className="m-0 py-2.5 text-caption text-(--ant-color-text-secondary)">
                볼 수 있는 문서 {visibleDocuments.length}개
              </p>
              {visibleDocuments.map((item) => (
                <DocumentRow
                  key={item.id}
                  item={item}
                  meta={getDocumentMeta(item, businessName)}
                  isMobile={isMobile}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

type DocumentRowProps = {
  item: DocumentItem
  meta: string
  isMobile: boolean
}

function DocumentRow({ item, meta, isMobile }: DocumentRowProps) {
  const className = `flex items-center justify-between gap-sm border-0 border-t border-solid
    border-(--ant-color-border-secondary) py-2.5 text-(--ant-color-text) hover:text-(--ant-color-text)`

  const content = (
    <>
      <span className="flex min-w-0 flex-col gap-xxs">
        <span className={`truncate font-medium ${isMobile ? 'text-body' : 'text-body'}`}>{item.title}</span>
        <span className="text-caption text-(--ant-color-text-tertiary)">
          {meta}
          {isSearchExcluded(item) && (
            <span className="text-(--ant-color-warning-text)"> · 텍스트 없음, 검색 제외</span>
          )}
        </span>
      </span>
      {isMobile && <RightOutlined aria-hidden className="shrink-0 text-caption text-(--ant-color-text-tertiary)" />}
    </>
  )

  const externalHref = item.sourceType === 'LINK' ? getExternalHref(item) : null

  if (externalHref) {
    return (
      <a href={externalHref} target="_blank" rel="noreferrer" className={className}>
        {content}
      </a>
    )
  }

  return (
    <Link to={`/documents/${item.id}`} className={className}>
      {content}
    </Link>
  )
}
