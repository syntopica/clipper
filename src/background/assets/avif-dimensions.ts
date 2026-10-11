import type { ImageDimensions } from './image-dimensions'

// The largest `ispe` (image spatial extents) anywhere in the file. An AVIF can
// hold a primary image, a thumbnail, an alpha plane and other auxiliary
// images, each with its own `ispe`, and nothing here works out which one the
// decoder will treat as primary - so it measures them all and keeps the
// biggest; rotation (`irot`) swaps the sides but not the area, and a clean
// aperture (`clap`) only crops. A derived image is refused outright: a `grid`
// or `iovl` declares its output size in item data, not in `ispe`, so it could
// claim a small extent and decode to a huge one. The byte scan can only
// overcount, which refuses more, never less.
export function avifDimensions(bytes: Uint8Array): ImageDimensions | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let largest: ImageDimensions | null = null
  for (let offset = 4; offset + 4 <= bytes.length; offset += 1) {
    const tag = String.fromCharCode(...bytes.subarray(offset, offset + 4))
    if (tag === 'grid' || tag === 'iovl') return null
    if (tag !== 'ispe' || offset + 16 > bytes.length) continue
    const width = view.getUint32(offset + 8)
    const height = view.getUint32(offset + 12)
    if (largest === null || width * height > largest.width * largest.height) largest = { width, height, frames: 1 }
  }
  return largest
}
