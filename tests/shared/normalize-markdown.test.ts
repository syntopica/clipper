import { normalizeMarkdown } from '../../src/shared/normalize-markdown'

test('normalizes line endings, trailing spaces and blank runs', () => {
  expect(normalizeMarkdown('a  \r\n\r\n\r\n\r\nb   ')).toBe('a\n\nb\n')
})

test('is idempotent', () => {
  const once = normalizeMarkdown('# Title\r\n\r\n\r\ntext  \n')
  expect(normalizeMarkdown(once)).toBe(once)
})
