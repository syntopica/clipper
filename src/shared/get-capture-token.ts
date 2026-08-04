import { CAPTURE_TOKEN_KEY } from './capture-token-key'

// Absent is normal rather than an error: without a token the icon stays grey
// and every other part of the extension works exactly as it did.
export async function getCaptureToken(): Promise<string | null> {
  const stored = await chrome.storage.local.get([CAPTURE_TOKEN_KEY])
  const token = stored[CAPTURE_TOKEN_KEY]
  return typeof token === 'string' && token !== '' ? token : null
}
