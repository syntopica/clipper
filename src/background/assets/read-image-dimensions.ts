import { gifDimensions } from './gif-dimensions'
import type { ImageDimensions } from './image-dimensions'
import type { ImageKind } from './image-kind'
import { jpegDimensions } from './jpeg-dimensions'
import { pngDimensions } from './png-dimensions'
import { webpDimensions } from './webp-dimensions'

// The declared canvas of a raster image, read from its header without
// decoding. Null when the header cannot be read or vouched for - including
// AVIF and every format this does not know, which therefore never reach a
// decoder. AVIF is refused by design: its HEIF item graph (grids, overlays,
// auxiliary images, transforms) is too rich to bound from a header read.
export function readImageDimensions(bytes: Uint8Array, kind: ImageKind): ImageDimensions | null {
  if (kind === 'png') return pngDimensions(bytes)
  if (kind === 'gif') return gifDimensions(bytes)
  if (kind === 'jpeg') return jpegDimensions(bytes)
  if (kind === 'webp') return webpDimensions(bytes)
  return null
}
