import type { ImageDimensions } from './image-dimensions'

// The largest `ispe` (image spatial extents) property in the file: an AVIF can
// carry a thumbnail and a primary image, and the bigger one is what costs
// memory. A file without one is not sized, and is refused by the caller.
export function avifDimensions(bytes: Uint8Array): ImageDimensions | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let largest: ImageDimensions | null = null
  for (let offset = 4; offset + 16 <= bytes.length; offset += 1) {
    if (bytes[offset] !== 0x69 || String.fromCharCode(...bytes.subarray(offset, offset + 4)) !== 'ispe') continue
    const width = view.getUint32(offset + 8)
    const height = view.getUint32(offset + 12)
    if (largest === null || width * height > largest.width * largest.height) largest = { width, height }
  }
  return largest
}
