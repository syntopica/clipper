// The offset just past a chain of GIF data sub-blocks (length byte, data,
// ending with a zero length), or null when the chain runs off the end.
export function skipGifSubBlocks(bytes: Uint8Array, start: number): number | null {
  let offset = start
  while (offset < bytes.length) {
    const length = bytes[offset] as number
    if (length === 0) return offset + 1
    offset += length + 1
  }
  return null
}
