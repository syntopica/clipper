import { byteLength } from '../shared/byte-length'
import { LIMITS } from '../shared/limits'
import { collectPageMetadata } from './collect-page-metadata'
import { extractContent } from './extract-content'
import { getSelectionHtml } from './get-selection-html'
import { sanitizeHtml } from './sanitize-html'
import { toMarkdown } from './to-markdown'

function capture(): void {
  const selectionHtml = getSelectionHtml(window)
  const extracted = extractContent(document, selectionHtml)
  const cleanExtracted = sanitizeHtml(extracted.html)

  const wholePage = sanitizeHtml(document.documentElement.outerHTML)
  const fitsWholePage = byteLength(wholePage) <= LIMITS.MAX_SOURCE_HTML_BYTES

  void chrome.runtime.sendMessage({
    type: 'clip-captured',
    url: location.href,
    markdown: toMarkdown(cleanExtracted),
    sourceHtml: fitsWholePage ? wholePage : cleanExtracted,
    snapshotMode: fitsWholePage ? 'sanitized' : 'extracted',
    extractor: extracted.extractor,
    page: collectPageMetadata(document, location.href),
  })
}

capture()
