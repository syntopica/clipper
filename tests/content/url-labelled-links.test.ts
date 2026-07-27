import { readFileSync } from 'node:fs'
import { buildCapturedPayload } from '../../src/content/build-captured-payload'
import { extractContent } from '../../src/content/extract-content'

// Modelled on the X post that surfaced the bug: each list item carries its label
// as text and the target as a separate, url-labelled anchor. Readability judges
// those anchor nodes to be mostly links and deletes them outright, so the clip
// keeps "Anthropic official skills repo -" and loses the url it pointed at.
const PAGE_URL = 'https://x.com/polydao/status/1'

function docFrom(fixture: string, url: string): Document {
  const html = readFileSync(`tests/fixtures/${fixture}`, 'utf8')
  const doc = new DOMParser().parseFromString(html, 'text/html')
  Object.defineProperty(doc, 'baseURI', { value: url, configurable: true })
  return doc
}

test('the extractor really does drop these links - the premise of the fix', () => {
  const extracted = extractContent(docFrom('url-labelled-links.html', PAGE_URL), null)

  expect(extracted.extractor).toBe('readability')
  expect(extracted.html).toContain('Anthropic official skills repo')
  expect(extracted.html).not.toContain('github.com')
})

test('a clip of that page carries every dropped link, absolutized', () => {
  const doc = docFrom('url-labelled-links.html', PAGE_URL)
  const payload = buildCapturedPayload(doc, window, PAGE_URL)

  expect(payload.extractor).toBe('readability')
  expect(payload.markdown).toContain('## Links removed by the extractor')
  expect(payload.markdown).toContain('- <https://github.com/anthropics/skills>')
  expect(payload.markdown).toContain('- <https://github.com/travisvn/awesome-claude-skills>')
  expect(payload.markdown).toContain('- <https://github.com/BehiSecc/awesome-claude-skills>')
  expect(payload.markdown).toContain('- <https://github.com/VoltAgent/awesome-agent-skills>')

  // The body itself is untouched: the extractor still wins, it just stops
  // taking the payload with it.
  expect(payload.markdown).toContain('Anthropic official skills repo')
})

test('an ordinary article gains no section', () => {
  const doc = docFrom('blog.html', 'https://example.com/agents')
  const payload = buildCapturedPayload(doc, window, 'https://example.com/agents')

  expect(payload.markdown).not.toContain('Links removed by the extractor')
})
