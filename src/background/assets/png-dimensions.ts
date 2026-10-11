import type { ImageDimensions } from './image-dimensions'

// IHDR is the first chunk, at a fixed offset: width and height, big-endian.
export function pngDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 24) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  return { width: view.getUint32(16), height: view.getUint32(20), frames: 1 }
}
