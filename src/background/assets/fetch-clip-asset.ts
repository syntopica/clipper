import { LIMITS } from '../../shared/limits'
import type { AssetResult } from './asset-result'
import { DEFAULT_IMAGE_PROCESSORS } from './default-image-processors'
import { fetchVettedAsset } from './fetch-vetted-asset'
import { hasHostPermission } from './has-host-permission'
import type { ImageProcessors } from './image-processors'
import { prepareImageAsset } from './prepare-image-asset'
import type { PreparedImage } from './prepared-image'
import { vetAssetUrl } from './vet-asset-url'

// One page-proposed image, end to end: the URL policy, the host permission for
// its origin, the vetted fetch under one deadline for every hop and the body,
// then the format table. Never throws - anything
// unexpected becomes a reason, because one image must not fail the clip.
export async function fetchClipAsset(
  url: string,
  fetchImpl: typeof fetch = fetch,
  hasPermission: (origin: string) => Promise<boolean> = hasHostPermission,
  processors: ImageProcessors = DEFAULT_IMAGE_PROCESSORS,
): Promise<AssetResult<PreparedImage>> {
  try {
    const vetted = vetAssetUrl(url)
    if (!vetted.ok) return vetted
    if (!(await hasPermission(vetted.value.origin))) {
      return { ok: false, reason: `no host permission for ${vetted.value.origin}` }
    }
    const deadline = AbortSignal.timeout(LIMITS.IMAGE_FETCH_TIMEOUT_MS)
    const fetched = await fetchVettedAsset(url, (input, init) => fetchImpl(input, { ...init, signal: deadline }))
    if (!fetched.ok) return fetched
    return await prepareImageAsset(fetched.value, processors)
  } catch (error) {
    return { ok: false, reason: error instanceof Error ? error.message : String(error) }
  }
}
