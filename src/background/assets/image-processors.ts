import type { ReencodedImage } from './reencoded-image'

// The three operations that need a real browser - decoding, re-encoding and
// parsing SVG - behind one seam, so the pipeline around them runs under test.
export interface ImageProcessors {
  decode: (blob: Blob) => Promise<ImageBitmap>
  reencode: (blob: Blob) => Promise<ReencodedImage>
  sanitizeSvg: (svg: string) => Promise<string | null>
}
