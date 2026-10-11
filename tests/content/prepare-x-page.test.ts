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

// Links inside tweet text exactly as clip brain-clips@3e94315 captured them:
// hidden `https://`, a cut display text, the href path hidden after it, `…`.
function linkedTweetDoc(): Document {
  const hidden = (text: string) => `<span aria-hidden="true">${text}</span>`
  const doc = new DOMParser().parseFromString(
    `<html lang="en"><head><title>Miles on X</title></head><body>
      <div data-testid="cellInnerDiv">
        <article data-testid="tweet">
          <div data-testid="User-Name"><a href="/milesdeutscher">Miles</a><a href="/milesdeutscher">@milesdeutscher</a>
            <time datetime="2024-03-25T10:00:00.000Z">Mar 25</time></div>
          <div data-testid="tweetText"><span>1. 90% of people are better off holding vs trading. </span><a dir="ltr" href="/GCRClassic/status/1621990690304442370" role="link">${hidden('https://')}x.com/GCRClassic/sta${hidden('/GCRClassic/status/1621990690304442370')}${hidden('…')}</a>
7. Add to your winners. <a dir="ltr" href="/1484112393361891328/status/1615351201263927296" role="link">${hidden('https://')}x.com/14841123933618${hidden('/1484112393361891328/status/1615351201263927296')}${hidden('…')}</a>
More: <a href="https://t.co/abc123" role="link">${hidden('https://')}example.com/a/very/lon${hidden('g/path?x=1')}${hidden('…')}</a> by <a href="/GCRClassic" role="link">@GCRClassic</a> <a href="/hashtag/btc" role="link">#btc</a></div>
        </article>
      </div></body></html>`,
    'text/html',
  )
  Object.defineProperty(doc, 'baseURI', { value: 'https://x.com/milesdeutscher/status/1772336684472090856' })
  return doc
}

test('links in tweet text come out as the URL they open, even with no stash', async () => {
  const doc = linkedTweetDoc()
  const url = 'https://x.com/milesdeutscher/status/1772336684472090856'
  expect(prepareXPage(doc, url)).toBeNull()

  const content = new Defuddle(doc, { url }).parse().content
  expect(content).toContain('trading. https://x.com/GCRClassic/status/1621990690304442370')
  expect(content).toContain('winners. https://x.com/1484112393361891328/status/1615351201263927296')
  expect(content).toContain('More: https://example.com/a/very/long/path?x=1 by @GCRClassic #btc')
  expect(content).not.toMatch(/sta\/GCRClassic|14841123933618\/|…/)
})
