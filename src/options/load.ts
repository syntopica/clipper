import { defaultMachineName } from '../shared/default-machine-name'
import { getCaptureToken } from '../shared/get-capture-token'
import { getSettings } from '../shared/get-settings'
import { field } from './field'
import { renderAuth } from './render-auth'

export async function load(): Promise<void> {
  const settings = await getSettings()
  // No owner or repository default: one person's inbox is not a sensible
  // starting value for anyone else's install.
  field('owner').value = settings?.owner ?? ''
  field('repo').value = settings?.repo ?? ''
  field('branch').value = settings?.branch ?? 'main'
  field('githubAppClientId').value = settings?.githubAppClientId ?? ''
  field('captureServiceOrigin').value = settings?.captureServiceOrigin ?? ''
  field('machineName').value = settings?.machineName ?? (await defaultMachineName())
  field('captureToken').value = (await getCaptureToken()) ?? ''
  await renderAuth()
}
