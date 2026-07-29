import { applyXPageMetadata } from '../../src/content/apply-x-page-metadata'
import type { PageMetadata } from '../../src/content/collect-page-metadata'
import type { XTweet } from '../../src/content/x-tweet'

const page: PageMetadata = {
  title: '(16) Cameron England en X: "Claude Code…" / X',
  author: null,
  published: null,
  canonicalUrl: 'https://x.com/cam/status/100',
  language: 'es',
  site: 'x.com',
}

const focal: XTweet = {
  id: '100',
  text: 'Claude Code made my businesses $80K in 90 days.',
  authorHandle: 'iamcamengland',
  authorName: 'Cameron England',
  createdAt: '2026-04-17T13:30:12.000Z',
  inReplyToId: null,
  lang: 'en',
}

test('without a focal tweet the metadata is untouched', () => {
  expect(applyXPageMetadata(page, null)).toEqual(page)
})

test('author, language and published come from the tweet, counter leaves the title', () => {
  const applied = applyXPageMetadata(page, focal)
  expect(applied.title).toBe('Cameron England en X: "Claude Code…" / X')
  expect(applied.author).toBe('@iamcamengland')
  expect(applied.language).toBe('en')
  expect(applied.published).toBe('2026-04-17T13:30:12.000Z')
})

test('tweet gaps fall back to the page values', () => {
  const applied = applyXPageMetadata(page, {
    ...focal,
    authorHandle: null,
    lang: null,
    createdAt: null,
  })
  expect(applied.author).toBeNull()
  expect(applied.language).toBe('es')
  expect(applied.published).toBeNull()
})
