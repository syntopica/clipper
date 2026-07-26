import { readCanonicalUrl } from './read-canonical-url'
import { readMetaContent } from './read-meta-content'

export interface PageMetadata {
  title: string
  author: string | null
  published: string | null
  canonicalUrl: string | null
  language: string | null
  site: string
}

export function collectPageMetadata(doc: Document, url: string): PageMetadata {
  const site = new URL(url).hostname
  return {
    // An empty title produces a title-less directory and a commit message
    // of just "Clip: " - fall back to the hostname rather than an empty
    // string.
    title: readMetaContent(doc, 'meta[property="og:title"]') ?? (doc.title.trim() || site),
    author:
      readMetaContent(doc, 'meta[name="author"]') ??
      readMetaContent(doc, 'meta[property="article:author"]'),
    published:
      readMetaContent(doc, 'meta[property="article:published_time"]') ??
      doc.querySelector('time[datetime]')?.getAttribute('datetime') ??
      null,
    canonicalUrl: readCanonicalUrl(doc, url),
    language: doc.documentElement.getAttribute('lang'),
    site,
  }
}
