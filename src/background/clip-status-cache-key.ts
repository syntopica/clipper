// `chrome.storage.session` rather than a module-level Map: an MV3 worker is
// killed whenever Chrome feels like it, and a cache that died with it would put
// a request on every tab switch. Session rather than local because a stale
// answer surviving a browser restart is worse than asking again.
export function clipStatusCacheKey(url: string): string {
  return `clipStatus:${url}`
}
