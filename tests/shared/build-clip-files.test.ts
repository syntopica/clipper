import { readFileSync } from 'node:fs'
import { load } from 'js-yaml'
import { buildClipFiles } from '../../src/shared/build-clip-files'
import { sha256Hex } from '../../src/shared/sha256-hex'
import { normalizeMarkdown } from '../../src/shared/normalize-markdown'

const input = {
  clipId: '01J3ABCDEF123456789ABCDEFG',
  url: 'https://example.com/agents?utm_source=rss#section',
  markdown: '# Title\r\n\r\n\r\nBody text  \n',
  sourceHtml: '<p>Body text</p>',
  snapshotMode: 'sanitized' as const,
  extractor: 'defuddle' as const,
  extractorSite: null,
  page: {
    title: 'Agents are just tools',
    author: 'Simon Willison',
    published: '2026-07-20T09:00:00Z',
    canonicalUrl: 'https://example.com/agents',
    language: 'en',
    site: 'example.com',
  },
  clippedAt: '2026-07-26T14:03:11Z',
  clippedFrom: 'mac-cristian',
  extensionVersion: '0.1.0',
}

test('emits exactly the four clip files under a sharded pending path', async () => {
  const clip = await buildClipFiles(input)
  expect(clip.dirPath).toBe(
    'clips/pending/2026/07/2026-07-26-example-com-agents-are-just-tools-01j3abcd',
  )
  expect(Object.keys(clip.files).sort()).toEqual([
    `${clip.dirPath}/index.md`,
    `${clip.dirPath}/metadata.json`,
    `${clip.dirPath}/source.html`,
    `${clip.dirPath}/state.json`,
  ])
})

test('content_sha256 covers the normalized body only, not the frontmatter', async () => {
  const clip = await buildClipFiles(input)
  const expected = await sha256Hex(normalizeMarkdown(input.markdown))
  expect(clip.metadata.content_sha256).toBe(expected)

  const later = await buildClipFiles({ ...input, clippedAt: '2027-01-01T00:00:00Z' })
  expect(later.metadata.content_sha256).toBe(expected)
})

test('strips tracking parameters into normalized_url and keeps the original url', async () => {
  const clip = await buildClipFiles(input)
  expect(clip.metadata.url).toBe(input.url)
  expect(clip.metadata.normalized_url).toBe('https://example.com/agents')
})

test('index.md is frontmatter followed by the normalized body', async () => {
  const clip = await buildClipFiles(input)
  const indexMd = clip.files[`${clip.dirPath}/index.md`] as string
  const [frontmatter, rest] = indexMd.replace(/^---\n/, '').split('\n---\n')

  expect((load(frontmatter as string) as { title: string }).title).toBe('Agents are just tools')
  expect(rest).toBe(`\n${normalizeMarkdown(input.markdown)}`)
})

test('state.json starts as pending with no failure and no brain commit', async () => {
  const clip = await buildClipFiles(input)
  const state = JSON.parse(clip.files[`${clip.dirPath}/state.json`] as string)
  expect(state).toEqual({
    status: 'pending',
    updatedAt: '2026-07-26T14:03:11Z',
    failure: null,
    brainCommit: null,
  })
})

test('rejects a clip whose markdown exceeds the cap', async () => {
  await expect(
    buildClipFiles({ ...input, markdown: 'x'.repeat(1_000_000) }),
  ).rejects.toThrow(/markdown/i)
})

test('drops an oversized source.html instead of throwing, keeping the markdown', async () => {
  const clip = await buildClipFiles({ ...input, sourceHtml: '<p>' + 'x'.repeat(1_000_000) + '</p>' })

  expect(clip.metadata.snapshot_mode).toBe('omitted')
  expect(Object.keys(clip.files).sort()).toEqual([
    `${clip.dirPath}/index.md`,
    `${clip.dirPath}/metadata.json`,
    `${clip.dirPath}/state.json`,
  ])
  const indexMd = clip.files[`${clip.dirPath}/index.md`] as string
  expect(indexMd).toContain('Body text')
})

test('extractor_version is set only for defuddle, read from the installed package', async () => {
  const defuddlePackage = JSON.parse(
    readFileSync('node_modules/defuddle/package.json', 'utf8'),
  ) as { version: string }
  const defuddleClip = await buildClipFiles(input)
  expect(defuddleClip.metadata.extractor_version).toBe(defuddlePackage.version)

  const articleClip = await buildClipFiles({ ...input, extractor: 'article' })
  expect(articleClip.metadata.extractor_version).toBeNull()
})

test('the site-specific extractor behind a defuddle extraction is recorded', async () => {
  const clip = await buildClipFiles({ ...input, extractorSite: 'twitter' })
  expect(clip.metadata.extractor_site).toBe('twitter')
})
