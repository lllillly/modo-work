export type LoginStatus =
  | 'login'
  | 'test'
  | 'nameRequired'
  | 'credentialsError'
  | 'pending'
  | 'invalid'
  | 'inactive'
  | 'error'
  | 'expired'

export const loginEmails = {
  existing: 'user1@example.com',
  newUser: 'newuser@example.com',
  invalid: 'user@gmail.com',
}

export const demoAccounts = [
  { label: '담당자', email: 'user01@example.com' },
  { label: '리더', email: 'lead01@example.com' },
  { label: '관리자', email: 'admin01@example.com' },
] as const

export const loginPreviewStates = [
  { value: 'login', label: 'Google 로그인' },
  { value: 'test', label: '시험 로그인' },
  { value: 'nameRequired', label: '이름 누락' },
  { value: 'credentialsError', label: '로그인 오류' },
  { value: 'pending', label: '승인 대기' },
  { value: 'invalid', label: '회사 계정 X' },
  { value: 'inactive', label: '사용 중지' },
  { value: 'error', label: '일시 오류' },
  { value: 'expired', label: '세션 만료' },
] as const
