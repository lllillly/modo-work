import type { AuthResponse, TestLoginRequest } from '../types/auth'
import { requestApi } from './client'

export { ApiError as AuthApiError } from './client'

function requestAuth(path: string, options?: RequestInit) {
  return requestApi(`/auth${path}`, options)
}

export async function testLogin(data: TestLoginRequest) {
  const response = await requestAuth('/test-login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: data.email.trim().toLowerCase(),
      password: data.password,
      name: data.name?.trim() || undefined,
    }),
  })
  const result: AuthResponse = await response.json()
  return result.user
}

export async function getCurrentUser(signal?: AbortSignal) {
  const response = await requestAuth('/me', { signal })
  const result: AuthResponse = await response.json()
  return result.user
}

export async function logout() {
  await requestAuth('/logout', { method: 'POST' })
}
