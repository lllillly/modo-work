import { Button, Input } from 'antd'
import type { KeyboardEvent } from 'react'

import { getQueryLength, MAX_QUERY_LENGTH } from '../askData'

type QuestionInputProps = {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  isMobile: boolean
  isEnded: boolean
  isPending: boolean
}

export default function QuestionInput({ value, onChange, onSend, isMobile, isEnded, isPending }: QuestionInputProps) {
  const length = getQueryLength(value)
  const overCount = length - MAX_QUERY_LENGTH
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
          aria-label="질문 입력"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isEnded}
          placeholder={isEnded && !isMobile ? '대화가 끝났어요. 새 대화를 시작해 주세요' : '궁금한 것을 물어보세요'}
          status={overCount > 0 ? 'error' : undefined}
          autoSize={{ minRows: 1, maxRows: isMobile ? 4 : 5 }}
          count={{ show: true, max: MAX_QUERY_LENGTH, strategy: getQueryLength }}
          className={isMobile ? 'rounded-[20px]' : 'rounded-lg'}
          classNames={{
            textarea: `resize-none pr-[72px] pl-sm ${isMobile ? 'min-h-[41px] py-[9px]' : 'min-h-[43px] py-2.5'}`,
            count: `right-sm bottom-2.5 ${isMobile ? 'text-[11px]' : 'text-caption'} ${overCount > 0 ? 'text-(--ant-color-error)' : ''}`,
          }}
        />
        <Button
          type="primary"
          disabled={isEnded || isPending || overCount > 0}
          onClick={() => {
            if (canSend) onSend()
          }}
          className={`shrink-0 ${isMobile ? 'mb-[1.5px] h-[38px] rounded-[19px] px-[14px] text-[13px]' : 'h-[41px] rounded-lg px-md'}`}
        >
          보내기
        </Button>
      </div>

      {overCount > 0 && (
        <p className="m-0 text-caption text-(--ant-color-error)">
          {MAX_QUERY_LENGTH}자까지 입력할 수 있어요. {overCount}자를 줄여 주세요.
        </p>
      )}
      <p className={`m-0 text-(--ant-color-text-tertiary) ${isMobile ? 'text-[11px]' : 'text-caption'}`}>
        {isMobile ? '개인정보는 넣지 마세요' : '이름·전화번호 같은 개인정보는 넣지 마세요. 질문 기록은 개인정보를 가린 상태로 저장돼요.'}
      </p>
    </div>
  )
}
