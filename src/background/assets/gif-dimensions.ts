import type { ImageDimensions } from './image-dimensions'

// The logical screen size, little-endian, right after the signature. Every
// frame is drawn inside it.
export function gifDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 10) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return { width: view.getUint16(6, true), height: view.getUint16(8, true) }
}
