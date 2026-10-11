// Whether the bytes really are an image. A private endpoint reached despite the
// URL policy - a DNS name that resolves inward - usually answers with JSON or
// HTML, which fails to decode and is discarded. It does nothing against an
// internal service that returns a real image; that residual risk is accepted
// in the design.
export async function decodesAsImage(
  blob: Blob,
  decode: (blob: Blob) => Promise<ImageBitmap> = (value) => createImageBitmap(value),
): Promise<boolean> {
  try {
    const bitmap = await decode(blob)
    bitmap.close()
    return true
  } catch {
    return false
  }
}
