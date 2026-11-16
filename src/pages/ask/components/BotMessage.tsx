import { CopyOutlined, ExclamationCircleOutlined, WarningOutlined } from '@ant-design/icons'
import { App, Button, Tag } from 'antd'
import type { ReactNode } from 'react'

import { ApiError } from '../../../api/client'
import type { Evidence } from '../../../types/question'
import type { AskTurn } from '../askData'
import { getAskErrorView, getCopyText, getSourceText } from '../askData'
import EvidenceView from './EvidenceView'

type BotMessageProps = {
  turn: AskTurn
  canChoose: boolean
  canRetry: boolean
  isAdmin: boolean
  onChoose: (turn: AskTurn, choice: number | 'none') => void
  onRetry: (turn: AskTurn) => void
}

export default function BotMessage({
  turn,
  canChoose,
  canRetry,
  isAdmin,
  onChoose,
  onRetry,
}: BotMessageProps) {
  const tone = getTone(turn)

  const toneClass = {
    default: 'border-(--ant-color-border-secondary) bg-(--ant-color-bg-container)',
    warning: 'border-(--ant-color-warning-border) bg-(--ant-color-warning-bg)',
    error: 'border-(--ant-color-error-border) bg-(--ant-color-error-bg)',
  }[tone]

  return (
    <div className="flex items-start gap-sm">
      <div
        className={`flex min-w-0 flex-1 flex-col gap-xs rounded-xl border border-solid px-md py-sm min-[992px]:max-w-[560px] min-[992px]:gap-sm min-[992px]:px-md ${toneClass}`}
      >
        <BotContent
          turn={turn}
          canChoose={canChoose}
          canRetry={canRetry}
          isAdmin={isAdmin}
          onChoose={onChoose}
          onRetry={onRetry}
        />
      </div>
    </div>
  )
}

function getTone(turn: AskTurn) {
  if (turn.status === 'error' && !turn.selected) {
    return getAskErrorView(turn.error).tone
  }
  if (turn.status === 'done' && turn.response?.status === 'pii_warning') return 'warning'
  return 'default'
}

type BotContentProps = BotMessageProps

function BotContent({ turn, canChoose, canRetry, isAdmin, onChoose, onRetry }: BotContentProps) {
  if (turn.status === 'loading') {
    return (
      <>
        {turn.selected && <EvidenceView evidence={turn.selected} isAdmin={isAdmin} />}
        <TypingDots />
      </>
    )
  }

  if (turn.status === 'error') {
    return (
      <ErrorContent turn={turn} canRetry={canRetry} isAdmin={isAdmin} onRetry={onRetry} />
    )
  }

  const response = turn.response
  if (!response) return null

  const guideText = response.guide?.text

  if (response.status === 'pii_warning') {
    return (
      <>
        <Title icon={<WarningOutlined className="text-base text-(--ant-color-warning)" />}>
          질문에 개인정보가 들어 있어서 답하지 않았어요
        </Title>
        <p className="m-0">이름, 전화번호 같은 개인정보를 빼고 다시 물어봐 주세요. 질문 기록에는 가린 상태로만 남아요.</p>
      </>
    )
  }

  if (response.status === 'clarify') {
    return (
      <ClarifyContent
        turn={turn}
        candidates={response.candidates}
        contextUsed={response.contextUsed}
        canChoose={canChoose}
        onChoose={onChoose}
      />
    )
  }

  if (response.status === 'no_answer') {
    if (response.guide?.kind === 'contact') {
      return (
        <p className="m-0 rounded-md bg-(--ant-color-fill-quaternary) px-md py-2.5 font-medium">{guideText}</p>
      )
    }
    return <p className="m-0">{guideText}</p>
  }

  const evidence = turn.selected ?? response.answer

  return (
    <>
      {evidence && <EvidenceView evidence={evidence} isAdmin={isAdmin} />}
      {guideText && <p className="m-0">{guideText}</p>}
      {evidence && <CopyButton text={getCopyText(evidence)} />}
    </>
  )
}

function TypingDots() {
  return (
    <span role="status" aria-label="답을 찾는 중" className="flex gap-xxs py-xxs">
      {[0, 150, 300].map((delay) => (
        <span
          key={delay}
          className="size-1.5 animate-bounce rounded-full bg-(--ant-color-text-quaternary)"
          style={{ animationDelay: `${delay}ms` }}
        />
      ))}
    </span>
  )
}

function CopyButton({ text }: { text: string | null }) {
  const { message } = App.useApp()
  if (!text) return null

  async function copy() {
    try {
      await navigator.clipboard.writeText(text ?? '')
      message.success('답변을 복사했어요.')
    } catch {
      message.error('복사하지 못했어요.')
    }
  }

  return (
    <Button type="text" size="small" icon={<CopyOutlined />} className="self-end text-caption text-(--ant-color-text-tertiary)" onClick={copy}>
      복사
    </Button>
  )
}

type ErrorContentProps = {
  turn: AskTurn
  canRetry: boolean
  isAdmin: boolean
  onRetry: (turn: AskTurn) => void
}

function ErrorContent({ turn, canRetry, isAdmin, onRetry }: ErrorContentProps) {
  const view = getAskErrorView(turn.error)
  const isRecordError = turn.type !== 'question' && turn.error instanceof ApiError && turn.error.status === 500
  const retry = view.canRetry && canRetry && !isRecordError && (
    <Button type="primary" className="h-7 self-start px-md text-caption" onClick={() => onRetry(turn)}>다시 시도</Button>
  )

  if (turn.selected) {
    return (
      <>
        <EvidenceView evidence={turn.selected} isAdmin={isAdmin} />
        <p className="m-0 text-caption text-(--ant-color-error)">{view.title}. {view.description}</p>
        {retry}
      </>
    )
  }

  return (
    <>
      <Title
        icon={<ExclamationCircleOutlined className={`text-base ${view.tone === 'warning' ? 'text-(--ant-color-warning)' : 'text-(--ant-color-error)'}`} />}
      >
        {view.title}
      </Title>
      <p className="m-0">{view.description}</p>
      {retry}
    </>
  )
}

type ClarifyContentProps = {
  turn: AskTurn
  candidates: Evidence[]
  contextUsed: boolean
  canChoose: boolean
  onChoose: (turn: AskTurn, choice: number | 'none') => void
}

function ClarifyContent({ turn, candidates, contextUsed, canChoose, onChoose }: ClarifyContentProps) {
  const isNoneChosen = turn.chosen === 'none'

  return (
    <>
      {contextUsed && (
        <Tag color="processing" variant="filled" className="m-0 self-start">앞 질문에 이어서</Tag>
      )}
      <p className="m-0">혹시 이 중에 물어보신 게 있나요?</p>
      <div className="flex flex-col gap-xs min-[992px]:gap-sm">
        {candidates.map((candidate, index) => (
          <CandidateButton
            key={index}
            label={candidate.label}
            source={candidate.type === 'SCREEN' ? '' : getSourceText(candidate)}
            isChosen={turn.chosen === index}
            disabled={!canChoose}
            onClick={() => onChoose(turn, index)}
          />
        ))}
      </div>
      <Button
        type="link"
        className={`h-auto self-start p-0 text-caption ${isNoneChosen ? 'font-medium' : ''}`}
        disabled={!canChoose && !isNoneChosen}
        aria-pressed={isNoneChosen}
        onClick={canChoose ? () => onChoose(turn, 'none') : undefined}
      >
        해당 없음
      </Button>
    </>
  )
}

function Title({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <p className="m-0 flex items-center gap-xs font-medium">
      {icon}
      {children}
    </p>
  )
}

type CandidateButtonProps = {
  label: string
  source: string
  isChosen: boolean
  disabled: boolean
  onClick: () => void
}

function CandidateButton({ label, source, isChosen, disabled, onClick }: CandidateButtonProps) {
  return (
    <Button
      block
      color={isChosen ? 'primary' : 'default'}
      variant="outlined"
      disabled={disabled && !isChosen}
      aria-pressed={isChosen}
      onClick={disabled ? undefined : onClick}
      className={`h-auto flex-wrap justify-between gap-x-sm gap-y-0 px-sm py-xs text-left whitespace-normal shadow-none ${
        isChosen ? 'bg-(--ant-color-primary-bg)' : ''
      }`}
    >
      <span className="min-w-0">{label}</span>
      {source && <span className="text-caption text-(--ant-color-text-secondary)">{source}</span>}
    </Button>
  )
}
