import { LIMITS } from '../../shared/limits'
import type { AssetResult } from './asset-result'
import { decodesAsImage } from './decodes-as-image'
import type { ImageProcessors } from './image-processors'
import { prepareRasterImage } from './prepare-raster-image'
import type { PreparedImage } from './prepared-image'
import { sniffImageKind } from './sniff-image-kind'

// Turn fetched bytes into what gets committed, per the design's table: an SVG
// is sanitised and stored, a GIF is stored as it came (re-encoding would drop
// its animation), everything else goes through the WebP pass. Whatever still
// exceeds the git blob cap keeps its remote URL.
export async function prepareImageAsset(
  blob: Blob,
  processors: ImageProcessors,
): Promise<AssetResult<PreparedImage>> {
  const kind = sniffImageKind(await blob.arrayBuffer(), blob.type)
  let prepared: AssetResult<PreparedImage>
  if (kind === 'svg') {
    if (blob.size > LIMITS.MAX_GIT_BLOB_BYTES) {
      return { ok: false, reason: `SVG larger than ${LIMITS.MAX_GIT_BLOB_BYTES} bytes` }
    }
    const clean = await processors.sanitizeSvg(await blob.text())
    if (clean === null) return { ok: false, reason: 'not an SVG document' }
    prepared = { ok: true, value: { bytes: new TextEncoder().encode(clean).buffer as ArrayBuffer, extension: 'svg' } }
  } else if (kind === 'gif') {
    if (!(await decodesAsImage(blob, processors.decode))) return { ok: false, reason: 'does not decode as an image' }
    prepared = { ok: true, value: { bytes: await blob.arrayBuffer(), extension: 'gif' } }
  } else {
    prepared = await prepareRasterImage(blob, kind, processors)
  }
  if (prepared.ok && prepared.value.bytes.byteLength > LIMITS.MAX_GIT_BLOB_BYTES) {
    return { ok: false, reason: `larger than ${LIMITS.MAX_GIT_BLOB_BYTES} bytes after compression` }
  }
  return prepared
}
