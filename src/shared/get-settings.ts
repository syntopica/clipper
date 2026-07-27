import { MACHINE_NAME_KEY } from './machine-name-key'
import { SettingsSchema, type Settings } from './settings-schema'
import { SyncSettingsSchema } from './sync-settings-schema'

export async function getSettings(): Promise<Settings | null> {
  const [synced, local] = await Promise.all([
    chrome.storage.sync.get(Object.keys(SyncSettingsSchema.shape)),
    chrome.storage.local.get([MACHINE_NAME_KEY]),
  ])
  const parsed = SettingsSchema.safeParse({ ...synced, machineName: local[MACHINE_NAME_KEY] })
  return parsed.success ? parsed.data : null
}
