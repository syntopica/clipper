import { getSettings } from '../shared/get-settings'
import { getToken } from '../shared/get-token'
import { field } from './field'

export async function load(): Promise<void> {
  const settings = await getSettings()
  field('owner').value = settings?.owner ?? 'BusiRocket'
  field('repo').value = settings?.repo ?? 'brain-clips'
  field('branch').value = settings?.branch ?? 'main'
  field('machineName').value = settings?.machineName ?? ''
  field('token').value = (await getToken()) ? '********' : ''
}
