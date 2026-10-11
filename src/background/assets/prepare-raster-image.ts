import type { AssetResult } from './asset-result'
import type { ImageKind } from './image-kind'
import { IMAGE_KIND_EXTENSION } from './image-kind-extension'
import type { ImageProcessors } from './image-processors'
import type { PreparedImage } from './prepared-image'

// A PNG, JPEG, WebP, AVIF or anything else the browser decodes: re-encoded as
// WebP with the long edge capped. When the re-encode came out larger and did not
// have to shrink the image, the original bytes are kept instead - recompressing
// an already tight JPEG only loses quality. An unrecognised format is never
// kept as it came.
export async function prepareRasterImage(
  blob: Blob,
  kind: Exclude<ImageKind, 'svg' | 'gif'>,
  processors: ImageProcessors,
): Promise<AssetResult<PreparedImage>> {
  let reencoded
  try {
    reencoded = await processors.reencode(blob)
  } catch {
    return { ok: false, reason: 'does not decode as an image' }
  }
  if (kind !== 'other' && !reencoded.resized && reencoded.blob.size >= blob.size) {
    return { ok: true, value: { bytes: await blob.arrayBuffer(), extension: IMAGE_KIND_EXTENSION[kind] } }
  }
  return { ok: true, value: { bytes: await reencoded.blob.arrayBuffer(), extension: 'webp' } }
}
