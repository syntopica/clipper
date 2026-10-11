import type { ImageDimensions } from './image-dimensions'
import { skipGifSubBlocks } from './skip-gif-sub-blocks'

// The canvas a decoder will actually allocate, and the pixels every frame
// covers, summed. The
// logical screen size in the header is not enough: a frame's image descriptor
// may reach past it, and decoders grow the canvas to fit rather than clip. So
// every block is walked and the canvas is the largest extent any frame
// declares. A block that is neither an extension, a frame nor the trailer makes
// the file unreadable, and so refused; a file that simply ends early is sized
// by the frames it holds, which are all a decoder can draw.
export function gifDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 13) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let width = view.getUint16(6, true)
  let height = view.getUint16(8, true)
  const screenFlags = bytes[10] as number
  let offset = 13 + (screenFlags & 0x80 ? 3 * 2 ** ((screenFlags & 7) + 1) : 0)
  let frames = 0
  let totalPixels = 0
  while (offset < bytes.length) {
    const introducer = bytes[offset] as number
    if (introducer === 0x3b) break
    if (introducer === 0x21) {
      const next = skipGifSubBlocks(bytes, offset + 2)
      if (next === null) break
      offset = next
      continue
    }
    if (introducer !== 0x2c) return null
    if (offset + 10 > bytes.length) break
    frames += 1
    totalPixels += view.getUint16(offset + 5, true) * view.getUint16(offset + 7, true)
    width = Math.max(width, view.getUint16(offset + 1, true) + view.getUint16(offset + 5, true))
    height = Math.max(height, view.getUint16(offset + 3, true) + view.getUint16(offset + 7, true))
    const frameFlags = bytes[offset + 9] as number
    const next = skipGifSubBlocks(bytes, offset + 11 + (frameFlags & 0x80 ? 3 * 2 ** ((frameFlags & 7) + 1) : 0))
    if (next === null) break
    offset = next
  }
  if (frames === 0) return null
  return { width, height, totalPixels: Math.max(totalPixels, width * height) }
}
