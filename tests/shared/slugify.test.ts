import { slugify } from '../../src/shared/slugify'

test('lowercases, strips accents and collapses separators', () => {
  expect(slugify('Agents Are Just Tools!')).toBe('agents-are-just-tools')
  expect(slugify('  Cafe  con  leche  ')).toBe('cafe-con-leche')
  expect(slugify('Espana / Portugal')).toBe('espana-portugal')
})

test('returns an empty string for input with no alphanumerics', () => {
  expect(slugify('***')).toBe('')
})

test('transliterates non-Latin titles instead of dropping them', () => {
  expect(slugify('Москва')).toBe('moskva')
  expect(slugify('Ελληνικά')).toBe('ellinika')
  expect(slugify('日本語のタイトル')).not.toBe('')
  expect(slugify('日本語のタイトル')).toMatch(/^[a-z0-9-]+$/)
})

test('an accented Latin title slugs as it did before', () => {
  expect(slugify('Café con leche, España')).toBe('cafe-con-leche-espana')
})
