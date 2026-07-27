import { getCredential } from './get-credential'
import { refreshCredential } from './refresh-credential'
import { setCredential } from './set-credential'

// Renew slightly early so a token cannot expire between this check and the last
// GitHub call of a multi-request commit.
const RENEW_BEFORE_MS = 120_000

export async function getAccessToken(): Promise<string | null> {
  const credential = await getCredential()
  if (!credential) return null
  if (credential.expiresAt === null || Date.now() < credential.expiresAt - RENEW_BEFORE_MS) {
    return credential.accessToken
  }

  const refreshed = await refreshCredential(credential)
  await setCredential(refreshed)
  return refreshed.accessToken
}
