import { CREDENTIAL_KEY } from './credential-key'
import { CredentialSchema, type Credential } from './credential-schema'

export async function setCredential(credential: Credential): Promise<void> {
  await chrome.storage.local.set({ [CREDENTIAL_KEY]: CredentialSchema.parse(credential) })
}
