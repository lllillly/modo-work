import { Button } from 'antd'
import { useNavigate } from 'react-router'

import type { Evidence } from '../../../types/question'
import { getDocumentUrl, getOpenablePath, getSourceText } from '../askData'

type EvidenceViewProps = {
  evidence: Evidence
  isAdmin: boolean
  businessId?: string
}

const typeLabels = { QA: '안내', DOC: '문서', SCREEN: '화면' } as const

export default function EvidenceView({ evidence, isAdmin, businessId }: EvidenceViewProps) {
  const navigate = useNavigate()
  const openPath = getOpenablePath(evidence.path, isAdmin)

  if (evidence.type === 'SCREEN') {
    return (
      <div className="flex flex-col items-start gap-sm">
        <p className="m-0">{evidence.label}</p>
        {openPath && (
          <Button
            color="primary"
            variant="outlined"
            onClick={() => navigate(openPath)}
            className="h-auto border-(--ant-color-primary-border) px-sm py-xxs text-caption shadow-none"
          >
            관련 화면 열기
          </Button>
        )}
      </div>
    )
  }

  const sourceText = getSourceText(evidence)
  const documentUrl =
    evidence.type === 'DOC' && evidence.docId && businessId
      ? getDocumentUrl(evidence.docId, businessId, evidence.page)
      : null
  const source = sourceText && (
    <div className="flex min-w-0 items-center gap-xs text-caption text-(--ant-color-text-secondary)">
      <span className="shrink-0 rounded-sm bg-(--ant-color-fill-tertiary) px-1.5 py-px text-caption font-medium">
        {typeLabels[evidence.type]}
      </span>
      <span className="min-w-0 truncate" title={sourceText}>{sourceText}</span>
      {documentUrl && (
        <a href={documentUrl} target="_blank" rel="noreferrer" className="shrink-0 whitespace-nowrap">
          문서 열기
        </a>
      )}
    </div>
  )

  if (evidence.type === 'QA') {
    return (
      <div className="flex flex-col gap-sm">
        <p className="m-0 whitespace-pre-line">{evidence.text ?? evidence.label}</p>
        {source && (
          <div className="border-0 border-t border-solid border-(--ant-color-border-secondary) pt-xs">{source}</div>
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-sm">
      <p className="m-0">운영 문서에서 관련 구절을 찾았어요.</p>
      <div className="flex flex-col gap-xs">
        {evidence.quote && (
          <blockquote className="m-0 rounded-md border-0 border-l-4 border-solid border-(--ant-color-primary) bg-(--ant-color-fill-tertiary) px-md py-2.5 whitespace-pre-line">
            {evidence.quote}
          </blockquote>
        )}
        {source}
      </div>
    </div>
  )
}
