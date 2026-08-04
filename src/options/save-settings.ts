import { setCaptureToken } from '../shared/set-capture-token'
import { setSettings } from '../shared/set-settings'
import { SettingsSchema } from '../shared/settings-schema'
import { field } from './field'
import { say } from './say'

export async function saveSettings(): Promise<void> {
  const parsed = SettingsSchema.safeParse({
    owner: field('owner').value.trim(),
    repo: field('repo').value.trim(),
    branch: field('branch').value.trim(),
    machineName: field('machineName').value.trim(),
  })
  if (!parsed.success) return say('All settings fields are required.')
  await setSettings(parsed.data)
  // An empty capture token is valid and means the toolbar icon stays grey: the
  // extension clips exactly as it did before the icon knew anything.
  await setCaptureToken(field('captureToken').value.trim())
  say('Saved.')
}
