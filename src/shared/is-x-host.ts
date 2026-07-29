// The X web app answers on both brands; mobile.twitter.com still serves the
// same SPA for old bookmarks.
const X_HOSTNAMES = new Set(['x.com', 'twitter.com', 'mobile.twitter.com'])

export function isXHost(hostname: string): boolean {
  return X_HOSTNAMES.has(hostname)
}
