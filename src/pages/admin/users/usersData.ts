import type { ManagedUser, UserRoleRequest, UserSettingsRequest } from '../../../types/adminUsers'
import type { OptionItem } from '../../../types/courseApi'
import type { UserRole } from '../../../types/user'

export type ViewerTarget = Exclude<UserRole, 'VIEWER'>
export type ViewerScope = 'ALL' | 'ORG_UNIT'

export type UserDraft = {
  orgUnitId?: string
  areaIds: string[]
  admin: boolean
  leader: boolean
  orgLeader: boolean
  areaLeaderIds: string[]
  assignee: boolean
  viewer: boolean
  viewers: { target: ViewerTarget; scope: ViewerScope }[]
}

export const MAX_ROLES = 20

export const viewerTargetOptions: { value: ViewerTarget; label: string }[] = [
  { value: 'ADMIN', label: '관리자 화면' },
  { value: 'LEADER', label: '리더 화면' },
  { value: 'ASSIGNEE', label: '담당자 화면' },
]

export function formatDateTime(value: string) {
  const date = new Date(value)
  const pad = (number: number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function getRoleLabels(user: ManagedUser) {
  return user.roles.map((role) => {
    const key = [role.role, role.scopeType, role.orgUnit?.id, role.leaderType, role.area?.id, role.viewerTargetRole].join(':')
    if (role.role === 'ADMIN') return { key, label: '관리자', color: 'gold' }
    if (role.role === 'LEADER' && role.leaderType === 'AREA') {
      return { key, label: `영역 리더 · ${role.area?.name ?? '-'}`, color: 'blue' }
    }
    if (role.role === 'LEADER') return { key, label: `조직 단위 리더 · ${role.orgUnit?.name ?? '-'}`, color: 'blue' }
    if (role.role === 'VIEWER') {
      return { key, label: `열람 전용 · ${role.scopeType === 'ALL' ? '전체' : (role.orgUnit?.name ?? '-')}`, color: 'default' }
    }
    return { key, label: '담당자', color: 'default' }
  })
}

export function withCurrentOptions(options: OptionItem[], current: OptionItem[]) {
  const missing = current.filter((item) => !options.some((option) => option.id === item.id))
  return [
    ...options.map((option) => ({ value: option.id, label: option.name })),
    ...missing.map((item) => ({ value: item.id, label: `${item.name} (기존 설정)` })),
  ]
}

export function getSameNameUsers(user: ManagedUser, activeUsers: ManagedUser[]) {
  return activeUsers.filter((item) => item.id !== user.id && item.name === user.name)
}

export function toDraft(user: ManagedUser): UserDraft {
  const orgLeader = user.roles.some((role) => role.role === 'LEADER' && role.leaderType === 'ORG_UNIT')
  const areaLeaderIds = user.roles.flatMap((role) =>
    role.role === 'LEADER' && role.leaderType === 'AREA' && role.area ? [role.area.id] : [],
  )

  return {
    orgUnitId: user.orgUnit?.id,
    areaIds: user.areas.map((area) => area.id),
    admin: user.roles.some((role) => role.role === 'ADMIN'),
    leader: orgLeader || areaLeaderIds.length > 0,
    orgLeader,
    areaLeaderIds,
    assignee: user.roles.some((role) => role.role === 'ASSIGNEE'),
    viewer: user.roles.some((role) => role.role === 'VIEWER'),
    viewers: user.roles.flatMap((role) =>
      role.role === 'VIEWER' && role.viewerTargetRole ? [{ target: role.viewerTargetRole, scope: role.scopeType }] : [],
    ),
  }
}

export function getDefaultViewerScope(target: ViewerTarget): ViewerScope {
  return target === 'ASSIGNEE' ? 'ORG_UNIT' : 'ALL'
}

export function toRoleRequests(draft: UserDraft) {
  const base = { leaderType: null, viewerTargetRole: null, areaId: null }
  const roles: UserRoleRequest[] = []

  if (draft.admin) roles.push({ ...base, role: 'ADMIN', scopeType: 'ALL' })
  if (draft.leader && draft.orgLeader) {
    roles.push({ ...base, role: 'LEADER', scopeType: 'ORG_UNIT', leaderType: 'ORG_UNIT' })
  }
  if (draft.leader) {
    draft.areaLeaderIds.forEach((areaId) =>
      roles.push({ ...base, role: 'LEADER', scopeType: 'ORG_UNIT', leaderType: 'AREA', areaId }),
    )
  }
  if (draft.assignee) roles.push({ ...base, role: 'ASSIGNEE', scopeType: 'ORG_UNIT' })
  if (draft.viewer) {
    draft.viewers.forEach((viewer) =>
      roles.push({ ...base, role: 'VIEWER', scopeType: viewer.scope, viewerTargetRole: viewer.target }),
    )
  }
  return roles
}

export function needsOrgUnit(draft: UserDraft) {
  return toRoleRequests(draft).some((role) => role.scopeType === 'ORG_UNIT')
}

export function needsWorkArea(draft: UserDraft) {
  return draft.assignee || (draft.viewer && draft.viewers.some((viewer) => viewer.target === 'ASSIGNEE'))
}

export function validateDraft(draft: UserDraft) {
  const roles = toRoleRequests(draft)
  const needsOrg = needsOrgUnit(draft)
  const needsArea = needsWorkArea(draft)

  if (roles.length === 0) return '역할을 하나 이상 골라 주세요.'
  if (roles.length > MAX_ROLES) return `역할은 ${MAX_ROLES}개까지 지정할 수 있어요.`
  if (new Set(roles.map((role) => JSON.stringify(role))).size !== roles.length) return '같은 역할을 두 번 지정할 수 없어요.'
  if (draft.leader && !draft.orgLeader && draft.areaLeaderIds.length === 0) return '리더 범위를 골라 주세요.'
  if (draft.viewer && draft.viewers.length === 0) return '열람 전용이 볼 수 있는 화면을 골라 주세요.'
  if (needsOrg && !draft.orgUnitId) return '조직 단위를 골라 주세요.'
  if (draft.areaIds.length > 1) return '영역은 한 개만 지정할 수 있어요. 한 개로 정리해 주세요.'
  if (needsArea && draft.areaIds.length !== 1) return '담당자와 담당자 화면 열람 전용은 담당/열람 영역을 한 개 골라 주세요.'
  return null
}

export function toSettingsRequest(user: ManagedUser, draft: UserDraft): UserSettingsRequest {
  return { version: user.version, orgUnitId: draft.orgUnitId ?? null, areaIds: draft.areaIds, roles: toRoleRequests(draft) }
}
