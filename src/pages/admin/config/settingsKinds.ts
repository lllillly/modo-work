import type { SettingsKind } from '../../../types/settingsTransfer'

export const settingsKinds: { value: SettingsKind; label: string; description: string }[] = [
  { value: 'lists', label: '기준 목록', description: '사업, 업무 영역, 조직 단위' },
  { value: 'templates', label: '할 일 템플릿', description: '태그와 연결 문서는 이름으로 담겨요' },
  { value: 'settings', label: '설정값', description: '질문 기록 보관 기간' },
  { value: 'intents', label: '의도와 예시 질문', description: '물어보기 의도와 예시 질문, 답변 대상' },
  { value: 'qa', label: 'Q&A', description: '물어보기 질문과 답변, 출처 문서' },
]

export function getKindLabel(kind: SettingsKind) {
  return settingsKinds.find((item) => item.value === kind)?.label ?? kind
}
