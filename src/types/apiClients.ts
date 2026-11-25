export type ApiClient = {
  id: string
  name: string
  scope: 'COURSE_SUMMARY_READ'
  businesses: string[]
  issuedAt: string
  revokedAt: string | null
}

export type IssuedApiClient = Omit<ApiClient, 'revokedAt'> & { token: string }
