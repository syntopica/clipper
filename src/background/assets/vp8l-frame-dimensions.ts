// A lossless VP8L image's size, from its header at `start`: the signature
// byte 0x2f, then width and height minus one in 14 bits each.
export function vp8lFrameDimensions(bytes: Uint8Array, start: number): { width: number; height: number } | null {
  if (start + 5 > bytes.length || bytes[start] !== 0x2f) return null
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const bits = view.getUint32(start + 1, true)
  return { width: (bits & 0x3fff) + 1, height: ((bits >>> 14) & 0x3fff) + 1 }
}
