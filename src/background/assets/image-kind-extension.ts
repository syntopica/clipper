import type { ImageKind } from './image-kind'

// The file extension an image keeps when its original bytes are stored. `other`
// has none: it is never stored as it came.
export const IMAGE_KIND_EXTENSION: Record<Exclude<ImageKind, 'other'>, string> = {
  svg: 'svg',
  gif: 'gif',
  png: 'png',
  jpeg: 'jpg',
  webp: 'webp',
  avif: 'avif',
}
