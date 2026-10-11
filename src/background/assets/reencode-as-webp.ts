import { LIMITS } from '../../shared/limits'
import type { ReencodedImage } from './reencoded-image'

// Decode in the worker, scale the long edge down to the cap, encode as WebP.
// `createImageBitmap` throwing is how bytes that are not an image are refused,
// so this doubles as the decode check for every raster format.
export async function reencodeAsWebp(blob: Blob): Promise<ReencodedImage> {
  const bitmap = await createImageBitmap(blob)
  try {
    const scale = Math.min(1, LIMITS.MAX_IMAGE_EDGE_PX / Math.max(bitmap.width, bitmap.height))
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const canvas = new OffscreenCanvas(width, height)
    const context = canvas.getContext('2d')
    if (context === null) throw new Error('no 2d context for re-encoding')
    context.drawImage(bitmap, 0, 0, width, height)
    const encoded = await canvas.convertToBlob({ type: 'image/webp', quality: LIMITS.WEBP_QUALITY })
    return { blob: encoded, resized: scale < 1 }
  } finally {
    bitmap.close()
  }
}
