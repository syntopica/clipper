import { readFileSync } from 'node:fs'
import { extractContent } from '../../src/content/extract-content'

function docFrom(fixture: string): Document {
  const html = readFileSync(`tests/fixtures/${fixture}`, 'utf8')
  return new DOMParser().parseFromString(html, 'text/html')
}

test('a selection wins over everything else', () => {
  const result = extractContent(docFrom('blog.html'), '<p>picked text</p>')
  expect(result.extractor).toBe('selection')
  expect(result.html).toContain('picked text')
})

test('a normal article goes through Readability and drops nav and footer', () => {
  const result = extractContent(docFrom('blog.html'), null)
  expect(result.extractor).toBe('readability')
  expect(result.html).toContain('First paragraph')
  expect(result.html).not.toContain('About')
  expect(result.html).not.toContain('Copyright 2026')
})

test('a page Readability rejects falls further down the chain', () => {
  const result = extractContent(docFrom('spa-shell.html'), null)
  expect(result.extractor).toBe('body')
  expect(result.html).toContain('Loading dashboard data')
})

test('extraction does not mutate the source document', () => {
  const doc = docFrom('blog.html')
  const script = doc.createElement('script')
  script.textContent = 'window.tracked = true'
  doc.body.appendChild(script)

  extractContent(doc, null)

  expect(doc.querySelector('nav')).not.toBeNull()
  expect(doc.querySelector('script')).not.toBeNull()
})

test('falls back to article when Readability rejects the page', () => {
  const doc = new DOMParser().parseFromString(
    '<html lang="en"><body><article><p>short</p></article></body></html>',
    'text/html',
  )
  const result = extractContent(doc, null)
  expect(result.extractor).toBe('article')
  expect(result.html).toContain('short')
})

test('falls back to main when there is no article', () => {
  const doc = new DOMParser().parseFromString(
    '<html lang="en"><body><main><p>short</p></main></body></html>',
    'text/html',
  )
  expect(extractContent(doc, null).extractor).toBe('main')
})

test('falls back to innertext when the body has only text', () => {
  const doc = new DOMParser().parseFromString('<html lang="en"><body></body></html>', 'text/html')
  doc.body.textContent = 'bare text'
  const result = extractContent(doc, null)
  expect(result.extractor).toBe('innertext')
  expect(result.html).toContain('bare text')
})
