import { isWebUrl } from './is-web-url'
import { largestSrcsetCandidate } from './largest-srcset-candidate'
import { LAZY_SRC_ATTRIBUTES } from './lazy-image-attributes'
import { SRCSET_ATTRIBUTES } from './lazy-srcset-attributes'
import { resolveUrlOrNull } from './resolve-url-or-null'

// The one URL an extracted `<img>` should be clipped as: what the browser
// actually displayed (`currentSrc` of the live image with the same `src`),
// then `src`, then - when `src` is missing or a placeholder - a lazy-loading
// attribute, then the largest `srcset` candidate of the image or of its
// `<picture>` sources. Null when none of them is a web URL.
export function chooseImageSource(
  image: Element,
  currentSrcBySrc: ReadonlyMap<string, string>,
  baseUri: string,
): string | null {
  const src = resolveUrlOrNull(image.getAttribute('src'), baseUri)
  const current = src === null ? undefined : currentSrcBySrc.get(src)
  if (current !== undefined && isWebUrl(current)) return current
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
