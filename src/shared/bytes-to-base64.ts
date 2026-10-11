// Binary content for the GitHub blob API, which takes it as base64. Built in
// chunks: spreading a megabyte into `String.fromCharCode` overflows the stack.
export function bytesToBase64(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes)
  let binary = ''
  for (let offset = 0; offset < view.length; offset += 0x8000) {
    binary += String.fromCharCode(...view.subarray(offset, offset + 0x8000))
  }
  return btoa(binary)
}
