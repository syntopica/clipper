// The biggest image a `srcset` offers, as an absolute URL: the highest `w`
// width, or the highest `x` density, a bare URL counting as `1x`. Null when
// nothing in it resolves. Commas inside a URL are not handled - the srcset
// grammar makes them ambiguous, and they are rare enough to fall back on `src`.
export function largestSrcsetCandidate(srcset: string, baseUri: string): string | null {
  let best: { url: string; size: number } | null = null
  for (const candidate of srcset.split(',')) {
    const [rawUrl, descriptor = '1x'] = candidate.trim().split(/\s+/)
    if (!rawUrl) continue
    const size = Number.parseFloat(descriptor)
    if (!Number.isFinite(size)) continue
    try {
      const url = new URL(rawUrl, baseUri).href
      if (best === null || size > best.size) best = { url, size }
    } catch {
      // Not a URL; try the next candidate.
    }
  }
  return best?.url ?? null
}
