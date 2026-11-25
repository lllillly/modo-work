import type { AuthUser } from '../types/auth'

export function isAdmin(user: AuthUser | null | undefined) {
  return !!user?.roles.some((role) => role.role === 'ADMIN')
}
