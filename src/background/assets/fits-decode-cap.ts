import { LIMITS } from '../../shared/limits'

// The backstop behind `checkDecodeSize`: a decoded bitmap larger than the cap
// means the container understated it. The decode has already happened, but no
// canvas is allocated from it and the bitmap is released by the caller.
export function fitsDecodeCap(bitmap: { width: number; height: number }): boolean {
  return bitmap.width * bitmap.height <= LIMITS.MAX_DECODED_PIXELS
}
