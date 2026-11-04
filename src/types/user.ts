export type UserRole = 'ADMIN' | 'LEADER' | 'ASSIGNEE' | 'VIEWER'

export const userRoleLabels: Record<UserRole, string> = {
  ADMIN: '관리자',
  LEADER: '리더',
  ASSIGNEE: '담당자',
  VIEWER: '열람 전용',
}
