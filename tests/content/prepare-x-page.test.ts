import Defuddle from 'defuddle/full'
import { prepareXPage } from '../../src/content/prepare-x-page'
import { xTweetStash } from '../../src/content/x-tweet-stash'
import type { XTweet } from '../../src/content/x-tweet'

const FOCAL_URL = 'https://x.com/cam/status/100'

function tweet(partial: Partial<XTweet> & { id: string; text: string }): XTweet {
  return {
    authorHandle: 'cam',
    authorName: 'Cameron',
    createdAt: '2026-04-17T13:30:12.000Z',
    inReplyToId: null,
    lang: 'en',
    ...partial,
  }
}

// A conversation page the way X renders it: the focal tweet's timestamp has no
// permalink, every other tweet's does. Tweet 102 is truncated behind a
// "Show more" link; tweet 101 was virtualized out of the DOM entirely.
function conversationDoc(): Document {
  return new DOMParser().parseFromString(
    `<html lang="es"><head><title>(16) Cameron on X</title></head><body>
      <div data-testid="cellInnerDiv">
        <article data-testid="tweet">
          <div data-testid="User-Name">
            <a href="/cam">Cameron</a><a href="/cam">@cam</a>
            <time datetime="2026-04-17T13:30:12.000Z">Apr 17</time>
          </div>
          <div data-testid="tweetText">the thread root</div>
        </article>
      </div>
      <div data-testid="cellInnerDiv">
        <article data-testid="tweet">
          <div data-testid="User-Name">
            <a href="/cam">Cameron</a><a href="/cam">@cam</a>
            <a href="/cam/status/102"><time datetime="2026-04-17T13:30:20.000Z">Apr 17</time></a>
          </div>
          <div data-testid="tweetText">worth about…</div>
          <div data-testid="tweet-text-show-more-link">Show more</div>
        </article>
      </div>
    </body></html>`,
    'text/html',
  )
}

beforeEach(() => {
  xTweetStash().clear()
})

test('a non-x page or an empty stash is a no-op', () => {
  const doc = conversationDoc()
  expect(prepareXPage(doc, 'https://example.com/a')).toBeNull()
  expect(prepareXPage(doc, FOCAL_URL)).toBeNull()
  expect(doc.querySelector('[data-testid="tweet-text-show-more-link"]')).not.toBeNull()
})

test('restores truncated text, reinserts the missing tweet, returns the focal tweet', () => {
  const stash = xTweetStash()
  stash.set('100', tweet({ id: '100', text: 'the thread root' }))
  stash.set('101', tweet({ id: '101', text: 'the tweet x never rendered', inReplyToId: '100' }))
  stash.set('102', tweet({ id: '102', text: 'worth about $40K a month', inReplyToId: '101' }))

  const doc = conversationDoc()
  const focal = prepareXPage(doc, FOCAL_URL)

  expect(focal?.id).toBe('100')
  const texts = Array.from(doc.querySelectorAll('[data-testid="tweetText"]')).map(
    (el) => el.textContent,
  )
  expect(texts).toEqual([
    'the thread root',
    'the tweet x never rendered',
    'worth about $40K a month',
  ])
  expect(doc.querySelector('[data-testid="tweet-text-show-more-link"]')).toBeNull()
})

test('a repaired conversation flows through Defuddle as one thread', async () => {
  const stash = xTweetStash()
  stash.set('100', tweet({ id: '100', text: 'the thread root' }))
  stash.set('101', tweet({ id: '101', text: 'the tweet x never rendered', inReplyToId: '100' }))
  stash.set('102', tweet({ id: '102', text: 'worth about $40K a month', inReplyToId: '101' }))

  const doc = conversationDoc()
  prepareXPage(doc, FOCAL_URL)

  const parsed = new Defuddle(doc, { url: FOCAL_URL }).parse()
  expect(parsed.content).toContain('the thread root')
  expect(parsed.content).toContain('the tweet x never rendered')
  expect(parsed.content).toContain('worth about $40K a month')
})

test('replies by other authors are not injected into the thread', () => {
  const stash = xTweetStash()
  stash.set('100', tweet({ id: '100', text: 'the thread root' }))
  stash.set(
    '200',
    tweet({ id: '200', text: 'a reply', authorHandle: 'someoneelse', inReplyToId: '100' }),
  )

  const doc = conversationDoc()
  prepareXPage(doc, FOCAL_URL)

  expect(doc.body.textContent).not.toContain('a reply')
})
