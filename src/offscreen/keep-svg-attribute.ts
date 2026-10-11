// Whether an SVG attribute may stay. A stored SVG must render from its own
// bytes: any reference out of the document - an `href` that is not a `#`
// fragment, a `url(...)` that is not one - is a tracking pixel or a fetch of
// whatever the page chose, every time the clip is viewed.
export function keepSvgAttribute(name: string, value: string): boolean {
  if (name === 'href' || name === 'xlink:href') return value.trim().startsWith('#')
  for (const match of value.matchAll(/url\(\s*(['"]?)([^)'"]*)\1\s*\)/gi)) {
    if (!(match[2] ?? '').trim().startsWith('#')) return false
  }
  return !/@import/i.test(value)
}
