import { handleDocumentSearch, handleGet } from './handlers'
import { toAuthUser, userByEmail, userById } from './model'

const USER_KEY = 'modo-demo-user'
const READ_ONLY_MESSAGE = '데모에서는 저장되지 않아요. 화면을 둘러보는 것만 할 수 있어요.'
const ASK_MESSAGE = '물어보기는 NLP 서버가 있어야 동작해서 데모에서는 쓸 수 없어요. README의 시연 영상에서 확인해 주세요.'

function readUserId() {
  try {
    return sessionStorage.getItem(USER_KEY)
  } catch {
    return null
  }
}

function writeUserId(id: string | null) {
  try {
    if (id) sessionStorage.setItem(USER_KEY, id)
    else sessionStorage.removeItem(USER_KEY)
  } catch {
    return
  }
}

function json(status: number, body: unknown) {
  if (status === 204) return new Response(null, { status })
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function error(status: number, code: string, message: string) {
  return json(status, { code, message, fieldErrors: [] })
}

function readBody(body: RequestInit['body']): Record<string, unknown> {
  if (typeof body !== 'string') return {}
  try {
    return JSON.parse(body)
  } catch {
    return {}
  }
}

export async function demoFetch(path: string, options?: RequestInit) {
  const method = (options?.method ?? 'GET').toUpperCase()
  await new Promise((resolve) => setTimeout(resolve, 120))

  if (method === 'POST' && path === '/auth/test-login') {
    const email = String(readBody(options?.body).email ?? '').trim().toLowerCase()
    const user = userByEmail.get(email)
    if (!user) return error(401, 'INVALID_CREDENTIALS', '데모에서는 담당자, 리더, 관리자 계정만 쓸 수 있어요.')
    writeUserId(user.id)
    return json(200, { user: toAuthUser(user) })
  }

  if (method === 'POST' && path === '/auth/logout') {
    writeUserId(null)
    return json(204, null)
  }

  const userId = readUserId()
  const viewer = userId ? userById.get(userId) : undefined
  if (!viewer) return error(401, 'UNAUTHENTICATED', '로그인이 필요해요.')

  if (method === 'POST' && path === '/documents/search') {
    const result = handleDocumentSearch(readBody(options?.body))
    return json(result.status, result.body)
  }
  if (method === 'POST' && path === '/questions') return error(403, 'DEMO_ASK_UNAVAILABLE', ASK_MESSAGE)
  if (method !== 'GET') return error(403, 'DEMO_READ_ONLY', READ_ONLY_MESSAGE)
  if (path.startsWith('/admin/export')) return error(403, 'DEMO_READ_ONLY', READ_ONLY_MESSAGE)

  const result = handleGet(viewer, path)
  return json(result.status, result.body)
}
