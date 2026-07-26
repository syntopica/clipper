import { slugify } from '../../src/shared/slugify'

test('lowercases, strips accents and collapses separators', () => {
  expect(slugify('Agents Are Just Tools!')).toBe('agents-are-just-tools')
  expect(slugify('  Cafe  con  leche  ')).toBe('cafe-con-leche')
  expect(slugify('Espana / Portugal')).toBe('espana-portugal')
})

test('returns an empty string for input with no alphanumerics', () => {
  expect(slugify('***')).toBe('')
})
