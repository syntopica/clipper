// X writes a link inside tweet text as hidden and visible spans - `https://`,
// a display text cut short, the rest, and `…` - and Defuddle's twitter
// extractor flattens every such anchor to its whole `textContent`. For a link
// to another tweet the hidden rest is the href path, so the clip read
// `https://x.com/GCRClassic/sta/GCRClassic/status/1621990690304442370…`.
// Each link is rewritten to the URL it actually opens, as both its href and
// its only text, so flattening it yields that URL. A t.co redirect is spelled
// as its expanded URL, which X puts in the spans with only the `…` to drop.
// Mentions, hashtags and cashtags read right already and are left alone.
export function spellOutXTweetLinks(doc: Document): number {
  let spelled = 0
  for (const link of doc.querySelectorAll<HTMLAnchorElement>('[data-testid="tweetText"] a[href]')) {
    const text = (link.textContent ?? '').trim()
    if (/^[@#$]/.test(text)) continue
    let target: URL
    try {
      target = new URL(link.getAttribute('href') ?? '', doc.baseURI)
    } catch {
      continue
    }
    if (target.hostname === 't.co') {
      try {
        target = new URL(text.replace(/…$/, ''))
      } catch {
        continue
      }
    }
    link.setAttribute('href', target.href)
    link.textContent = target.href
    spelled += 1
  }
  return spelled
}
