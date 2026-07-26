import { toMarkdown } from '../../src/content/to-markdown'

test('converts headings, links and lists', () => {
  const md = toMarkdown('<h1>Title</h1><p>See <a href="https://x.test">x</a>.</p><ul><li>one</li></ul>')
  expect(md).toContain('# Title')
  expect(md).toContain('[x](https://x.test)')
  expect(md).toContain('-   one')
})

test('converts GFM tables', () => {
  const md = toMarkdown('<table><tr><th>a</th></tr><tr><td>1</td></tr></table>')
  expect(md).toContain('| a |')
})
