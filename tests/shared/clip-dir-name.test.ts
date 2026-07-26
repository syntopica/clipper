import { clipDirName } from '../../src/shared/clip-dir-name'
import { LIMITS } from '../../src/shared/limits'

const base = {
  clippedAt: '2026-07-26T14:03:11Z',
  site: 'simonwillison.net',
  title: 'Agents are just tools',
  clipId: '01J3ABCDEF123456789ABCDEFG',
}

test('builds date, site, title and id suffix', () => {
  expect(clipDirName(base)).toBe(
    '2026-07-26-simonwillison-net-agents-are-just-tools-01j3abcd',
  )
})

test('truncates the title so the leaf fits the cap, keeping the id suffix', () => {
  const name = clipDirName({ ...base, title: 'x'.repeat(400) })
  expect(name.length).toBeLessThanOrEqual(LIMITS.MAX_DIR_NAME_CHARS)
  expect(name.endsWith('-01j3abcd')).toBe(true)
})
