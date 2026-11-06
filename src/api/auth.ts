import type { AuthErrorResponse, AuthResponse, TestLoginRequest } from '../types/auth'

const AUTH_TIMEOUT_MS = 30_000

export class AuthApiError extends Error {
  status: number
  code: string
  fieldErrors: AuthErrorResponse['fieldErrors']

  constructor(status: number, error: AuthErrorResponse) {
    super(error.message)
    this.name = 'AuthApiError'
    this.status = status
    this.code = error.code
    this.fieldErrors = error.fieldErrors
  }
}

async function requestAuth(path: string, options?: RequestInit) {
  const timeoutSignal = AbortSignal.timeout(AUTH_TIMEOUT_MS)
  const signal = options?.signal
    ? AbortSignal.any([options.signal, timeoutSignal])
    : timeoutSignal

  const response = await fetch(`/api/auth${path}`, {
    ...options,
    credentials: 'include',
    cache: 'no-store',
    signal,
  })

  if (!response.ok) {
    const error: AuthErrorResponse | null = await response.json().catch(() => null)

    throw new AuthApiError(response.status, {
      code: error?.code ?? `HTTP_${response.status}`,
      message: error?.message ?? '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.',
      fieldErrors: Array.isArray(error?.fieldErrors) ? error.fieldErrors : [],
    })
  }

  return response
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
