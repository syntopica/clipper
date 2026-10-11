import type { AssetResult } from './asset-result'
import { decodesAsImage } from './decodes-as-image'
import { fetchVettedAsset } from './fetch-vetted-asset'

// One page-proposed image, fetched under the policy and kept only if it
// decodes as an image.
export async function fetchImageAsset(
  candidate: string,
  fetchImpl: typeof fetch = fetch,
  decode?: (blob: Blob) => Promise<ImageBitmap>,
): Promise<AssetResult<Blob>> {
  const fetched = await fetchVettedAsset(candidate, fetchImpl)
  if (!fetched.ok) return fetched
  if (!(await decodesAsImage(fetched.value, decode))) {
    return { ok: false, reason: 'does not decode as an image' }
  }
  return fetched
}
