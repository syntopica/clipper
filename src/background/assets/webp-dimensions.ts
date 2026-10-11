import type { ImageDimensions } from './image-dimensions'
import { vp8FrameDimensions } from './vp8-frame-dimensions'
import { vp8lFrameDimensions } from './vp8l-frame-dimensions'

// Chunks an extended still WebP may carry besides its one bitstream.
const STILL_METADATA_CHUNKS = new Set(['ICCP', 'ALPH', 'EXIF', 'XMP '])

// Only a single still image is sized: a simple VP8 or VP8L file, or a VP8X
// file without the animation flag whose chunks are metadata plus exactly one
// VP8 or VP8L bitstream, and whose canvas matches that bitstream's frame size
// exactly. Animation, unknown chunks, a second bitstream or sizes that
// disagree return null and the image is refused: what a decoder allocates is
// then not something this header read can vouch for.
export function webpDimensions(bytes: Uint8Array): ImageDimensions | null {
  if (bytes.length < 20) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const tag = (offset: number) => String.fromCharCode(...bytes.subarray(offset, offset + 4))
  const frame = (offset: number) =>
    tag(offset) === 'VP8 ' ? vp8FrameDimensions(bytes, offset + 8) : tag(offset) === 'VP8L' ? vp8lFrameDimensions(bytes, offset + 8) : null
  const sized = (size: { width: number; height: number } | null): ImageDimensions | null =>
    size === null ? null : { ...size, totalPixels: size.width * size.height }

  if (tag(12) !== 'VP8X') return sized(frame(12))
  if (bytes.length < 30) return null
  if ((bytes[20] as number) & 0x02) return null
  const canvasWidth = 1 + ((bytes[24] as number) | ((bytes[25] as number) << 8) | ((bytes[26] as number) << 16))
  const canvasHeight = 1 + ((bytes[27] as number) | ((bytes[28] as number) << 8) | ((bytes[29] as number) << 16))
  let bitstream: { width: number; height: number } | null = null
  for (let offset = 30; offset < bytes.length; ) {
    if (offset + 8 > bytes.length) return null
    const name = tag(offset)
    const size = view.getUint32(offset + 4, true)
    if (name === 'VP8 ' || name === 'VP8L') {
      if (bitstream !== null) return null
      bitstream = frame(offset)
      if (bitstream === null) return null
    } else if (!STILL_METADATA_CHUNKS.has(name)) {
      return null
    }
    offset += 8 + size + (size % 2)
  }
  if (bitstream === null || bitstream.width !== canvasWidth || bitstream.height !== canvasHeight) return null
  return sized(bitstream)
}
