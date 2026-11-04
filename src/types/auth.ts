import type { UserRole } from './user'

export type TestLoginRequest = {
  email: string
  password: string
  name?: string
}

export type AuthUser = {
  id: string
  email: string
  name: string
  status: 'ACTIVE' | 'PENDING'
  orgUnit: { id: string; name: string } | null
  areas: { id: string; name: string }[]
  roles: {
    role: UserRole
    scopeType: 'ALL' | 'ORG_UNIT'
    leaderType: 'ORG_UNIT' | 'AREA' | null
    viewerTargetRole: Exclude<UserRole, 'VIEWER'> | null
    orgUnit: { id: string; name: string } | null
  }[]
}

export type AuthResponse = {
  user: AuthUser
}

export type AuthErrorResponse = {
  code: string
  message: string
  fieldErrors: {
    field: string
    message: string
  }[]
}
