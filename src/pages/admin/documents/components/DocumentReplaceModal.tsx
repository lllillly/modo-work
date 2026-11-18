import { useState } from 'react'
import { InboxOutlined, WarningOutlined } from '@ant-design/icons'
import { App, Button, Modal, Upload } from 'antd'

import { getApiErrorMessage, isAuthStateError } from '../../../../api/client'
import { replaceDocumentFile } from '../../../../api/documents'
import { useAuth } from '../../../../providers/AuthContext'
import type { DocumentItem } from '../../../../types/documents'
import { formatFileSize } from '../../../documents/documentData'

const MAX_FILE_SIZE = 10 * 1024 * 1024

type DocumentReplaceModalProps = {
  item: DocumentItem
  isMobile: boolean
  onClose: () => void
  onReplaced: () => void
}

export default function DocumentReplaceModal({ item, isMobile, onClose, onReplaced }: DocumentReplaceModalProps) {
  const { message } = App.useApp()
  const { refreshUser } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
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
    }
    return false
  }

  async function replace() {
    if (!file) {
      setFileError('PDF 파일을 골라 주세요.')
      return
    }

    setIsSaving(true)
    try {
      await replaceDocumentFile(item, file)
      message.success('파일을 교체했어요. 물어보기가 새 파일을 읽는 데 잠깐 걸려요.')
      onReplaced()
      onClose()
    } catch (error) {
      setFileError(getApiErrorMessage(error))
      if (isAuthStateError(error)) void refreshUser()
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <Modal
      open
      width={420}
      title={
        <span className="flex items-center gap-xs">
          <WarningOutlined className="text-(--ant-color-warning)" />
          &apos;{item.title}&apos; 문서를 새 파일로 교체할까요?
        </span>
      }
      onCancel={onClose}
      maskClosable={!isSaving}
      closable={false}
      footer={
        <span className="flex justify-end gap-xs">
          <Button disabled={isSaving} onClick={onClose}>
            취소
          </Button>
          <Button type="primary" loading={isSaving} onClick={() => void replace()}>
            교체
          </Button>
        </span>
      }
    >
      <div className="flex flex-col gap-sm">
        <p className="m-0 text-body text-(--ant-color-text-secondary)">
          제목, 종류, 사업, 시행일은 그대로 두고 파일만 바꿔요. 물어보기는 새 파일을 다시 읽는 동안 이전 내용으로 답해요.
        </p>
        <Upload.Dragger accept=".pdf,application/pdf" showUploadList={false} beforeUpload={pickFile} disabled={isSaving}>
          <div className="flex flex-col items-center gap-xxs p-sm">
            {file ? (
              <>
                <span className="text-body font-medium">{file.name}</span>
                <span className="text-caption text-(--ant-color-text-tertiary)">
                  {formatFileSize(file.size)} · 다른 파일 고르기
                </span>
              </>
            ) : (
              <>
                <InboxOutlined className="text-2xl text-(--ant-color-primary)" />
                <span className="text-body">{isMobile ? '눌러서 PDF 파일을 고르세요' : 'PDF 파일을 끌어 놓거나 눌러서 고르세요'}</span>
              </>
            )}
          </div>
        </Upload.Dragger>
        {fileError && <span className="text-caption text-(--ant-color-error)">{fileError}</span>}
        <span className="text-body">
          <span className="mr-xs font-medium">버전</span>
          v{item.contentRevision} → v{item.contentRevision + 1}
          {item.effectiveDate && ` · 시행일 ${item.effectiveDate.replaceAll('-', '.')}`}
        </span>
        <span className="text-caption text-(--ant-color-text-tertiary)">이전 파일은 버전으로 보관돼요.</span>
      </div>
    </Modal>
  )
}
