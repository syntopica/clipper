import type { ClipStatus } from '../shared/clip-status'
import { clipStatusCacheKey } from './clip-status-cache-key'

export async function writeCachedStatus(url: string, status: ClipStatus): Promise<void> {
  await chrome.storage.session.set({ [clipStatusCacheKey(url)]: status })
}
