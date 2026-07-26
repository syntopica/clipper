import { readFileSync } from 'node:fs'
import { collectPageMetadata } from '../../src/content/collect-page-metadata'

test('reads title, author, published date, canonical and language', () => {
  const html = readFileSync('tests/fixtures/blog.html', 'utf8')
  const doc = new DOMParser().parseFromString(html, 'text/html')
  const meta = collectPageMetadata(doc, 'https://example.com/agents?utm_source=rss')

  expect(meta.title).toBe('Agents are just tools')
  expect(meta.author).toBe('Simon Willison')
  expect(meta.published).toBe('2026-07-20T09:00:00Z')
  expect(meta.canonicalUrl).toBe('https://example.com/agents')
  expect(meta.language).toBe('en')
  expect(meta.site).toBe('example.com')
})

test('falls back to the hostname when the page has no title', () => {
  const doc = new DOMParser().parseFromString('<html><head></head><body></body></html>', 'text/html')
  const meta = collectPageMetadata(doc, 'https://example.com/a')
  expect(meta.title).toBe('example.com')
})
