import type { SettingsImportApplied, SettingsImportPreview, SettingsKind } from '../types/settingsTransfer'
import { requestApi } from './client'

export async function exportSettings(kind: SettingsKind) {
  const response = await requestApi(`/admin/export?kind=${kind}`)
  return response.blob()
}

async function importSettings<T>(kind: SettingsKind, file: File, dryRun: boolean) {
  const body = new FormData()
  body.append('file', file)
  const response = await requestApi(`/admin/import?kind=${kind}&dryRun=${dryRun}`, { method: 'POST', body })
  return response.json() as Promise<T>
}

export const previewSettingsImport = (kind: SettingsKind, file: File) =>
  importSettings<SettingsImportPreview>(kind, file, true)

export const applySettingsImport = (kind: SettingsKind, file: File) =>
  importSettings<SettingsImportApplied>(kind, file, false)
