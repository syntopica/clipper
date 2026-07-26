import { load } from 'js-yaml'
import { buildFrontmatter } from '../../src/shared/build-frontmatter'
import type { ClipMetadata } from '../../src/shared/clip-metadata-schema'

const metadata = {
  schema_version: 1,
  clip_id: '01J3ABCDEF123456789ABCDEFG',
  title: 'Why: "agents" are tools - a note\non two lines',
  url: 'https://example.com/a',
  normalized_url: 'https://example.com/a',
  canonical_url: null,
  site: 'example.com',
  author: null,
  published: null,
  language: 'en',
  clipped_at: '2026-07-26T14:03:11Z',
  clipped_from: 'mac-cristian',
  extension_version: '0.1.0',
  extractor: 'readability',
  extractor_version: '0.6.0',
  snapshot_mode: 'sanitized',
  sensitivity: 'public',
  content_sha256: 'a'.repeat(64),
  source_html_sha256: 'b'.repeat(64),
  asset_count: 0,
  asset_failures: [],
  note: '',
  tags: [],
  word_count: 12,
} satisfies ClipMetadata

test('a hostile title still round-trips as valid YAML', () => {
  const block = buildFrontmatter(metadata)
  const body = block.replace(/^---\n/, '').replace(/---\n$/, '')
  const parsed = load(body) as ClipMetadata
  expect(parsed.title).toBe(metadata.title)
  expect(parsed.clip_id).toBe(metadata.clip_id)
})

test('the block is delimited and ends with a newline', () => {
  const block = buildFrontmatter(metadata)
  expect(block.startsWith('---\n')).toBe(true)
  expect(block.endsWith('---\n')).toBe(true)
})
