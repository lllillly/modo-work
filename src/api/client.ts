import type { AuthErrorResponse } from '../types/auth'

const REQUEST_TIMEOUT_MS = 30_000

export class ApiError extends Error {
  status: number
  code: string
  fieldErrors: AuthErrorResponse['fieldErrors']

  constructor(status: number, error: AuthErrorResponse) {
    super(error.message)
    this.name = 'ApiError'
    this.status = status
    this.code = error.code
    this.fieldErrors = error.fieldErrors
  }
}

export async function requestApi(path: string, options?: RequestInit) {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS)
  const signal = options?.signal ? AbortSignal.any([options.signal, timeout]) : timeout
  const response = await fetch(`${import.meta.env.BASE_URL}api${path}`, {
    ...options,
    credentials: 'include',
    cache: 'no-store',
    signal,
  })

  if (!response.ok) {
    const error: AuthErrorResponse | null = await response.json().catch(() => null)

    throw new ApiError(response.status, {
      code: error?.code ?? `HTTP_${response.status}`,
      message: error?.message ?? '요청을 처리하지 못했어요. 잠시 후 다시 시도해 주세요.',
      fieldErrors: Array.isArray(error?.fieldErrors) ? error.fieldErrors : [],
    })
  }

  return response
}

export async function getApi<T>(path: string, signal?: AbortSignal): Promise<T> {
  const response = await requestApi(path, { signal })
  return response.json()
}

export async function sendApi<T>(path: string, method: string, data: unknown): Promise<T> {
  const response = await requestApi(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  return response.json()
}

export function getApiErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : '서버 응답을 확인하지 못했어요. 잠시 후 다시 시도해 주세요.'
}

export function isAuthStateError(error: unknown): error is ApiError {
  return (
    error instanceof ApiError &&
    ['UNAUTHENTICATED', 'ACCOUNT_INACTIVE', 'APPROVAL_REQUIRED'].includes(error.code)
  )
}
