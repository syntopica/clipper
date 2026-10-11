import type { ImageDimensions } from './image-dimensions'

// Walk the marker segments to the first start-of-frame (SOF0-SOF15, less the
// DHT, JPG and DAC markers that share the range); its height and width are
// what the decoder allocates for.
export function jpegDimensions(bytes: Uint8Array): ImageDimensions | null {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let offset = 2
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) return null
    const marker = bytes[offset + 1] as number
    if (marker === 0xff) {
      offset += 1
      continue
    }
    if (marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) {
      offset += 2
      continue
    }
    const length = view.getUint16(offset + 2)
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return { height: view.getUint16(offset + 5), width: view.getUint16(offset + 7), frames: 1 }
    }
    if (length < 2) return null
    offset += 2 + length
  }
  return null
}
