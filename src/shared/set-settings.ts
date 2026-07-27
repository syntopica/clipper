import { MACHINE_NAME_KEY } from './machine-name-key'
import { SettingsSchema, type Settings } from './settings-schema'
import { SyncSettingsSchema } from './sync-settings-schema'

export async function setSettings(settings: Settings): Promise<void> {
  const { machineName, ...synced } = SettingsSchema.parse(settings)
  await Promise.all([
    chrome.storage.sync.set(SyncSettingsSchema.parse(synced)),
    // Earlier builds synced the machine name. Drop that copy so it stops being
    // pushed to every other device.
    chrome.storage.sync.remove(MACHINE_NAME_KEY),
    chrome.storage.local.set({ [MACHINE_NAME_KEY]: machineName }),
  ])
}
