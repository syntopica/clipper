import { clipPath } from '../../src/shared/clip-path'

test('shards pending clips by capture year and month', () => {
  expect(clipPath({ clippedAt: '2026-07-26T14:03:11Z', dirName: 'a-b-c' })).toBe(
    'clips/pending/2026/07/a-b-c',
  )
})
