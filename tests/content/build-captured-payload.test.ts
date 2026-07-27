import { readFileSync } from 'node:fs'
import { buildCapturedPayload } from '../../src/content/build-captured-payload'

function docFrom(fixture: string, url: string): Document {
  const html = readFileSync(`tests/fixtures/${fixture}`, 'utf8')
  const doc = new DOMParser().parseFromString(html, 'text/html')
  Object.defineProperty(doc, 'baseURI', { value: url, configurable: true })
  return doc
}

test('captures a normal article through Defuddle', async () => {
  const doc = docFrom('blog.html', 'https://example.com/agents')
  const payload = await buildCapturedPayload(doc, window, 'https://example.com/agents')

  expect(payload.type).toBe('clip-captured')
  expect(payload.extractor).toBe('defuddle')
  expect(payload.markdown).toContain('First paragraph')
  expect(payload.page.title).toBe('Agents are just tools')
})

test('absolutizes a relative link on a non-Defuddle branch', async () => {
  const doc = new DOMParser().parseFromString(
    '<html lang="en"><body><article><p>short <a href="/x">link</a></p></article></body></html>',
    'text/html',
  )
  Object.defineProperty(doc, 'baseURI', { value: 'https://example.com/blog/post', configurable: true })

  const payload = await buildCapturedPayload(doc, window, 'https://example.com/blog/post')

  expect(payload.extractor).toBe('article')
  expect(payload.markdown).toContain('https://example.com/x')
})
