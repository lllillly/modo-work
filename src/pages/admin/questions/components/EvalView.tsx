import { useState } from 'react'
import { UploadOutlined } from '@ant-design/icons'
import { Alert, Button, Card, InputNumber, Statistic, Switch, Table, Tag, Upload } from 'antd'

import { ApiError, getApiErrorMessage } from '../../../../api/client'
import { runEval } from '../../../../api/nlpAdmin'
import type { EvalResult, EvalRow } from '../../../../types/nlpAdmin'
import { isScored, simulate } from '../nlpAdminData'
import { smallTableStyle } from '../../../../components/common/tableStyle'

const SPEC_TOP3 = 0.8 // 명세 합격 기준: 상위 3개 포함률 0.8 이상
const MAX_BYTES = 200_000

const statusLabels: Record<EvalRow['status'], string> = {
  answered: '바로 답함',
  clarify: '후보 보여 줌',
  no_answer: '답 없음',
  pii_warning: '개인정보 경고',
}

export default function EvalView({ isMobile }: { isMobile: boolean }) {
  const [fileName, setFileName] = useState('')
  const [result, setResult] = useState<EvalResult | null>(null)
  const [error, setError] = useState('')
  const [isRunning, setIsRunning] = useState(false)
  const [answer, setAnswer] = useState<number | null>(null)
  const [clarify, setClarify] = useState<number | null>(null)
  const [missesOnly, setMissesOnly] = useState(false)

  async function pick(file: File) {
    setError('')
    if (file.size === 0 || file.size > MAX_BYTES) {
      setError('비어 있지 않은 200KB 이하 CSV만 올릴 수 있어요.')
      return false
    }
    let csv: string
    try {
      // file.text()는 깨진 글자를 조용히 바꿔 넣는다. 엑셀 기본 CSV(CP949)를 그대로 재면 포함률이 0%로 나와 원인을 모른다
      csv = new TextDecoder('utf-8', { fatal: true }).decode(await file.arrayBuffer())
    } catch {
      setError('UTF-8 CSV만 읽을 수 있어요. 엑셀에서는 "CSV UTF-8(쉼표로 분리)"로 저장해 주세요.')
      return false
    }
    setFileName(file.name)
    setIsRunning(true)
    try {
      const next = await runEval(csv)
      setResult(next)
      setAnswer(next.answer_threshold)
      setClarify(next.clarify_threshold)
    } catch (caught) {
      setResult(null)
      const detail = caught instanceof ApiError ? caught.fieldErrors.find((entry) => entry.field === 'csv')?.message : undefined
      setError(detail ? `${getApiErrorMessage(caught)} ${detail}` : getApiErrorMessage(caught))
    } finally {
      setIsRunning(false)
    }
    return false
  }

  const a = answer ?? result?.answer_threshold ?? 0
  const c = clarify ?? result?.clarify_threshold ?? 0
  const rows = (result?.rows ?? []).map((row, index) => ({ ...row, index, simulated: simulate(row, a, c) }))
  const counts = rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.simulated] = (acc[row.simulated] ?? 0) + 1
    return acc
  }, {})
  const rate = result && result.scored > 0 ? result.hits / result.scored : null
  const changed = result && (a !== result.answer_threshold || c !== result.clarify_threshold)

  return (
    <Card variant="borderless" className="shadow-none" classNames={{ body: isMobile ? 'px-md py-sm' : 'p-lg' }}>
      <div className="mb-md flex flex-wrap items-center gap-sm">
        <Upload accept=".csv,text/csv" showUploadList={false} beforeUpload={pick} disabled={isRunning}>
          <Button type="primary" icon={<UploadOutlined />} loading={isRunning}>
            평가 CSV 올리기
          </Button>
        </Upload>
        <span className="text-caption text-(--ant-color-text-tertiary)">
          {fileName || '열: question, intent · 200건까지 · 정답 의도가 없으면 "답 없음"'}
        </span>
      </div>
      {isRunning && <Alert type="info" showIcon title="평가 중이에요. 질문 수에 따라 1분까지 걸려요." className="mb-md" />}
      {error && <Alert type="error" showIcon title={error} className="mb-md" />}
      {result && (
        <>
          <div className="grid grid-cols-2 gap-md min-[992px]:grid-cols-4">
            <Statistic
              title={`상위 3개 포함률 (기준 ${SPEC_TOP3 * 100}%)`}
              value={rate === null ? '-' : `${(rate * 100).toFixed(1)}%`}
              styles={{ content: { color: rate !== null && rate < SPEC_TOP3 ? 'var(--ant-color-error)' : undefined } }}
            />
            <Statistic title="포함 / 대상" value={`${result.hits} / ${result.scored}`} />
            <Statistic title="바로 답함" value={counts.answered ?? 0} />
            <Statistic title="후보 / 답 없음" value={`${counts.clarify ?? 0} / ${counts.no_answer ?? 0}`} />
          </div>
          {result.unknown_intents.length > 0 && (
            <Alert
              type="warning"
              showIcon
              className="mt-md"
              title={`지식에 없는 정답 의도가 있어요: ${result.unknown_intents.join(', ')}`}
              description="키 오타이거나 숨긴 의도일 수 있어요. 이 문항은 항상 미포함으로 세요."
            />
          )}
          <div className="mt-md flex flex-wrap items-center gap-sm rounded-md bg-(--ant-color-fill-quaternary) px-sm py-xs text-caption">
            <span className="font-medium">기준값 미리 보기</span>
            <span>
              즉답{' '}
              <InputNumber size="small" min={0} max={1} step={0.01} value={answer} onChange={setAnswer} aria-label="즉답 기준" />
            </span>
            <span>
              되묻기{' '}
              <InputNumber size="small" min={0} max={1} step={0.01} value={clarify} onChange={setClarify} aria-label="되묻기 기준" />
            </span>
            {changed && (
              <Button
                size="small"
                type="link"
                onClick={() => {
                  setAnswer(result.answer_threshold)
                  setClarify(result.clarify_threshold)
                }}
              >
                현재 값으로
              </Button>
            )}
            <span className="text-(--ant-color-text-tertiary)">
              판정 개수만 다시 계산해요. 실제 기준값은 바뀌지 않아요(서버 설정 {result.answer_threshold} / {result.clarify_threshold}).
            </span>
          </div>
          <div className="mt-md mb-xs flex items-center gap-xs text-caption">
            <Switch size="small" checked={missesOnly} onChange={setMissesOnly} aria-label="미포함만 보기" />
            미포함만 보기
          </div>
          <Table
            rowKey="index"
            dataSource={missesOnly ? rows.filter((row) => isScored(row) && !row.hit) : rows}
            size="small"
            scroll={{ x: 720 }}
            pagination={{ pageSize: 50, showSizeChanger: false }}
            classNames={smallTableStyle}
            columns={[
              { title: '질문', dataIndex: 'masked_query', render: (text: string) => <span className="break-all">{text}</span> },
              { title: '정답 의도', dataIndex: 'expected' },
              {
                title: '상위 3개',
                key: 'top3',
                render: (_, row) =>
                  row.top3.map((key) => (
                    <Tag key={key} color={key === row.expected ? 'success' : undefined}>
                      {key}
                    </Tag>
                  )),
              },
              { title: '판정', key: 'simulated', className: 'whitespace-nowrap', render: (_, row) => statusLabels[row.simulated] },
              {
                title: '최고점',
                dataIndex: 'top_score',
                className: 'whitespace-nowrap',
                // 반올림하면 0.759968이 0.760으로 보여 즉답 기준 0.76과 판정이 어긋나 보인다. 표시만 내림한다
                render: (score: number | null) => (score === null ? '-' : (Math.floor(score * 1000) / 1000).toFixed(3)),
              },
            ]}
          />
        </>
      )}
    </Card>
  )
}
