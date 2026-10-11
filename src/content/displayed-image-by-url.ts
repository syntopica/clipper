import { imageUrlKey } from './image-url-key'
import { srcsetUrls } from './srcset-urls'

// What each live image actually displays, keyed (see `imageUrlKey`) by its
// `src` and by every `srcset` candidate. The extracted HTML is a copy the
// extractor may have rewritten: Defuddle's lazy-image rule copies any attribute
// ending in `.jpg` into `src`, and Wikipedia's images carry an RDFa `resource`
// naming their `/wiki/File:` page - so the copy's `src` can be a web page while
// its `srcset` still names the real image. Either can find the live element.
export function displayedImageByUrl(doc: Document): Map<string, string> {
  const map = new Map<string, string>()
  for (const image of doc.images) {
    const displayed = image.currentSrc || image.src
    if (!displayed) continue
    const keys = [image.src, ...srcsetUrls(image.getAttribute('srcset') ?? '', doc.baseURI)]
    for (const key of keys) if (key) map.set(imageUrlKey(key), displayed)
  }
  return map
}
