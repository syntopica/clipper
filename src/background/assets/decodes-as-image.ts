import { fitsDecodeCap } from './fits-decode-cap'

// Whether the bytes really are an image. A private endpoint reached despite the
// URL policy - a DNS name that resolves inward - usually answers with JSON or
// HTML, which fails to decode and is discarded. It does nothing against an
// internal service that returns a real image; that residual risk is accepted
// in the design. A bitmap over the pixel cap counts as not decoding: the
// container understated its size.
export async function decodesAsImage(
  blob: Blob,
  decode: (blob: Blob) => Promise<ImageBitmap> = (value) => createImageBitmap(value),
): Promise<boolean> {
  try {
    const bitmap = await decode(blob)
    const fits = fitsDecodeCap(bitmap)
    bitmap.close()
    return fits
  } catch {
    return false
  }
}
