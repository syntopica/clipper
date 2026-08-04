import { isDenylistedHostname } from '../shared/is-denylisted-hostname'

// Which tabs may be named to the capture service at all. A denylisted host must
// not be sent there any more than it may be clipped: the lookup is a request
// carrying that URL to a third machine, and the denylist exists precisely to
// decide which URLs never leave this one.
export function isInspectableUrl(url: string | undefined): url is string {
  if (url === undefined) return false
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return false
    return !isDenylistedHostname(parsed.hostname)
  } catch {
    return false
  }
}
