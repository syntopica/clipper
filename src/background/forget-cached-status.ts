import { clipStatusCacheKey } from './clip-status-cache-key'

// Called after this extension commits a clip for the URL: the cached answer is
// known wrong at that moment, and the next paint must ask again rather than
// keep saying the page is unclipped.
export async function forgetCachedStatus(url: string): Promise<void> {
  await chrome.storage.session.remove([clipStatusCacheKey(url)])
}
