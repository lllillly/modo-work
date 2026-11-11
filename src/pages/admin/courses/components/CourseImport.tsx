import { useState } from 'react'
import { InboxOutlined, UploadOutlined, WarningOutlined } from '@ant-design/icons'
import { Alert, App, Button, Card, Steps, Table, Tag, Upload } from 'antd'
import type { TableColumnsType, UploadProps } from 'antd'
import { useSearchParams } from 'react-router'

import type { CourseImportRow } from '../../../../types/adminCourses'
import { courseImportRules, getCourseImportPreviewMock } from '../courseManagementMockData'

type CourseImportProps = {
  business: string
  isMobile: boolean
}

export default function CourseImport({ business, isMobile }: CourseImportProps) {
  const { message } = App.useApp()
  const [params] = useSearchParams()
  const [file, setFile] = useState<File | null>(null)

  const previewType = params.get('preview')
  const preview = file || previewType === 'success' || previewType === 'error'
    ? getCourseImportPreviewMock(previewType === 'error', business)
    : null

  const uploadProps: UploadProps = {
    accept: '.csv,text/csv',
    maxCount: 1,
    multiple: false,
    showUploadList: false,
    fileList: [],
    beforeUpload: (selectedFile) => {
      if (!selectedFile.name.toLowerCase().endsWith('.csv')) {
        message.error('CSV 파일을 선택해 주세요.')
        return Upload.LIST_IGNORE
      }
      setFile(selectedFile)
      return false
    },
  }

  const columns: TableColumnsType<CourseImportRow> = [
    { title: '행', dataIndex: 'line', width: 48 },
    {
      title: '결과',
      dataIndex: 'action',
      width: 64,
      render: (action: CourseImportRow['action']) => (
        <Tag
          variant="outlined"
          color={action === '오류' ? 'error' : action === '신규' ? 'processing' : 'success'}
          className="m-0 text-caption"
        >
          {action}
        </Tag>
      ),
    },
    { title: '외부 키', dataIndex: 'externalKey', width: 112 },
    { title: '과정명', dataIndex: 'name', width: 180 },
    { title: '조직 단위', dataIndex: 'orgUnitName', width: 96 },
    {
      title: '기간',
      key: 'period',
      width: 184,
      render: (_, row) => `${row.startDate.replaceAll('-', '.')} ~ ${row.endDate.replaceAll('-', '.')}`,
    },
    { title: '구분', dataIndex: 'lengthLabel', width: 56 },
    { title: '정원', dataIndex: 'capacity', width: 52 },
    {
      title: '확인할 내용',
      key: 'message',
      width: 270,
      render: (_, row) => (
        <span
          className={`[overflow-wrap:anywhere] ${row.severity === 'error' ? 'text-(--ant-color-error)' : row.severity === 'warning' ? 'text-(--ant-color-warning)' : 'text-(--ant-color-text-tertiary)'}`}
        >
          {row.severity === 'warning' && <WarningOutlined />} {row.message}
        </span>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-md">
      <div>
        <h2 className="m-0 text-section-title">과정 가져오기</h2>
        <p className="mt-xxs mb-0 text-caption text-(--ant-color-text-secondary)">
          CSV 파일로 과정을 한 번에 등록하거나 갱신해요. 오류가 하나라도 있으면 아무것도 등록하지 않아요.
        </p>
      </div>
      <Steps
        current={preview ? 1 : 0}
        size="small"
        className="max-w-[450px]"
        items={[{ title: '파일 선택' }, { title: '미리보기 확인' }, { title: '등록' }]}
      />
      {!preview ? (
        <>
          <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-md min-[992px]:p-lg' }}>
            <Upload.Dragger {...uploadProps} className="block">
              <div className="flex min-h-[140px] flex-col items-center justify-center gap-xs p-md">
                <InboxOutlined className="text-[32px] text-(--ant-color-primary)" />
                <p className="m-0 text-card-title font-medium">CSV 파일을 여기로 끌어 놓거나 눌러서 고르세요</p>
                <p className="m-0 text-caption text-(--ant-color-text-tertiary)">한 번에 파일 1개 · UTF-8 CSV</p>
              </div>
            </Upload.Dragger>
            <Button
              type="link"
              onClick={() => message.info('양식 내려받기는 API 연동 후 사용할 수 있어요.')}
              className="mt-sm h-auto p-0 text-body"
            >
              양식 내려받기 (courses_template.csv)
            </Button>
          </Card>
          <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-md min-[992px]:p-lg' }}>
            <h3 className="mt-0 mb-xs text-card-title font-medium">가져오기 규칙</h3>
            <ul className="m-0 flex list-disc flex-col gap-xs pl-md text-caption text-(--ant-color-text-secondary)">
              {courseImportRules.map((rule) => (
                <li key={rule}>{rule}</li>
              ))}
            </ul>
          </Card>
        </>
      ) : (
        <>
          <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-md min-[992px]:p-lg' }}>
            <div className="mb-sm flex flex-wrap items-center gap-xs">
              {file && <span className="break-all text-body font-medium">{file.name}</span>}
              <Tag className="m-0">샘플 미리보기</Tag>
              <span className="text-caption text-(--ant-color-text-secondary)">· 총 {preview.rows.length}행</span>
              <Tag color="processing" className="m-0">
                신규 {preview.createdCount}
              </Tag>
              <Tag color="success" className="m-0">
                갱신 {preview.updatedCount}
              </Tag>
              {preview.warningCount > 0 && (
                <Tag color="warning" className="m-0">
                  경고 {preview.warningCount}
                </Tag>
              )}
              {preview.errorCount > 0 && (
                <Tag color="error" className="m-0">
                  오류 {preview.errorCount}
                </Tag>
              )}
            </div>
            <Alert
              type={preview.canImport ? 'success' : 'error'}
              showIcon
              title={
                preview.canImport
                  ? `모두 등록할 수 있어요. 경고 ${preview.warningCount}건은 담당자 없이 등록되고, 갱신되는 과정은 할 일과 마감을 다시 계산해요.`
                  : '오류가 있는 행이 있어 등록할 수 없어요. 파일을 고친 뒤 다시 올려 주세요.'
              }
            />
            <p className="mt-xs mb-0 text-caption text-(--ant-color-text-tertiary)">
              화면 확인용 샘플입니다. 파일 검사와 등록은 API 연동 후 적용합니다.
            </p>
          </Card>
          <Card variant="borderless" className="shadow-none" classNames={{ body: 'p-md min-[992px]:p-lg' }}>
            <Table
              rowKey="line"
              dataSource={preview.rows}
              columns={columns}
              size="small"
              pagination={false}
              rowHoverable={false}
              scroll={{ x: 1000 }}
              rowClassName={(row) =>
                row.severity === 'error'
                  ? '[&>td]:bg-(--ant-color-error-bg)'
                  : row.severity === 'warning'
                    ? '[&>td]:bg-(--ant-color-warning-bg)'
                    : ''
              }
              classNames={{ header: { cell: 'text-caption font-medium' }, body: { cell: 'px-sm py-xs text-caption' } }}
            />
          </Card>
          <div className={`flex gap-xs ${isMobile ? '[&>button]:flex-1' : 'justify-end'}`}>
            <Upload {...uploadProps} className={isMobile ? 'flex-1 [&_.ant-btn]:w-full' : ''}>
              <Button icon={<UploadOutlined aria-hidden />}>다른 파일 올리기</Button>
            </Upload>
            <Button
              type="primary"
              disabled={!preview.canImport}
              onClick={() => message.info('과정 등록은 API 연동 후 사용할 수 있어요.')}
            >
              {preview.canImport ? `${preview.rows.length}건 등록` : '등록'}
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
