import { readFileSync } from 'node:fs'
import { buildCapturedPayload } from '../../src/content/build-captured-payload'
import { extractContent } from '../../src/content/extract-content'

// Modelled on the X post that surfaced the bug: each list item carries its label
// as text and the target as a separate, url-labelled anchor. Readability judged
// those anchor nodes to be mostly links and deleted them outright, so the clip
// kept "Anthropic official skills repo -" and lost the url it pointed at, which
// is what the `## Links removed by the extractor` section exists to recover.
// Defuddle keeps the anchors, so this is now a regression test for the links
// surviving inline, where they belong, and for the recovery section staying
// out of the way when nothing was dropped.
const PAGE_URL = 'https://x.com/polydao/status/1'

function docFrom(fixture: string, url: string): Document {
  const html = readFileSync(`tests/fixtures/${fixture}`, 'utf8')
  const doc = new DOMParser().parseFromString(html, 'text/html')
  Object.defineProperty(doc, 'baseURI', { value: url, configurable: true })
  return doc
}

test('the extractor keeps url-labelled anchors instead of deleting them', () => {
  const extracted = extractContent(docFrom('url-labelled-links.html', PAGE_URL), null)

  expect(extracted.extractor).toBe('defuddle')
  expect(extracted.html).toContain('Anthropic official skills repo')
  expect(extracted.html).toContain('github.com/anthropics/skills')
})

test('a clip of that page carries every link inline, absolutized', () => {
  const doc = docFrom('url-labelled-links.html', PAGE_URL)
  const payload = buildCapturedPayload(doc, window, PAGE_URL)

  expect(payload.extractor).toBe('defuddle')
  expect(payload.markdown).toContain('https://github.com/anthropics/skills')
  expect(payload.markdown).toContain('https://github.com/travisvn/awesome-claude-skills')
  expect(payload.markdown).toContain('https://github.com/BehiSecc/awesome-claude-skills')
  expect(payload.markdown).toContain('https://github.com/VoltAgent/awesome-agent-skills')
  expect(payload.markdown).toContain('Anthropic official skills repo')
  expect(payload.markdown).not.toContain('Links removed by the extractor')
})

test('an ordinary article gains no section', () => {
  const doc = docFrom('blog.html', 'https://example.com/agents')
  const payload = buildCapturedPayload(doc, window, 'https://example.com/agents')

  expect(payload.markdown).not.toContain('Links removed by the extractor')
})
