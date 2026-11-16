import { useState } from 'react'
import { InboxOutlined, WarningOutlined } from '@ant-design/icons'
import { App, Button, DatePicker, Drawer, Form, Input, Segmented, Select, Upload } from 'antd'
import type { Dayjs } from 'dayjs'

import { ApiError, getApiErrorMessage, isAuthStateError } from '../../../../api/client'
import { uploadDocument } from '../../../../api/documents'
import { useAuth } from '../../../../providers/AuthContext'
import type { DocumentKind } from '../../../../types/documents'
import type { OptionItem } from '../../../../types/courseApi'

const MAX_FILE_SIZE = 10 * 1024 * 1024
const ALL_BUSINESSES = 'ALL'
const fieldNames = ['title', 'documentTypeId', 'businessIds', 'effectiveDate'] as const

type FormValues = {
  title: string
  documentTypeId: string
  businessIds: string[]
  effectiveDate?: Dayjs
}

type DocumentUploadDrawerProps = {
  kinds: DocumentKind[]
  businesses: OptionItem[]
  isMobile: boolean
  onClose: () => void
  onUploaded: (id: string, title: string) => void
}

function formatFileSize(size: number) {
  return size >= 1024 * 1024 ? `${(size / 1024 / 1024).toFixed(1)}MB` : `${Math.max(1, Math.round(size / 1024))}KB`
}

function normalizeBusinesses(values: string[]) {
  return values[values.length - 1] === ALL_BUSINESSES
    ? [ALL_BUSINESSES]
    : values.filter((value) => value !== ALL_BUSINESSES)
}

export default function DocumentUploadDrawer({ kinds, businesses, isMobile, onClose, onUploaded }: DocumentUploadDrawerProps) {
  const { message } = App.useApp()
  const { refreshUser } = useAuth()
  const [form] = Form.useForm<FormValues>()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  function pickFile(picked: File) {
    setFile(null)
    if (picked.type !== 'application/pdf' && !picked.name.toLowerCase().endsWith('.pdf')) {
      setFileError('PDF 파일만 올릴 수 있어요.')
    } else if (picked.size === 0 || picked.size > MAX_FILE_SIZE) {
      setFileError('비어 있지 않은 10MB 이하 파일만 올릴 수 있어요.')
    } else {
      setFile(picked)
      setFileError('')
      if (!form.getFieldValue('title')) form.setFieldValue('title', picked.name.replace(/\.pdf$/i, ''))
    }
    return false
  }

  async function submit(values: FormValues) {
    if (!file) {
      setFileError('PDF 파일을 골라 주세요.')
      return
    }

    const isAll = values.businessIds.includes(ALL_BUSINESSES)
    setIsSaving(true)
    setSubmitError('')
    try {
      const title = values.title.trim()
      const id = await uploadDocument(
        {
          title,
          documentTypeId: values.documentTypeId,
          businessScope: isAll ? 'ALL' : 'SELECTED',
          businessIds: isAll ? [] : values.businessIds,
          effectiveDate: values.effectiveDate?.format('YYYY-MM-DD') ?? null,
        },
        file,
      )
      message.success('문서를 올렸어요. 물어보기가 읽는 데 잠깐 걸려요.')
      onUploaded(id, title)
      onClose()
    } catch (error) {
      setSubmitError(getApiErrorMessage(error))
      if (error instanceof ApiError) {
        form.setFields(
          error.fieldErrors.flatMap((entry) => {
            const name = fieldNames.find((field) => field === entry.field)
            return name ? [{ name, errors: [entry.message] }] : []
          }),
        )
      }
      if (isAuthStateError(error)) void refreshUser()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Drawer
      open
      size={480}
      title="문서 올리기"
      onClose={onClose}
      maskClosable={!isSaving}
      closable={!isSaving}
      footer={
        <div className="flex flex-col gap-xs min-[992px]:flex-row min-[992px]:items-center min-[992px]:justify-between">
          <span className="text-caption text-(--ant-color-text-tertiary)">올리면 물어보기가 읽는 데 잠깐 걸려요</span>
          <span className="flex justify-end gap-xs">
            <Button disabled={isSaving} onClick={onClose}>
              취소
            </Button>
            <Button type="primary" loading={isSaving} onClick={() => form.submit()}>
              올리기
            </Button>
          </span>
        </div>
      }
    >
      <Form form={form} layout="vertical" disabled={isSaving} onFinish={submit} requiredMark>
        <Form.Item label="파일 또는 링크" required validateStatus={fileError ? 'error' : undefined} help={fileError || undefined}>
          <div className="flex flex-col gap-xs">
            <Segmented
              value="file"
              options={[
                { label: '파일', value: 'file' },
                { label: '외부 링크', value: 'link', disabled: true },
              ]}
              className="self-start"
            />
            <Upload.Dragger accept=".pdf,application/pdf" showUploadList={false} beforeUpload={pickFile}>
              <div className="flex flex-col items-center gap-xxs p-md">
                <InboxOutlined className="text-2xl text-(--ant-color-primary)" />
                {file ? (
                  <>
                    <span className="text-body font-medium">{file.name}</span>
                    <span className="text-caption text-(--ant-color-text-tertiary)">
                      {formatFileSize(file.size)} · 다른 파일 고르기
                    </span>
                  </>
                ) : (
                  <span className="text-body">{isMobile ? '눌러서 PDF 파일을 고르세요' : 'PDF 파일을 끌어 놓거나 눌러서 고르세요'}</span>
                )}
              </div>
            </Upload.Dragger>
            <span className="text-caption text-(--ant-color-text-tertiary)">
              PDF는 사이트 안에서 보고 물어보기 검색에도 쓰여요. 파일은 10MB까지 올릴 수 있어요.
            </span>
          </div>
        </Form.Item>
        <Form.Item
          name="title"
          label="제목"
          rules={[
            { required: true, whitespace: true, message: '제목을 입력해 주세요.' },
            { max: 255, message: '제목은 255자까지 입력할 수 있어요.' },
          ]}
        >
          <Input />
        </Form.Item>
        <div className="grid grid-cols-2 gap-x-md">
          <Form.Item name="documentTypeId" label="종류" rules={[{ required: true, message: '종류를 선택해 주세요.' }]}>
            <Select
              placeholder="종류 선택"
              options={kinds.map((kind) => ({ value: kind.id, label: kind.name }))}
              notFoundContent="등록된 문서 종류가 없어요"
            />
          </Form.Item>
          <Form.Item
            name="businessIds"
            label="사업"
            getValueFromEvent={normalizeBusinesses}
            rules={[{ required: true, type: 'array', min: 1, message: '사업을 선택해 주세요.' }]}
          >
            <Select
              mode="multiple"
              placeholder="사업 선택"
              options={[
                { value: ALL_BUSINESSES, label: '공통' },
                ...businesses.map((business) => ({ value: business.id, label: business.name })),
              ]}
            />
          </Form.Item>
        </div>
        <div className="grid grid-cols-2 gap-x-md">
          <Form.Item name="effectiveDate" label="시행일">
            <DatePicker format="YYYY.MM.DD" className="w-full" />
          </Form.Item>
          <Form.Item label="버전">
            <Input disabled placeholder="준비 중이에요" />
          </Form.Item>
        </div>
        <Form.Item
          label="연결할 템플릿 항목"
          extra="연결하면 그 할 일 상세와 문서 보기에 서로 링크가 생겨요."
        >
          <Select disabled placeholder="준비 중이에요" />
        </Form.Item>
        <div className="flex items-center gap-xs rounded-md bg-(--ant-color-fill-quaternary) px-sm py-xs text-caption">
          <WarningOutlined aria-hidden className="text-(--ant-color-warning)" />
          계정이나 비밀번호가 담긴 문서는 올리지 마세요.
        </div>
        {submitError && <p className="mt-sm mb-0 text-caption text-(--ant-color-error)">{submitError}</p>}
      </Form>
    </Drawer>
  )
}
