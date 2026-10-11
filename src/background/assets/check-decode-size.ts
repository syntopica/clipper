import { LIMITS } from '../../shared/limits'
import type { AssetResult } from './asset-result'
import type { ImageKind } from './image-kind'
import { readImageDimensions } from './read-image-dimensions'

// Refuse a raster image before it is decoded when its container declares more
// pixels than the cap - in its largest canvas, or in all its frames together -
// or cannot be read at all: decoding allocates width x height x 4 bytes
// whatever the file size, which is how a few kilobytes of PNG become gigabytes
// in the service worker. `fitsDecodeCap` checks the decoded bitmap again, in
// case a decoder disagrees with the container.
export function checkDecodeSize(bytes: Uint8Array, kind: ImageKind): AssetResult<null> {
  const dimensions = readImageDimensions(bytes, kind)
  if (dimensions === null) return { ok: false, reason: `unsupported or unreadable ${kind} image` }
  const pixels = dimensions.width * dimensions.height
  if (dimensions.width === 0 || dimensions.height === 0) return { ok: false, reason: 'empty image' }
  if (pixels > LIMITS.MAX_DECODED_PIXELS) {
    return { ok: false, reason: `${dimensions.width}x${dimensions.height} exceeds ${LIMITS.MAX_DECODED_PIXELS} pixels` }
  }
  if (pixels * dimensions.frames > LIMITS.MAX_ANIMATION_PIXELS) {
    return { ok: false, reason: `${dimensions.frames} frames exceed ${LIMITS.MAX_ANIMATION_PIXELS} pixels` }
  }
  return { ok: true, value: null }
}
