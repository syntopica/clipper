import Defuddle from 'defuddle/full'
import { LIMITS } from '../shared/limits'
import { sameOriginFetch } from './same-origin-fetch'

export type Extractor = 'selection' | 'defuddle' | 'article' | 'main' | 'body' | 'innertext'

export interface ExtractedContent {
  html: string
  extractor: Extractor
  // Whether one of Defuddle's site-specific extractors - X, Reddit, YouTube,
  // GitHub, Hacker News and twenty-odd others - handled the page, as opposed to
  // its generic heuristics. Recorded because the two produce very different
  // markdown from the same page, and a clip that reads oddly is otherwise
  // impossible to attribute after the fact.
  //
  // A boolean rather than the extractor's name: Defuddle derives the name it
  // reports from `constructor.name`, and the browser bundles it publishes are
  // minified, so by the time the code runs that name is 'v' or 'a'. Only its
  // presence survives - undefined on the generic path, some mangled string
  // otherwise.
  siteExtractor: boolean
}

// Defuddle.parse() always returns an object, even for a near-empty shell page,
// wrapping whatever text it could find. A minimum text length rejects those
// trivial wrappers so the chain falls through to the DOM-shape steps below,
// which is more honest about extractors that found nothing real.
const MIN_EXTRACTED_TEXT_LENGTH = 100

export async function extractContent(
  doc: Document,
  selectionHtml: string | null,
): Promise<ExtractedContent> {
  if (selectionHtml) return { html: selectionHtml, extractor: 'selection', siteExtractor: false }

  // parseAsync() is what reaches the network, and `sameOriginFetch` decides
  // who it may reach: YouTube's transcript, which lives on the page's own
  // host, goes through; X's oembed and FxTwitter calls do not. It is also the
  // only path that can block - the YouTube extractor falls back to opening the
  // transcript panel and polling the DOM - so it races a timeout and the
  // synchronous parse takes over if it loses.
  const options = { url: doc.baseURI, fetch: sameOriginFetch(new URL(doc.baseURI).hostname) }
  let parsed
  try {
    parsed = await Promise.race([
      new Defuddle(doc, options).parseAsync(),
      new Promise<null>((resolve) => setTimeout(() => resolve(null), LIMITS.EXTRACTION_TIMEOUT_MS)),
    ])
  } catch {
    parsed = null
  }
  if (!parsed) {
    try {
      parsed = new Defuddle(doc, options).parse()
    } catch {
      parsed = null
    }
  }
  if (parsed?.content) {
    // A <template> rather than a <div>: its markup is parsed into an inert
    // document fragment, so nothing here can run or load, and this probe only
    // ever needs the text length. The html itself still goes through DOMPurify
    // downstream before anything else touches it.
    const probe = doc.createElement('template')
    probe.innerHTML = parsed.content
    if ((probe.content.textContent ?? '').trim().length >= MIN_EXTRACTED_TEXT_LENGTH) {
      return {
        html: parsed.content,
        extractor: 'defuddle',
        siteExtractor: parsed.extractorType !== undefined,
      }
    }
  }

  const articleEl = doc.querySelector('article')
  if (articleEl?.innerHTML.trim()) {
    return { html: articleEl.innerHTML, extractor: 'article', siteExtractor: false }
  }

  const mainEl = doc.querySelector('main, [role="main"]')
  if (mainEl?.innerHTML.trim()) {
    return { html: mainEl.innerHTML, extractor: 'main', siteExtractor: false }
  }

  // A body holding only a bare text node has no markup for Turndown to work
  // with (its innerHTML is just the text, same as textContent), so it is not
  // really an HTML extraction - fall through to innertext instead of
  // reporting a false 'body' win.
  const body = doc.body
  if (body?.innerHTML.trim() && body.children.length > 0) {
    return { html: body.innerHTML, extractor: 'body', siteExtractor: false }
  }

  // Build the element and set textContent rather than interpolating into a
  // template string, so page text containing "<" or "&" is not reinterpreted
  // as markup.
  const paragraph = doc.createElement('p')
  paragraph.textContent = doc.body?.textContent?.trim() ?? ''
  return { html: paragraph.outerHTML, extractor: 'innertext', siteExtractor: false }
}
