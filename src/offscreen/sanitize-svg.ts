import DOMPurify from 'dompurify'
import { keepSvgAttribute } from './keep-svg-attribute'

// An SVG as it may be committed: DOMPurify's SVG profile drops scripts, event
// handlers and anything that is not drawing; `<style>` and `<foreignObject>`
// go too, and every external reference is cut (see `keepSvgAttribute`).
// Serialised as XML so the file stands alone, `xmlns` included. Null when the
// input does not parse as an SVG document - an HTML page, say.
export function sanitizeSvg(svg: string): string | null {
  const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml')
  if (parsed.getElementsByTagName('parsererror').length > 0) return null
  if (parsed.documentElement.localName !== 'svg') return null

  // A private instance: a hook added to the shared one would also run in
  // every other sanitize call in this context.
  const purify = DOMPurify(window)
  purify.addHook('uponSanitizeAttribute', (_node, data) => {
    if (!keepSvgAttribute(data.attrName, data.attrValue)) data.keepAttr = false
  })
  const fragment = purify.sanitize(svg, {
    USE_PROFILES: { svg: true, svgFilters: true },
    FORBID_TAGS: ['style', 'foreignObject'],
    RETURN_DOM_FRAGMENT: true,
  })
  const root = fragment.firstElementChild
  if (root === null || root.localName !== 'svg') return null
  return new XMLSerializer().serializeToString(root)
}
