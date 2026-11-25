import { useEffect, useRef, useState } from 'react'
import { InboxOutlined } from '@ant-design/icons'
import { Alert, App, Button, Steps, Upload } from 'antd'
import type { UploadProps } from 'antd'
import { useSearchParams } from 'react-router'

import { previewCourseImport } from '../../../../api/courses'
import { ApiError, getApiErrorMessage } from '../../../../api/client'
import PageHeader from '../../../../components/layout/PageHeader'
import ContentCard from '../../../../components/common/ContentCard'
import CourseImportPreview from './CourseImportPreview'
import useApiErrorHandler from '../../../../hooks/useApiErrorHandler'

const importRules = [
  '이 사업의 기존 외부 키는 갱신하고 다른 사업에서 쓰는 키는 오류로 처리해요.',
  '장기·단기는 시작일과 종료일을 포함한 180일 기준으로 계산해요.',
  '오류가 하나라도 있으면 전체를 적용하지 않아요. 경고는 내용을 확인한 뒤 적용할 수 있어요.',
  '미등록 이메일만 배정에서 제외하고 같은 영역의 정상 공동 담당자는 유지해요.',
  '파일에 없는 과정은 유지해요. 일정이 바뀔 때만 미완료 할 일을 다시 계산해요.',
  '비활성 사업·폐쇄 조직에는 새 과정을 등록할 수 없어요.',
]

type CourseImportProps = { businessId: string; business: string; isMobile: boolean }

export default function CourseImport({ businessId, business, isMobile }: CourseImportProps) {
  const { message } = App.useApp()
  const { checkLogin } = useApiErrorHandler()
  const [params, setParams] = useSearchParams()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<unknown>(null)
  const jobId = params.get('jobId')
  const uploadRequest = useRef<AbortController | null>(null)

  useEffect(() => () => uploadRequest.current?.abort(), [])

  async function upload(file: File) {
    uploadRequest.current?.abort()
    const controller = new AbortController()
    uploadRequest.current = controller
    setBusy(true)
    setError(null)
    try {
      const job = await previewCourseImport(businessId, file, controller.signal)
      if (controller.signal.aborted) return
      const next = new URLSearchParams(params)
      next.delete('preview')
      next.set('jobId', job.id)
      setParams(next, { replace: true })
    } catch (error) {
      if (controller.signal.aborted) return
      setError(error)
      checkLogin(error)
    } finally {
      if (!controller.signal.aborted) setBusy(false)
    }
  }

  const uploadProps: UploadProps = {
    accept: '.csv,text/csv',
    maxCount: 1,
    multiple: false,
    showUploadList: false,
    fileList: [],
    disabled: busy,
    beforeUpload: (file) => {
      if (!file.name.toLowerCase().endsWith('.csv')) {
        message.error('CSV 파일을 선택해 주세요.')
      } else if (!busy) {
        void upload(file)
      }
      return false
    },
  }

  return (
    <div className="flex flex-col gap-md">
      <PageHeader
        title="과정 가져오기"
        description={`${business}의 과정을 CSV 파일로 등록하거나 갱신해요. 오류가 하나라도 있으면 아무것도 적용하지 않아요.`}
      />
      {jobId ? (
        <CourseImportPreview
          key={jobId}
          jobId={jobId}
          businessId={businessId}
          isMobile={isMobile}
          onReset={() => {
            const next = new URLSearchParams(params)
            next.delete('jobId')
            next.delete('preview')
            setParams(next, { replace: true })
          }}
        />
      ) : (
        <>
          <Steps
            current={0}
            size="small"
            responsive={false}
            titlePlacement={isMobile ? 'vertical' : 'horizontal'}
            className="max-w-[450px]"
            items={[{ title: '파일 선택' }, { title: '미리보기 확인' }, { title: '등록' }]}
          />
          {error !== null && (
            <Alert
              type="error"
              showIcon
              title={getApiErrorMessage(error)}
              description={
                error instanceof ApiError && error.fieldErrors.length > 0 ? (
                  <ul className="m-0 list-disc pl-md">
                    {error.fieldErrors.map((entry, index) => (
                      <li key={`${entry.field}:${index}`}>{entry.message}</li>
                    ))}
                  </ul>
                ) : undefined
              }
            />
          )}
          <ContentCard>
            <Upload.Dragger {...uploadProps} className="block">
              <div className="flex min-h-[112px] flex-col items-center justify-center gap-xs p-md min-[992px]:min-h-[140px]">
                <InboxOutlined className="text-[32px] text-(--ant-color-primary-text)" />
                <p className="m-0 text-card-title font-medium">
                  {busy
                    ? '파일을 전송하고 미리보기를 만드는 중이에요'
                    : isMobile
                      ? '눌러서 CSV 파일을 고르세요'
                      : 'CSV 파일을 여기로 끌어 놓거나 눌러서 고르세요'}
                </p>
                <p className="m-0 text-caption text-(--ant-color-text-tertiary)">
                  한 번에 파일 1개 · UTF-8 CSV · 최대 10MiB
                </p>
              </div>
            </Upload.Dragger>
            <Button
              type="link"
              href={`${import.meta.env.BASE_URL}templates/courses_template.csv`}
              download="courses_template.csv"
              className="mt-sm hit-area h-auto p-0 text-body"
            >
              양식 내려받기 (courses_template.csv)
            </Button>
          </ContentCard>
          <ContentCard>
            <h3 className="mt-0 mb-xs text-card-title font-medium">가져오기 규칙</h3>
            <ul
              className="m-0 flex list-disc flex-col gap-xs pl-md text-caption
              text-(--ant-color-text-secondary)"
            >
              {importRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </ContentCard>
        </>
      )}
    </div>
  )
}
