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
  return {
    title: readMetaContent(doc, 'meta[property="og:title"]') ?? doc.title.trim(),
    author:
      readMetaContent(doc, 'meta[name="author"]') ??
      readMetaContent(doc, 'meta[property="article:author"]'),
    published:
      readMetaContent(doc, 'meta[property="article:published_time"]') ??
      doc.querySelector('time[datetime]')?.getAttribute('datetime') ??
      null,
    canonicalUrl: doc.querySelector('link[rel="canonical"]')?.getAttribute('href') ?? null,
    language: doc.documentElement.getAttribute('lang'),
    site: new URL(url).hostname,
  }
}
