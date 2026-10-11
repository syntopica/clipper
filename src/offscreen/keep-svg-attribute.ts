// Whether an SVG attribute may stay. A stored SVG must render from its own
// bytes: any reference out of the document - an `href` that is not a `#`
// fragment, a `url(...)` that is not one - is a tracking pixel or a fetch of
// whatever the page chose, every time the clip is viewed.
//
// Values are judged conservatively rather than parsed as CSS. Every `url(` must
// open, after optional whitespace and quote, on `#`; quoting a `)` inside the
// URL does not hide it. A backslash is refused outright, because CSS escapes
// spell `url` and `#` without those characters (`u\72l(`), and so are
// `image-set(`, `src(` and `@import`, which load a URL without `url(`.
export function keepSvgAttribute(name: string, value: string): boolean {
  const lowered = name.toLowerCase()
  if (lowered === 'href' || lowered.endsWith(':href')) return value.trim().startsWith('#')
  if (value.includes('\\')) return false
  if (/image-set\s*\(|(?:^|[^-\w])src\s*\(|@import/i.test(value)) return false
  for (const opening of value.matchAll(/url\s*\(\s*(['"]?)\s*/gi)) {
    if (value.charAt((opening.index ?? 0) + opening[0].length) !== '#') return false
  }
  return true
}
