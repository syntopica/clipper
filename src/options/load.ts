import { defaultMachineName } from '../shared/default-machine-name'
import { getCaptureToken } from '../shared/get-capture-token'
import { getSettings } from '../shared/get-settings'
import { field } from './field'
import { renderAuth } from './render-auth'

export async function load(): Promise<void> {
  const settings = await getSettings()
  field('owner').value = settings?.owner ?? 'CristianDeluxe'
  field('repo').value = settings?.repo ?? 'brain-clips'
  field('branch').value = settings?.branch ?? 'main'
  field('machineName').value = settings?.machineName ?? (await defaultMachineName())
  field('captureToken').value = (await getCaptureToken()) ?? ''
  await renderAuth()
}
