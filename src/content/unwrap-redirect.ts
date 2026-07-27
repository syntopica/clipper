// YouTube renders every link in a video description as a redirect shim - a
// 250-character www.youtube.com/redirect?...&q=<the actual url> - and truncates
// the visible text with an ellipsis. Both halves matter here: the truncation
// means the real url survives only in the href, so the link is worth
// recovering, and the shim means what gets recovered is a tracking wrapper
// nobody can read and that will rot when the token expires.
//
// Unwrapping first also lets the existing duplicate check do its job, since it
// compares against what actually appears in the extracted content.
const REDIRECT_PARAMS: Record<string, string> = {
  'www.youtube.com': 'q',
  'm.youtube.com': 'q',
}

export function unwrapRedirect(url: string): string {
  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return url
  }

  const param = REDIRECT_PARAMS[parsed.hostname]
  if (!param || parsed.pathname !== '/redirect') return url

  const target = parsed.searchParams.get(param)
  if (!target) return url

  // Validated through URL but returned verbatim: toString() would normalize
  // `https://example.com` into `https://example.com/`, and the duplicate check
  // downstream compares this against the page's own text, where the trailing
  // slash is absent as often as not.
  try {
    const protocol = new URL(target).protocol
    if (protocol !== 'https:' && protocol !== 'http:') return url
    return target
  } catch {
    return url
  }
}
