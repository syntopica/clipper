import { CREDENTIAL_KEY } from './credential-key'

export async function clearCredential(): Promise<void> {
  await chrome.storage.local.remove(CREDENTIAL_KEY)
}
