// A lossy VP8 key frame's size, from the frame header at `start`: a 3-byte
// frame tag, the start code 9d 01 2a, then 14-bit width and height. The top
// two bits of each are an upscaling hint; a frame that sets them asks the
// decoder for a size other than the one declared, so it is not sized.
export function vp8FrameDimensions(bytes: Uint8Array, start: number): { width: number; height: number } | null {
  if (start + 10 > bytes.length) return null
  if (bytes[start + 3] !== 0x9d || bytes[start + 4] !== 0x01 || bytes[start + 5] !== 0x2a) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const width = view.getUint16(start + 6, true)
  const height = view.getUint16(start + 8, true)
  if (width > 0x3fff || height > 0x3fff) return null
  return { width, height }
}
