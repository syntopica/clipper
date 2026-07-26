import { readCanonicalUrl } from '../../src/content/read-canonical-url'

function docWithCanonical(href: string | null): Document {
  const doc = new DOMParser().parseFromString('<html><head></head><body></body></html>', 'text/html')
  if (href !== null) {
    const link = doc.createElement('link')
    link.setAttribute('rel', 'canonical')
    link.setAttribute('href', href)
    doc.head.appendChild(link)
  }
  return doc
}

test('resolves a relative canonical href against the page url', () => {
  const doc = docWithCanonical('/agents')
  expect(readCanonicalUrl(doc, 'https://example.com/blog/post?x=1')).toBe('https://example.com/agents')
})

test('keeps an already-absolute canonical href as-is', () => {
  const doc = docWithCanonical('https://example.com/agents')
  expect(readCanonicalUrl(doc, 'https://example.com/blog/post')).toBe('https://example.com/agents')
})

test('returns null when there is no canonical link', () => {
  const doc = docWithCanonical(null)
  expect(readCanonicalUrl(doc, 'https://example.com/blog/post')).toBeNull()
})

test('degrades to null instead of throwing on an unparseable href', () => {
  const doc = docWithCanonical('https://')
  expect(readCanonicalUrl(doc, 'https://example.com/blog/post')).toBeNull()
})
