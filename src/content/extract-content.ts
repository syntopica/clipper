import Defuddle from 'defuddle/full'

export type Extractor = 'selection' | 'defuddle' | 'article' | 'main' | 'body' | 'innertext'

export interface ExtractedContent {
  html: string
  extractor: Extractor
  // The site-specific extractor Defuddle matched - 'twitter', 'github',
  // 'reddit', 'youtube', 'hackernews' and twenty-odd others - or null when it
  // fell through to its generic heuristics. Recorded because the two produce
  // very different markdown from the same page, and a clip that reads oddly is
  // otherwise impossible to attribute after the fact.
  site: string | null
}

// Defuddle.parse() always returns an object, even for a near-empty shell page,
// wrapping whatever text it could find. A minimum text length rejects those
// trivial wrappers so the chain falls through to the DOM-shape steps below,
// which is more honest about extractors that found nothing real.
const MIN_EXTRACTED_TEXT_LENGTH = 100

export function extractContent(doc: Document, selectionHtml: string | null): ExtractedContent {
  if (selectionHtml) return { html: selectionHtml, extractor: 'selection', site: null }

  // parse() is the synchronous entry point, and every extractor that would
  // reach a third-party API - FxTwitter for X, the YouTube transcript
  // endpoint, Reddit's comment json - is only reachable through parseAsync().
  // Nothing about a clipped page leaves the browser on this path, which is
  // what makes a site-aware extractor acceptable for a private brain.
  let parsed
  try {
    parsed = new Defuddle(doc, { url: doc.baseURI }).parse()
  } catch {
    parsed = null
  }
  if (parsed?.content) {
    // A <template> rather than a <div>: its markup is parsed into an inert
    // document fragment, so nothing here can run or load, and this probe only
    // ever needs the text length. The html itself still goes through DOMPurify
    // downstream before anything else touches it.
    const probe = doc.createElement('template')
    probe.innerHTML = parsed.content
    if ((probe.content.textContent ?? '').trim().length >= MIN_EXTRACTED_TEXT_LENGTH) {
      return { html: parsed.content, extractor: 'defuddle', site: parsed.extractorType ?? null }
    }
  }

  const articleEl = doc.querySelector('article')
  if (articleEl?.innerHTML.trim()) {
    return { html: articleEl.innerHTML, extractor: 'article', site: null }
  }

  const mainEl = doc.querySelector('main, [role="main"]')
  if (mainEl?.innerHTML.trim()) return { html: mainEl.innerHTML, extractor: 'main', site: null }

  // A body holding only a bare text node has no markup for Turndown to work
  // with (its innerHTML is just the text, same as textContent), so it is not
  // really an HTML extraction - fall through to innertext instead of
  // reporting a false 'body' win.
  const body = doc.body
  if (body?.innerHTML.trim() && body.children.length > 0) {
    return { html: body.innerHTML, extractor: 'body', site: null }
  }

  // Build the element and set textContent rather than interpolating into a
  // template string, so page text containing "<" or "&" is not reinterpreted
  // as markup.
  const paragraph = doc.createElement('p')
  paragraph.textContent = doc.body?.textContent?.trim() ?? ''
  return { html: paragraph.outerHTML, extractor: 'innertext', site: null }
}
