import { CAPTURE_TOKEN_KEY } from './capture-token-key'

// An empty token clears the key rather than storing an empty string, so
// `getCaptureToken` has one shape of "no token" to answer for.
export async function setCaptureToken(token: string): Promise<void> {
  if (token === '') return chrome.storage.local.remove([CAPTURE_TOKEN_KEY])
  await chrome.storage.local.set({ [CAPTURE_TOKEN_KEY]: token })
}
