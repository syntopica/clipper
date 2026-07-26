import { normalizeUrl } from '../../src/shared/normalize-url'

test('strips utm and known tracking params, and the fragment', () => {
  expect(normalizeUrl('https://example.com/a?utm_source=rss&gclid=1&keep=1#frag')).toBe(
    'https://example.com/a?keep=1',
  )
})

test('strips user:password userinfo before it reaches git', () => {
  expect(normalizeUrl('https://user:secret@example.com/a')).toBe('https://example.com/a')
})
