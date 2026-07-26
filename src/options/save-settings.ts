import { setSettings } from '../shared/set-settings'
import { setToken } from '../shared/set-token'
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

  const token = field('token').value.trim()
  if (token && token !== '********') await setToken(token)
  say('Saved.')
}
