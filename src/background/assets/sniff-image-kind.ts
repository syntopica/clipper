import type { ImageKind } from './image-kind'

// Read the format from the bytes rather than trusting `Content-Type`: CDNs
// serve WebP as `image/jpeg` and SVG as `text/plain`. SVG has no magic number,
// so it is the declared type or an `<svg` tag near the start; the sanitizer
// rejects anything that does not then parse as an SVG document.
export function sniffImageKind(bytes: ArrayBuffer, contentType: string): ImageKind {
  const head = new Uint8Array(bytes, 0, Math.min(bytes.byteLength, 1024))
  const ascii = (start: number, end: number) => String.fromCharCode(...head.subarray(start, end))
  if (ascii(0, 4) === 'GIF8') return 'gif'
  if (head[0] === 0x89 && ascii(1, 4) === 'PNG') return 'png'
  if (head[0] === 0xff && head[1] === 0xd8 && head[2] === 0xff) return 'jpeg'
  if (ascii(0, 4) === 'RIFF' && ascii(8, 12) === 'WEBP') return 'webp'
  if (ascii(4, 8) === 'ftyp' && /^avi[fs]$/.test(ascii(8, 12))) return 'avif'
  if (/svg/i.test(contentType) || /<svg[\s>]/i.test(new TextDecoder().decode(head))) return 'svg'
  return 'other'
}
