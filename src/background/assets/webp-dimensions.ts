import type { ImageDimensions } from './image-dimensions'

// The first chunk after `WEBP` decides the layout: lossy VP8 stores 14-bit
// sizes after its start code, lossless VP8L packs them into 28 bits, and the
// extended VP8X stores the canvas as 24-bit values minus one.
export function webpDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 30) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const chunk = String.fromCharCode(...bytes.subarray(12, 16))
  if (chunk === 'VP8 ') {
    return { width: view.getUint16(26, true) & 0x3fff, height: view.getUint16(28, true) & 0x3fff, frames: 1 }
  }
  if (chunk === 'VP8L') {
    const bits = view.getUint32(21, true)
    return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1, frames: 1 }
  }
  if (chunk === 'VP8X') {
    const width = 1 + ((bytes[24] as number) | ((bytes[25] as number) << 8) | ((bytes[26] as number) << 16))
    const height = 1 + ((bytes[27] as number) | ((bytes[28] as number) << 8) | ((bytes[29] as number) << 16))
    return { width, height, frames: 1 }
  }
  return null
}
