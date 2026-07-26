import { resolveUrls } from '../../src/content/resolve-urls'

const BASE = 'https://example.com/blog/post'

test('absolutizes a relative href', () => {
  const html = '<a href="/agents">agents</a>'
  expect(resolveUrls(html, BASE)).toContain('href="https://example.com/agents"')
})

test('absolutizes a relative src', () => {
  const html = '<img src="../images/cat.png">'
  expect(resolveUrls(html, BASE)).toContain('src="https://example.com/images/cat.png"')
})

test('absolutizes every candidate in a srcset, keeping the width/density descriptors', () => {
  const html = '<img srcset="/small.png 480w, ../big.png 1024w">'
  const resolved = resolveUrls(html, BASE)
  expect(resolved).toContain('https://example.com/small.png 480w')
  expect(resolved).toContain('https://example.com/big.png 1024w')
})

test('leaves an already-absolute href untouched', () => {
  const html = '<a href="https://other.example/x">x</a>'
  expect(resolveUrls(html, BASE)).toContain('href="https://other.example/x"')
})

test('leaves a non-http scheme like mailto alone', () => {
  const html = '<a href="mailto:a@b.test">mail</a>'
  expect(resolveUrls(html, BASE)).toContain('href="mailto:a@b.test"')
})

test('is a no-op for html with no url-bearing attributes', () => {
  const html = '<p>plain text</p>'
  expect(resolveUrls(html, BASE)).toBe(html)
})
