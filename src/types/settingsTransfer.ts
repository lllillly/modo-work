export type SettingsKind = 'lists' | 'templates' | 'settings' | 'intents' | 'qa'

export type SettingsImportPreview = {
  schemaVersion: number
  kind: SettingsKind
  itemCount: number
}

export type SettingsImportApplied = {
  kind: SettingsKind
  itemCount: number
}
