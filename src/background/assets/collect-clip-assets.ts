import type { ClipAssets } from '../../shared/clip-assets'
import { LIMITS } from '../../shared/limits'
import { mapWithConcurrency } from '../../shared/map-with-concurrency'
import { sha256BytesHex } from '../../shared/sha256-bytes-hex'
import type { StoredAsset } from '../../shared/stored-asset'
import type { AssetResult } from './asset-result'
import { assetFileName } from './asset-file-name'
import { fetchClipAsset } from './fetch-clip-asset'
import type { PreparedImage } from './prepared-image'

// Every image a clip proposes, fetched four at a time and at most thirty, then
// deduplicated twice: by URL before fetching, by content hash after, so the
// same picture served from two URLs is one file that both point at. Files are
// numbered in page order, and stop being added once the clip's asset budget is
// spent. Each image that is not stored says why in `failures`.
export async function collectClipAssets(
  urls: readonly string[],
  fetchAsset: (url: string) => Promise<AssetResult<PreparedImage>> = fetchClipAsset,
): Promise<ClipAssets> {
  const unique = [...new Set(urls)]
  const taken = unique.slice(0, LIMITS.MAX_IMAGES_PER_CLIP)
  const failures = unique
    .slice(LIMITS.MAX_IMAGES_PER_CLIP)
    .map((url) => `${url}: over the limit of ${LIMITS.MAX_IMAGES_PER_CLIP} images per clip`)
  const results = await mapWithConcurrency(taken, LIMITS.IMAGE_FETCH_CONCURRENCY, fetchAsset)

  const files: StoredAsset[] = []
  const byHash = new Map<string, StoredAsset>()
  let spent = 0
  for (const [index, result] of results.entries()) {
    const url = taken[index] as string
    if (!result.ok) {
      failures.push(`${url}: ${result.reason}`)
      continue
    }
    const hash = await sha256BytesHex(result.value.bytes)
    const duplicate = byHash.get(hash)
    if (duplicate !== undefined) {
      duplicate.urls.push(url)
      continue
    }
    if (spent + result.value.bytes.byteLength > LIMITS.MAX_ASSET_BYTES) {
      failures.push(`${url}: over the ${LIMITS.MAX_ASSET_BYTES}-byte image budget per clip`)
      continue
    }
    spent += result.value.bytes.byteLength
    const file: StoredAsset = {
      urls: [url],
      fileName: assetFileName(files.length + 1, hash, result.value.extension),
      bytes: result.value.bytes,
    }
    files.push(file)
    byHash.set(hash, file)
  }
  return { files, failures }
}
