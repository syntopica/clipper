import { clearToken } from '../shared/clear-token'
import { field } from './field'
import { say } from './say'

export async function removeToken(): Promise<void> {
  await clearToken()
  field('token').value = ''
  say('Token removed from this device. It is still valid on GitHub until revoked there.')
}
