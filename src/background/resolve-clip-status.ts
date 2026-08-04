import type { ClipStatus } from '../shared/clip-status'
import { fetchClipStatus } from '../shared/fetch-clip-status'
import { readCachedStatus } from './read-cached-status'
import { writeCachedStatus } from './write-cached-status'

// An `absent` answer is not cached. It is the value every failure resolves to,
// so caching it would turn one unreachable moment into a grey icon for the rest
// of the session - and `absent` is also the state most likely to change, since
// clipping the page is what changes it.
export async function resolveClipStatus(url: string): Promise<ClipStatus> {
  const cached = await readCachedStatus(url)
  if (cached !== null) return cached
  const status = await fetchClipStatus(url)
  if (status.state !== 'absent') await writeCachedStatus(url, status)
  return status
}
