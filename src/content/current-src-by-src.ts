// What each live image actually displays, keyed by its resolved `src`. The
// extracted HTML is a copy: only the live element knows which `srcset`
// candidate the browser picked.
export function currentSrcBySrc(doc: Document): Map<string, string> {
  const map = new Map<string, string>()
  for (const image of doc.images) {
    if (image.src && image.currentSrc) map.set(image.src, image.currentSrc)
  }
  return map
}
