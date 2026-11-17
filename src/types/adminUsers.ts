import type { AuthUser } from './auth'
import type { UserRole } from './user'

export type UserStatus = 'PENDING' | 'ACTIVE' | 'INACTIVE'

export type UserRoleInfo = AuthUser['roles'][number]

export type ManagedUser = {
  id: string
  email: string
  name: string
  status: UserStatus
  version: number
  orgUnit: AuthUser['orgUnit']
  areas: AuthUser['areas']
  roles: UserRoleInfo[]
  createdAt: string
  updatedAt: string
}

export type UserRoleRequest = {
  role: UserRole
  scopeType: 'ALL' | 'ORG_UNIT'
  leaderType: 'ORG_UNIT' | 'AREA' | null
  viewerTargetRole: Exclude<UserRole, 'VIEWER'> | null
  areaId: string | null
}

export type UserSettingsRequest = {
  version: number
  orgUnitId: string | null
  areaIds: string[]
  roles: UserRoleRequest[]
}
