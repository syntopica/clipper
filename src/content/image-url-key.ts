// An image URL with its scheme dropped, for matching one image across copies:
// a protocol-relative `//upload...` resolves to `https:` on the live page but
// may come out `http:` from a copy resolved elsewhere, and it is the same image.
export function imageUrlKey(url: string): string {
  return url.replace(/^https?:/i, '')
}
