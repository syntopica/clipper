import type { ClipStatus } from '../shared/clip-status'
import { clipStatusCacheKey } from './clip-status-cache-key'

export async function readCachedStatus(url: string): Promise<ClipStatus | null> {
  const key = clipStatusCacheKey(url)
  const stored = await chrome.storage.session.get([key])
  return (stored[key] as ClipStatus | undefined) ?? null
}
