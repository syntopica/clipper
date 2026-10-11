import type { ImageProcessors } from './image-processors'
import { reencodeAsWebp } from './reencode-as-webp'
import { sanitizeSvgOffscreen } from './sanitize-svg-offscreen'

export const DEFAULT_IMAGE_PROCESSORS: ImageProcessors = {
  decode: (blob) => createImageBitmap(blob),
  reencode: reencodeAsWebp,
  sanitizeSvg: sanitizeSvgOffscreen,
}
