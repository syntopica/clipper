import { SettingsSchema, type Settings } from './settings-schema'

export async function getSettings(): Promise<Settings | null> {
  const stored = await chrome.storage.sync.get(['owner', 'repo', 'branch', 'machineName'])
  const parsed = SettingsSchema.safeParse(stored)
  return parsed.success ? parsed.data : null
}
