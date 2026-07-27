import { LIMITS } from '../shared/limits'
import { isUrlLikeText } from './is-url-like-text'
import { unwrapRedirect } from './unwrap-redirect'

// Readability removes nodes it judges to be mostly links. On a page whose
// content links are rendered with the url as their own label - X is the case
// that surfaced this - that heuristic deletes the anchors outright, text
// included, so a clip of a post titled "[Full GitHub Links]" arrived with zero
// links in it. The links survived in `source.html` (the whole-page snapshot is
// not extracted), so nothing was lost, but the markdown - the part anyone
// actually reads - had lost its entire payload.
//
// Raising Readability's `linkDensityModifier` brings them back only by
// disabling the heuristic altogether (its thresholds become unreachable), which
// would let navigation and footer link soup into every other clip. Falling
// through to the `article` element recovers the links on X at the cost of six
// times the markup. So the extractor is left alone and only the url-labelled
// anchors it dropped are recovered.
export interface DroppedLink {
  href: string
  text: string
}

export function droppedContentLinks(
  doc: Document,
  extractedHtml: string,
  baseUri: string,
): DroppedLink[] {
  const seen = new Set<string>()
  const dropped: DroppedLink[] = []

  for (const anchor of doc.querySelectorAll('a[href]')) {
    if (dropped.length >= LIMITS.MAX_RECOVERED_LINKS) break

    const text = (anchor.textContent ?? '').trim()
    if (!isUrlLikeText(text)) continue

    const raw = anchor.getAttribute('href') ?? ''
    let href: string
    try {
      href = unwrapRedirect(new URL(raw, baseUri).toString())
    } catch {
      continue
    }
    if (!href.startsWith('https://') && !href.startsWith('http://')) continue
    if (seen.has(href)) continue

    // The extracted html carries absolutized hrefs on the Defuddle branch and
    // resolved ones everywhere else, but a raw match is still worth checking:
    // an extractor that kept the anchor verbatim would otherwise look like a
    // drop and duplicate the link.
    //
    // A root url is compared both ways because the two sides disagree about it:
    // a href is written `https://example.com/` and the same link in running text
    // is written `https://example.com`. Treating those as different links puts
    // one the reader already has into the recovered list.
    const bare = href.replace(/\/$/, '')
    if (extractedHtml.includes(href) || extractedHtml.includes(bare)) continue
    if (raw && extractedHtml.includes(raw)) continue

    seen.add(href)
    dropped.push({ href, text })
  }

  return dropped
}
