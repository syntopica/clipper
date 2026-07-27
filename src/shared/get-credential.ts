import { CREDENTIAL_KEY } from './credential-key'
import { CredentialSchema, type Credential } from './credential-schema'

export async function getCredential(): Promise<Credential | null> {
  const stored = await chrome.storage.local.get([CREDENTIAL_KEY])
  const parsed = CredentialSchema.safeParse(stored[CREDENTIAL_KEY])
  return parsed.success ? parsed.data : null
}
