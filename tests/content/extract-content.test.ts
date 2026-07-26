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
  expect(['body', 'innertext']).toContain(result.extractor)
  expect(result.html).toContain('Loading dashboard data')
})

test('extraction does not mutate the source document', () => {
  const doc = docFrom('blog.html')
  extractContent(doc, null)
  expect(doc.querySelector('nav')).not.toBeNull()
})
