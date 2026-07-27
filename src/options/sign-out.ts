import { clearCredential } from '../shared/clear-credential'
import { renderAuth } from './render-auth'
import { say } from './say'

export async function signOut(): Promise<void> {
  await clearCredential()
  await renderAuth()
  say('Signed out on this device. The authorization is still live on GitHub until revoked there.')
}
