import { getCredential } from '../shared/get-credential'
import { element } from './element'

export async function renderAuth(): Promise<void> {
  const credential = await getCredential()
  const account = credential?.login ? `@${credential.login}` : 'an unnamed account'
  element('authState').textContent = credential
    ? `Signed in as ${account}. The token is stored on this device only.`
    : 'Not signed in. Clipping needs a GitHub authorization on this device.'
  ;(element('signIn') as HTMLButtonElement).hidden = credential !== null
  ;(element('signOut') as HTMLButtonElement).hidden = credential === null
}
