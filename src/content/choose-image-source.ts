import { imageUrlKey } from './image-url-key'
import { isWebUrl } from './is-web-url'
import { largestSrcsetCandidate } from './largest-srcset-candidate'
import { LAZY_SRC_ATTRIBUTES } from './lazy-image-attributes'
import { SRCSET_ATTRIBUTES } from './lazy-srcset-attributes'
import { resolveUrlOrNull } from './resolve-url-or-null'
import { srcsetUrls } from './srcset-urls'

// The one URL an extracted `<img>` should be clipped as: what the browser
// actually displayed for the live image sharing its `src` or any `srcset`
// candidate (see `displayedImageByUrl`), then `src`, then - when `src` is missing or a placeholder - a lazy-loading
// attribute, then the largest `srcset` candidate of the image or of its
// `<picture>` sources. Null when none of them is a web URL.
export function chooseImageSource(
  image: Element,
  displayedByUrl: ReadonlyMap<string, string>,
  baseUri: string,
): string | null {
  const src = resolveUrlOrNull(image.getAttribute('src'), baseUri)
  const known = [src, ...srcsetUrls(image.getAttribute('srcset') ?? '', baseUri)]
  for (const url of known) {
    const displayed = url === null ? undefined : displayedByUrl.get(imageUrlKey(url))
    if (displayed !== undefined && isWebUrl(displayed)) return displayed
  }
  if (src !== null && isWebUrl(src)) return src
  for (const attribute of LAZY_SRC_ATTRIBUTES) {
    const lazy = resolveUrlOrNull(image.getAttribute(attribute), baseUri)
    if (lazy !== null && isWebUrl(lazy)) return lazy
  }
  const sources = [image, ...(image.parentElement?.matches('picture') ? image.parentElement.querySelectorAll('source') : [])]
  for (const source of sources) {
    for (const attribute of SRCSET_ATTRIBUTES) {
      const value = source.getAttribute(attribute)
      const largest = value ? largestSrcsetCandidate(value, baseUri) : null
      if (largest !== null && isWebUrl(largest)) return largest
    }
  }
  return null
}
