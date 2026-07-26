import { SettingsSchema, type Settings } from './settings-schema'

export async function setSettings(settings: Settings): Promise<void> {
  await chrome.storage.sync.set(SettingsSchema.parse(settings))
}
