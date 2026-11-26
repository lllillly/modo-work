import { useCallback, useState } from 'react'
import { Card, Segmented, Select, Statistic, Table } from 'antd'

import { getQuestionStats } from '../../../../api/nlpAdmin'
import useApiQuery from '../../../../hooks/useApiQuery'
import type { QuestionStats } from '../../../../types/nlpAdmin'
import type { Option } from '../nlpAdminData'
import LoadingError from '../../../../components/common/LoadingError'
import EmptyData from '../../../../components/common/EmptyData'
import { smallTableStyle } from '../../../../components/common/tableStyle'
import { formatDateTime } from '../../../../utils/date'

const percent = (part: number, whole: number) => (whole === 0 ? '-' : `${Math.round((part / whole) * 100)}%`)

type QuestionStatsViewProps = { businesses: Option[]; isMobile: boolean }

export default function QuestionStatsView({ businesses, isMobile }: QuestionStatsViewProps) {
  const [days, setDays] = useState(30)
  const [businessId, setBusinessId] = useState('')
  const load = useCallback(
    (signal: AbortSignal) => getQuestionStats(days, businessId || undefined, signal),
    [days, businessId],
  )
  const query = useApiQuery(`question-stats:${days}:${businessId}`, load)
  const stats = query.data
  const counts = stats?.counts

  return (
    <Card variant="borderless" className="shadow-none" classNames={{ body: isMobile ? 'px-md py-sm' : 'p-lg' }}>
      <div className="mb-md flex flex-wrap items-center gap-sm">
        <Segmented
          value={days}
          onChange={(value) => setDays(value)}
          options={[
            { value: 7, label: '7일' },
            { value: 30, label: '30일' },
            { value: 90, label: '90일' },
          ]}
        />
        <Select
          aria-label="사업"
          value={businessId}
          onChange={setBusinessId}
          options={[{ value: '', label: '전체 사업' }, ...businesses]}
          className="min-w-40"
        />
        {stats && (
          <span className="text-caption text-(--ant-color-text-tertiary)">
            {formatDateTime(stats.from)} ~ {formatDateTime(stats.to)}
          </span>
        )}
      </div>
      {query.error ? (
        <LoadingError plain title="통계를 불러오지 못했어요" error={query.error} onRetry={query.reload} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-md min-[992px]:grid-cols-5">
            <Statistic title="질문" value={counts?.questions ?? '-'} loading={query.isLoading} />
            <Statistic
              title="바로 답함"
              value={counts ? percent(counts.answered, counts.questions) : '-'}
              loading={query.isLoading}
            />
            <Statistic
              title="후보 보여 줌"
              value={counts ? percent(counts.clarify, counts.questions) : '-'}
              loading={query.isLoading}
            />
            <Statistic
              title="답 없음"
              value={counts ? percent(counts.noAnswer, counts.questions) : '-'}
              loading={query.isLoading}
            />
            <Statistic
              title="후보 선택률"
              value={counts ? percent(counts.candidateSelected, counts.clarify) : '-'}
              loading={query.isLoading}
            />
          </div>
          {counts && (
            <p className="mt-xs mb-md text-caption text-(--ant-color-text-tertiary)">
              후보를 보여 준 {counts.clarify}건 중 후보를 고른 알림 {counts.candidateSelected}건, 해당 없음{' '}
              {counts.noneSelected}건이에요. 후보 선택률은 질문 단위가 아니라 후보를 고른 알림 건수로 계산한
              근사값이에요. 개인정보 경고로 막힌 질문은 {counts.piiWarning}건이에요.
            </p>
          )}
          <div className="grid gap-lg min-[992px]:grid-cols-2">
            <div>
              <h3 className="mt-0 mb-xs text-card-title font-medium">자주 묻는 의도</h3>
              <p className="mt-0 mb-xs text-caption text-(--ant-color-text-tertiary)">
                Q&A·화면으로 바로 답한 질문만 세요. 문서 구절로 답한 질문은 의도가 없어 빠져요.
              </p>
              <Table<QuestionStats['topIntents'][number]>
                rowKey="intentKey"
                dataSource={stats?.topIntents}
                loading={query.isLoading}
                pagination={false}
                size="small"
                classNames={smallTableStyle}
                locale={{ emptyText: <EmptyData plain compact title="Q&A나 화면 안내로 바로 답한 질문이 없어요" /> }}
                columns={[
                  { title: '의도', key: 'intent', render: (_, row) => row.name ?? `${row.intentKey}(삭제됨)` },
                  { title: '건수', dataIndex: 'count', className: 'whitespace-nowrap' },
                ]}
              />
            </div>
            <div>
              <h3 className="mt-0 mb-xs text-card-title font-medium">답 없음이 많은 질문</h3>
              <Table<QuestionStats['topNoAnswer'][number]>
                rowKey="maskedQuery"
                dataSource={stats?.topNoAnswer}
                loading={query.isLoading}
                pagination={false}
                size="small"
                classNames={smallTableStyle}
                locale={{ emptyText: <EmptyData plain compact title="답 없음 질문이 없어요" /> }}
                columns={[
                  {
                    title: '질문',
                    dataIndex: 'maskedQuery',
                    render: (text: string) => <span className="break-all">{text}</span>,
                  },
                  { title: '건수', dataIndex: 'count', className: 'whitespace-nowrap' },
                  {
                    title: '마지막',
                    dataIndex: 'lastAskedAt',
                    className: 'whitespace-nowrap',
                    render: (value: string) => formatDateTime(value),
                  },
                ]}
              />
            </div>
          </div>
        </>
      )}
    </Card>
  )
}
