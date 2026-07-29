import type { CapturedPagePayload } from '../background/handle-captured-page'
import { byteLength } from '../shared/byte-length'
import { LIMITS } from '../shared/limits'
import { appendDroppedLinks } from './append-dropped-links'
import { applyXPageMetadata } from './apply-x-page-metadata'
import { collectPageMetadata } from './collect-page-metadata'
import { droppedContentLinks } from './dropped-content-links'
import { extractContent } from './extract-content'
import { getSelectionHtml } from './get-selection-html'
import { prepareXPage } from './prepare-x-page'
import { resolveUrls } from './resolve-urls'
import { sanitizeHtml } from './sanitize-html'
import { toMarkdown } from './to-markdown'

export async function buildCapturedPayload(
  doc: Document,
  win: Window,
  url: string,
): Promise<CapturedPagePayload> {
  // Before extraction: on X pages, restore full text and missing thread
  // tweets from the GraphQL stash the collector content script has been
  // filling since document_start.
  const focalTweet = prepareXPage(doc, url)

  const selectionHtml = getSelectionHtml(win)
  const extracted = await extractContent(doc, selectionHtml)

  // Defuddle already absolutizes hrefs/srcs internally; every other
  // extraction branch reads innerHTML straight off the live DOM and keeps
  // relative urls as authored, so only those need resolving here.
  const resolvedHtml =
    extracted.extractor === 'defuddle' ? extracted.html : resolveUrls(extracted.html, doc.baseURI)
  const cleanExtracted = sanitizeHtml(resolvedHtml)

  const wholePage = sanitizeHtml(doc.documentElement.outerHTML)
  const fitsWholePage = byteLength(wholePage) <= LIMITS.MAX_SOURCE_HTML_BYTES

  const recovered = droppedContentLinks(doc, cleanExtracted, doc.baseURI)

  return {
    type: 'clip-captured',
    url,
    markdown: appendDroppedLinks(toMarkdown(cleanExtracted), recovered),
    sourceHtml: fitsWholePage ? wholePage : cleanExtracted,
    snapshotMode: fitsWholePage ? 'sanitized' : 'extracted',
    extractor: extracted.extractor,
    siteExtractor: extracted.siteExtractor,
    page: applyXPageMetadata(collectPageMetadata(doc, url), focalTweet),
  }
}
