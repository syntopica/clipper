const TRACKING_PREFIXES = ['utm_']
const TRACKING_KEYS = ['fbclid', 'gclid', 'mc_cid', 'mc_eid', 'ref_src']

export function normalizeUrl(url: string): string {
  const parsed = new URL(url)
  parsed.hash = ''
  for (const key of [...parsed.searchParams.keys()]) {
    const isTracking =
      TRACKING_PREFIXES.some((prefix) => key.startsWith(prefix)) || TRACKING_KEYS.includes(key)
    if (isTracking) parsed.searchParams.delete(key)
  }
  return parsed.toString().replace(/\?$/, '')
}
