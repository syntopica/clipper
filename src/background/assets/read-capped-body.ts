import type { AssetResult } from './asset-result'

// A response body read into a Blob, refused as soon as it passes `maxBytes`:
// by `Content-Length` before reading, and by counting while it streams, since
// the header may be missing or lie. `response.blob()` would buffer whatever the
// host chose to send.
export async function readCappedBody(response: Response, maxBytes: number): Promise<AssetResult<Blob>> {
  const type = response.headers.get('content-type') ?? ''
  const declared = Number(response.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > maxBytes) {
    await response.body?.cancel()
    return { ok: false, reason: `larger than ${maxBytes} bytes` }
  }
  if (response.body === null) return { ok: true, value: new Blob([], { type }) }
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let received = 0
  for (;;) {
    const { done, value } = await reader.read()
    if (done) break
    received += value.byteLength
    if (received > maxBytes) {
      await reader.cancel()
      return { ok: false, reason: `larger than ${maxBytes} bytes` }
    }
    chunks.push(value)
  }
  return { ok: true, value: new Blob(chunks as BlobPart[], { type }) }
}
