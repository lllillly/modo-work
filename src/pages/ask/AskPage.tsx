import { useEffect, useRef, useSyncExternalStore } from 'react'
import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Divider } from 'antd'
import type { InputRef } from 'antd'
import { useOutletContext } from 'react-router'

import type { AppLayoutContext } from '../../layouts/AppLayout'
import type { QuestionRequest } from '../../types/question'

import { isAuthStateError } from '../../api/client'
import { askQuestion } from '../../api/questions'
import { useAuth } from '../../providers/AuthContext'
import type { AskTurn } from './askData'
import { exampleQuestions } from './askData'
import type { AskSession } from './askSession'
import {
  createTurnId,
  getAskSession,
  resetAskSession,
  subscribeAskSession,
  updateAskSession,
} from './askSession'

import BotMessage from './components/BotMessage'
import QuestionInput from './components/QuestionInput'

export default function AskPage() {
  const { isMobile, selectedBusinessId } = useOutletContext<AppLayoutContext>()
  const { user } = useAuth()
  const sessionKey = `${user?.id}-${selectedBusinessId}`
  const session = useSyncExternalStore(subscribeAskSession, () => getAskSession(sessionKey))

  return (
    <div className={`flex min-h-0 flex-1 basis-0 flex-col ${isMobile ? '-m-md' : ''}`}>
      {selectedBusinessId ? (
        <AskChat key={sessionKey} sessionKey={sessionKey} session={session} />
      ) : (
        <Card variant="borderless" className="shadow-none" classNames={{ body: 'py-xl text-center' }}>
          <p role="alert" className="m-0 text-card-title">지금은 물어보기를 쓸 수 없어요</p>
          <p className="m-0 mt-xxs text-caption text-(--ant-color-text-secondary)">
            사업 정보를 받을 수 없어서 질문을 보낼 수 없어요. 관리자에게 문의해 주세요.
          </p>
        </Card>
      )}
    </div>
  )
}

type AskChatProps = {
  sessionKey: string
  session: AskSession
}

function AskChat({ sessionKey, session }: AskChatProps) {
  const { isMobile, selectedBusinessId } = useOutletContext<AppLayoutContext>()
  const { user, refreshUser } = useAuth()
  const { turns, conversationId, draft } = session
  const inputRef = useRef<InputRef>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const isNearBottom = useRef(true)
  const turnCount = useRef(0)

  const isAdmin = !!user?.roles.some((role) => role.role === 'ADMIN')
  const businessId = selectedBusinessId ?? ''

  const lastTurn = turns.at(-1)
  const isPending = lastTurn?.status === 'loading'
  const isEnded = lastTurn?.status === 'done' && lastTurn.response?.guide?.kind === 'contact'

  useEffect(() => {
    const isAdded = turns.length > turnCount.current
    turnCount.current = turns.length
    if (isAdded || isNearBottom.current) endRef.current?.scrollIntoView({ block: 'end' })
  }, [turns])

  useEffect(() => {
    if (!isMobile && !isPending && !isEnded) inputRef.current?.focus()
  }, [isMobile, isPending, isEnded])

  const isBusy = () => getAskSession(sessionKey).turns.some((turn) => turn.status === 'loading')

  function updateTurn(id: number, values: Partial<AskTurn>) {
    updateAskSession(sessionKey, (current) => ({
      ...current,
      turns: current.turns.map((turn) => (turn.id === id ? { ...turn, ...values } : turn)),
    }))
  }

  async function runTurn(id: number, request: QuestionRequest) {
    updateTurn(id, { status: 'loading', error: undefined })

    try {
      const response = await askQuestion(request)
      updateAskSession(sessionKey, (current) =>
        current.turns.some((turn) => turn.id === id)
          ? {
              ...current,
              conversationId: response.conversationId,
              turns: current.turns.map((turn) => (turn.id === id ? { ...turn, status: 'done', response } : turn)),
            }
          : current,
      )
    } catch (error) {
      updateTurn(id, { status: 'error', error })
      if (isAuthStateError(error)) void refreshUser()
    }
  }

  function addTurn(turn: Omit<AskTurn, 'id' | 'status'>) {
    if (isBusy() || isEnded) return

    const id = createTurnId()
    updateAskSession(sessionKey, (current) => ({
      ...current,
      turns: [...current.turns, { ...turn, id, status: 'loading' }],
    }))
    void runTurn(id, turn.request)
  }

  function setDraft(value: string) {
    updateAskSession(sessionKey, (current) => ({ ...current, draft: value }))
  }

  function sendQuestion(query: string) {
    if (!query.trim()) return

    addTurn({
      type: 'question',
      request: { businessId, query, conversationId, noneSelected: false, candidateSelected: false },
    })
    setDraft('')
  }

  function choose(turn: AskTurn, choice: number | 'none') {
    if (isBusy() || !turn.response) return

    const base = { ...turn.request, conversationId: turn.response.conversationId }
    updateTurn(turn.id, { chosen: choice })

    if (choice === 'none') {
      addTurn({ type: 'none', request: { ...base, noneSelected: true, candidateSelected: false } })
      return
    }

    addTurn({
      type: 'candidate',
      selected: turn.response.candidates[choice],
      request: { ...base, noneSelected: false, candidateSelected: true },
    })
  }

  const messages = turns.map((turn) => {
    const isLast = turn === lastTurn

    return (
      <div key={turn.id} className="flex flex-col gap-sm min-[992px]:gap-md">
        {turn.type === 'question' && (
          <p className="m-0 max-w-5/6 self-end rounded-xl border border-solid border-(--ant-color-primary-border) bg-(--ant-color-primary-bg) px-sm py-xs break-words whitespace-pre-line min-[992px]:max-w-3/4 min-[992px]:px-md min-[992px]:py-xs">
            {turn.request.query}
          </p>
        )}
        <BotMessage
          turn={turn}
          canChoose={isLast && !isPending}
          canRetry={isLast}
          isAdmin={isAdmin}
          onChoose={choose}
          onRetry={(target) => void runTurn(target.id, target.request)}
        />
      </div>
    )
  })

  return (
    <section
      aria-label="물어보기 대화"
      className={`flex min-h-0 flex-1 flex-col overflow-hidden ${isMobile ? '' : 'rounded-lg bg-(--ant-color-bg-container)'}`}
    >
      <div className="flex shrink-0 items-center justify-between gap-sm px-sm pt-sm min-[992px]:justify-end min-[992px]:px-lg">
        {isMobile && <span className="text-caption text-(--ant-color-text-tertiary)">개인정보는 넣지 마세요</span>}
        <Button icon={<PlusOutlined />} disabled={turns.length === 0} onClick={() => resetAskSession(sessionKey)}>
          새 대화
        </Button>
      </div>
      <div
        className="min-h-0 flex-1 overflow-y-auto"
        onScroll={(event) => {
          const { scrollHeight, scrollTop, clientHeight } = event.currentTarget
          isNearBottom.current = scrollHeight - scrollTop - clientHeight < 80
        }}
      >
        <div className="mx-auto flex min-h-full w-full max-w-[760px] flex-col gap-sm p-md min-[992px]:gap-md min-[992px]:px-0 min-[992px]:py-lg">
          {turns.length === 0 ? (
            <Welcome isMobile={isMobile} onSelect={sendQuestion} />
          ) : (
            messages
          )}

          {isEnded && (
            <div className="flex flex-col items-center gap-sm pt-md text-center">
              <Divider plain className="my-0 text-caption text-(--ant-color-text-tertiary)">대화가 끝났어요</Divider>
              <Button type="primary" onClick={() => resetAskSession(sessionKey)}>새 대화 시작</Button>
              <p className="m-0 text-caption text-(--ant-color-text-tertiary)">다른 질문은 새 대화에서 물어봐 주세요</p>
            </div>
          )}
          <div ref={endRef} />
        </div>
      </div>

      <div className="shrink-0 border-0 border-t border-solid border-(--ant-color-border-secondary) bg-(--ant-color-bg-container) px-sm pt-2.5 pb-3.5 min-[992px]:px-lg min-[992px]:pt-3.5 min-[992px]:pb-md">
        <div className="mx-auto w-full max-w-[760px]">
          <QuestionInput
            value={draft}
            onChange={setDraft}
            onSend={() => sendQuestion(draft)}
            isMobile={isMobile}
            isEnded={isEnded}
            isPending={isPending}
            inputRef={inputRef}
          />
        </div>
      </div>
    </section>
  )
}

function Welcome({ isMobile, onSelect }: { isMobile: boolean; onSelect: (query: string) => void }) {
  return (
    <div className="m-auto flex w-full flex-col items-center gap-sm py-xl text-center">
      <h3 className={`m-0 ${isMobile ? 'text-card-title font-bold' : 'text-section-title'}`}>무엇이 궁금하세요?</h3>
      <p className={`m-0 text-(--ant-color-text-secondary) ${isMobile ? 'text-caption' : 'text-body'}`}>
        찾은 답에는 어디서 온 답인지{!isMobile && '(등록된 안내 또는 문서 몇 쪽)를'} 같이 보여 드려요.
      </p>
      <div className={`flex w-full ${isMobile ? 'flex-col gap-sm' : 'flex-wrap justify-center gap-xs pt-xs'}`}>
        {exampleQuestions.map((question) => (
          <Button
            key={question}
            shape="round"
            onClick={() => onSelect(question)}
            className={isMobile ? 'w-full text-caption' : 'px-md text-caption'}
          >
            {question}
          </Button>
        ))}
      </div>
    </div>
  )
}
