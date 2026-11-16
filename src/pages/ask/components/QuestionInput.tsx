import { Button, Input } from 'antd'
import type { InputRef } from 'antd'
import type { KeyboardEvent, RefObject } from 'react'

import { getQueryLength, hasPersonalInfo, MAX_QUERY_LENGTH } from '../askData'

type QuestionInputProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  isMobile: boolean
  isEnded: boolean
  isPending: boolean
  inputRef: RefObject<InputRef | null>
}

export default function QuestionInput({ value, onChange, onSend, isMobile, isEnded, isPending, inputRef }: QuestionInputProps) {
  const length = getQueryLength(value)
  const overCount = length - MAX_QUERY_LENGTH
  const hasPersonal = hasPersonalInfo(value)
  const canSend = !isEnded && !isPending && value.trim() !== '' && overCount <= 0

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (isMobile || event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return

    event.preventDefault()
    if (canSend) onSend()
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-end gap-xs">
        <Input.TextArea
          ref={inputRef}
          aria-label="질문 입력"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isEnded}
          placeholder={isEnded && !isMobile ? '대화가 끝났어요. 새 대화를 시작해 주세요' : '궁금한 것을 물어보세요'}
          status={overCount > 0 ? 'error' : hasPersonal ? 'warning' : undefined}
          autoSize={{ minRows: 1, maxRows: isMobile ? 4 : 5 }}
          count={{ show: true, max: MAX_QUERY_LENGTH, strategy: getQueryLength }}
          className={isMobile ? 'rounded-xl' : 'rounded-lg'}
          classNames={{
            textarea: 'min-h-10! resize-none pr-16 pl-sm py-2',
            count: `right-sm bottom-2 text-caption ${overCount > 0 ? 'text-(--ant-color-error)' : ''}`,
          }}
        />
        <Button
          type="primary"
          size="large"
          disabled={isEnded || isPending || overCount > 0}
          onClick={() => {
            if (canSend) onSend()
          }}
          className={`shrink-0 px-md ${isMobile ? 'rounded-full' : 'rounded-lg'}`}
        >
          보내기
        </Button>
      </div>

      {overCount > 0 && (
        <p className="m-0 text-caption text-(--ant-color-error)">
          {MAX_QUERY_LENGTH}자까지 입력할 수 있어요. {overCount}자를 줄여 주세요.
        </p>
      )}
      {hasPersonal && overCount <= 0 && (
        <p role="alert" className="m-0 text-caption text-(--ant-color-warning-text)">
          개인정보로 보이는 내용이 있어요. 빼고 보내 주세요.
        </p>
      )}
      {!isMobile && (
        <p className="m-0 text-caption text-(--ant-color-text-tertiary)">
          이름·전화번호 같은 개인정보는 넣지 마세요. 질문 기록은 개인정보를 가린 상태로 저장돼요.
        </p>
      )}
    </div>
  )
}
