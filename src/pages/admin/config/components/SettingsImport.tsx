import { useState } from 'react'
import { FileTextOutlined, InboxOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Upload } from 'antd'
import type { UploadProps } from 'antd'

import type { SettingsImportPreview, SettingsKind } from '../../../../types/settingsTransfer'
import { ApiError, getApiErrorMessage, isAuthStateError } from '../../../../api/client'
import { applySettingsImport, previewSettingsImport } from '../../../../api/settingsTransfer'
import { useAuth } from '../../../../providers/AuthContext'
import { getKindLabel, settingsKinds } from '../settingsKinds'

const importOrder = [
  '기준 목록 → 할 일 템플릿 → Q&A → 의도 순서로 가져와요. 설정값은 순서와 상관없어요.',
  '템플릿에 연결된 태그와 문서, 의도와 Q&A의 출처 문서는 가져오기 전에 이 환경에 있어야 해요.',
  '같은 이름이나 키의 항목은 파일 값으로 바뀌고, 파일에 없는 항목은 그대로 둬요.',
  '오류가 하나라도 있으면 아무것도 적용하지 않아요.',
]

type SettingsImportProps = { isMobile: boolean }

export default function SettingsImport({ isMobile }: SettingsImportProps) {
  const { modal, message } = App.useApp()
  const { refreshUser } = useAuth()
  const [selected, setSelected] = useState<{ file: File; kind: SettingsKind } | null>(null)
  const [preview, setPreview] = useState<{ file: File; result: SettingsImportPreview } | null>(null)
  const [failure, setFailure] = useState<{ step: 'preview' | 'apply'; error: unknown } | null>(null)
  const [busy, setBusy] = useState(false)
  const checked = preview && preview.file === selected?.file ? preview.result : null

  function reset() {
    setPreview(null)
    setFailure(null)
  }

  function fail(step: 'preview' | 'apply', error: unknown) {
    setFailure({ step, error })
    if (isAuthStateError(error)) void refreshUser()
  }

  async function selectFile(file: File) {
    reset()
    setSelected(null)
    const fileKind: unknown = await file.text().then((text) => JSON.parse(text).kind).catch(() => undefined)
    const match = settingsKinds.find((item) => item.value === fileKind)
    if (!match) {
      setSelected(null)
      message.error('내보내기로 받은 설정 파일만 가져올 수 있어요.')
      return
    }
    setSelected({ file, kind: match.value })
  }

  async function check() {
    if (!selected) return
    const { file, kind } = selected
    setBusy(true)
    reset()
    try {
      setPreview({ file, result: await previewSettingsImport(kind, file) })
    } catch (error) {
      fail('preview', error)
    } finally {
      setBusy(false)
    }
  }

  function apply() {
    if (!selected || !checked) return
    const { file, kind } = selected
    modal.confirm({
      title: `${getKindLabel(kind)} 설정을 적용할까요?`,
      content: '템플릿이 바뀌면 진행 중인 과정의 미완료 할 일 마감을 다시 계산해요.',
      okText: '적용',
      cancelText: '취소',
      onOk: async () => {
        setBusy(true)
        try {
          const result = await applySettingsImport(kind, file)
          message.success(`${getKindLabel(kind)} ${result.itemCount}개 항목을 적용했어요.`)
          setSelected(null)
          reset()
        } catch (error) {
          setPreview(null)
          fail('apply', error)
        } finally {
          setBusy(false)
        }
      },
    })
  }

  const uploadProps: UploadProps = {
    accept: '.json,application/json',
    maxCount: 1,
    multiple: false,
    showUploadList: false,
    fileList: [],
    disabled: busy,
    beforeUpload: (next) => {
      if (!next.name.toLowerCase().endsWith('.json')) {
        message.error('JSON 파일을 선택해 주세요.')
      } else {
        void selectFile(next)
      }
      return false
    },
  }

  const error = failure?.error
  const errorTitle =
    error instanceof ApiError && error.status === 409
      ? '이름이 겹치거나 다른 사람이 먼저 바꿔서 적용하지 못했어요. 아무것도 바뀌지 않았어요.'
      : !(error instanceof ApiError) && failure?.step === 'apply'
        ? '적용됐는지 확인하지 못했어요. 다시 적용하기 전에 같은 종류를 내보내 바뀌었는지 확인해 주세요.'
        : getApiErrorMessage(error)

  return (
    <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-md min-[992px]:p-lg' }}>
      <div className="flex flex-col gap-sm">
        <div>
          <h2 className="m-0 text-card-title">가져오기</h2>
          <ul className="mt-xxs mb-0 flex list-disc flex-col gap-xxs pl-md text-caption text-(--ant-color-text-secondary)">
            {importOrder.map((rule) => (
              <li key={rule}>{rule}</li>
            ))}
          </ul>
        </div>

        <Upload.Dragger {...uploadProps} className="block">
          <div className="flex min-h-[112px] flex-col items-center justify-center gap-xs p-md">
            <InboxOutlined className="text-[32px] text-(--ant-color-primary-text)" />
            <p className="m-0 text-body font-medium">
              {isMobile ? '눌러서 JSON 파일을 고르세요' : 'JSON 파일을 여기로 끌어 놓거나 눌러서 고르세요'}
            </p>
            <p className="m-0 text-caption text-(--ant-color-text-tertiary)">내보낸 파일 1개 · 최대 10MiB</p>
          </div>
        </Upload.Dragger>

        {selected && (
          <p className="m-0 flex min-w-0 items-center gap-xxs text-body">
            <FileTextOutlined aria-hidden className="text-(--ant-color-text-tertiary)" />
            <span className="truncate">{selected.file.name}</span>
            <span className="shrink-0 text-caption text-(--ant-color-text-secondary)">· {getKindLabel(selected.kind)}</span>
          </p>
        )}

        {checked && (
          <Alert
            type="success"
            showIcon
            title={`${getKindLabel(checked.kind)} ${checked.itemCount}개 항목을 확인했어요. 적용하면 이 환경에 반영돼요.`}
          />
        )}
        {failure && (
          <Alert
            type="error"
            showIcon
            title={errorTitle}
            description={
              error instanceof ApiError && error.fieldErrors.length > 0 ? (
                <ul className="m-0 list-disc pl-md">
                  {error.fieldErrors.map((entry, index) => (
                    <li key={`${entry.field}:${index}`}>
                      {entry.field}: {entry.message}
                    </li>
                  ))}
                </ul>
              ) : undefined
            }
          />
        )}

        <div className="flex justify-end gap-xs">
          <Button disabled={!selected || busy} loading={busy && !checked} onClick={() => void check()}>
            미리보기
          </Button>
          <Button type="primary" disabled={!checked || busy} loading={busy && !!checked} onClick={apply}>
            적용
          </Button>
        </div>
      </div>
    </Card>
  )
}
