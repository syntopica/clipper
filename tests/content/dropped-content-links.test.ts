import { appendDroppedLinks } from '../../src/content/append-dropped-links'
import { droppedContentLinks } from '../../src/content/dropped-content-links'
import { isUrlLikeText } from '../../src/content/is-url-like-text'

function pageWith(html: string, url = 'https://x.com/polydao/status/1'): Document {
  const doc = document.implementation.createHTMLDocument('t')
  doc.body.innerHTML = html
  const base = doc.createElement('base')
  base.href = url
  doc.head.appendChild(base)
  return doc
}

test('url-shaped anchor text is recognised, prose and numbers are not', () => {
  expect(isUrlLikeText('github.com/anthropics/skills')).toBe(true)
  expect(isUrlLikeText('https://github.com/anthropics/skills')).toBe(true)
  expect(isUrlLikeText('example.com')).toBe(true)

  expect(isUrlLikeText('Read more')).toBe(false)
  expect(isUrlLikeText('')).toBe(false)
  expect(isUrlLikeText('see github.com/x')).toBe(false)
  // The label before the first slash must be alphabetic, or a ratio reads as a host.
  expect(isUrlLikeText('3.5/10')).toBe(false)
  expect(isUrlLikeText('1.2/3')).toBe(false)
})

test('recovers a url-labelled link the extractor dropped, absolutizing it', () => {
  // Protocol-relative hrefs are what X actually serves.
  const doc = pageWith('<a href="//github.com/anthropics/skills">github.com/anthropics/skills</a>')

  expect(droppedContentLinks(doc, '<p>Anthropic official skills repo - </p>', doc.baseURI)).toEqual([
    { href: 'https://github.com/anthropics/skills', text: 'github.com/anthropics/skills' },
  ])
})

test('a link the extractor kept is not recovered twice', () => {
  const doc = pageWith('<a href="https://github.com/anthropics/skills">github.com/anthropics/skills</a>')
  const kept = '<p><a href="https://github.com/anthropics/skills">github.com/anthropics/skills</a></p>'

  expect(droppedContentLinks(doc, kept, doc.baseURI)).toEqual([])
})

test('a link kept in its authored, unresolved form is not recovered twice either', () => {
  const doc = pageWith('<a href="//github.com/anthropics/skills">github.com/anthropics/skills</a>')
  const kept = '<p><a href="//github.com/anthropics/skills">github.com/anthropics/skills</a></p>'

  expect(droppedContentLinks(doc, kept, doc.baseURI)).toEqual([])
})

test('navigation and prose-labelled links are left alone even when dropped', () => {
  const doc = pageWith(`
    <a href="/home">Home</a>
    <a href="/i/premium_sign_up">Subscribe to Premium</a>
    <a href="https://example.com/article">Read the full article</a>
  `)

  expect(droppedContentLinks(doc, '<p>body</p>', doc.baseURI)).toEqual([])
})

test('non-http schemes are refused', () => {
  const doc = pageWith(`
    <a href="mailto:info@example.com">example.com</a>
    <a href="javascript:alert(1)">example.com/x</a>
  `)

  expect(droppedContentLinks(doc, '<p>body</p>', doc.baseURI)).toEqual([])
})

test('the same target repeated across the page is recovered once', () => {
  const doc = pageWith(`
    <a href="//github.com/anthropics/skills">github.com/anthropics/skills</a>
    <a href="//github.com/anthropics/skills">github.com/anthropics/skills</a>
  `)

  expect(droppedContentLinks(doc, '<p>body</p>', doc.baseURI)).toHaveLength(1)
})

test('a pathological page cannot append an unbounded list', () => {
  const anchors = Array.from(
    { length: 250 },
    (_, i) => `<a href="https://example.com/${i}">example.com/${i}</a>`,
  ).join('')

  expect(droppedContentLinks(pageWith(anchors), '<p>body</p>', 'https://x.com/').length).toBe(100)
})

test('nothing is appended when nothing was dropped', () => {
  expect(appendDroppedLinks('# Title\n\nBody', [])).toBe('# Title\n\nBody')
})

test('recovered links are appended under a heading that names the cause', () => {
  const markdown = appendDroppedLinks('# Title\n\nBody', [
    { href: 'https://github.com/anthropics/skills', text: 'github.com/anthropics/skills' },
  ])

  expect(markdown).toBe(
    '# Title\n\nBody\n\n## Links removed by the extractor\n\n- <https://github.com/anthropics/skills>\n',
  )
})
