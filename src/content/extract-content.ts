import { Readability } from '@mozilla/readability'

export type Extractor = 'selection' | 'readability' | 'article' | 'main' | 'body' | 'innertext'

export interface ExtractedContent {
  html: string
  extractor: Extractor
}

// Readability.parse() always returns an object, even for a near-empty shell
// page, wrapping whatever text it could find. A minimum text length rejects
// those trivial wrappers so the chain falls through to the DOM-shape steps
// below, which is more honest about extractors that found nothing real.
const MIN_READABILITY_TEXT_LENGTH = 100

export function extractContent(doc: Document, selectionHtml: string | null): ExtractedContent {
  if (selectionHtml) return { html: selectionHtml, extractor: 'selection' }

  const clone = doc.cloneNode(true) as Document
  const article = new Readability(clone).parse()
  if (article?.content && (article.textContent ?? '').trim().length >= MIN_READABILITY_TEXT_LENGTH) {
    return { html: article.content, extractor: 'readability' }
  }

  const articleEl = doc.querySelector('article')
  if (articleEl?.innerHTML.trim()) return { html: articleEl.innerHTML, extractor: 'article' }

  const mainEl = doc.querySelector('main, [role="main"]')
  if (mainEl?.innerHTML.trim()) return { html: mainEl.innerHTML, extractor: 'main' }

  const body = doc.body
  if (body?.innerHTML.trim()) return { html: body.innerHTML, extractor: 'body' }

  return { html: `<p>${doc.body?.textContent?.trim() ?? ''}</p>`, extractor: 'innertext' }
}
