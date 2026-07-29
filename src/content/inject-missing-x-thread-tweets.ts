import { buildXTweetCell } from './build-x-tweet-cell'
import { xArticleTweetId } from './x-article-tweet-id'
import type { XTweet } from './x-tweet'

// Threads longer than this are not a self-thread being clipped, they are a
// runaway reply chain; the cap only exists to bound a malformed stash.
const MAX_THREAD_LENGTH = 100

/**
 * Rebuild the author's self-thread below the focal tweet, inserting a
 * synthetic cell for every tweet X's virtualized timeline never put in the
 * DOM. The chain is walked through `inReplyToId` links restricted to the
 * focal author, which is exactly the definition of "thread" that Defuddle's
 * twitter extractor classifies as post content.
 */
export function injectMissingXThreadTweets(
  doc: Document,
  stash: ReadonlyMap<string, XTweet>,
  focalId: string,
): number {
  const focal = stash.get(focalId)
  if (!focal?.authorHandle) return 0

  // First self-reply to each tweet; ties broken by lowest id = earliest post.
  // Ids are compared as numeric strings (length, then lexicographic) rather
  // than BigInt so a malformed id degrades the ordering, not the capture.
  const earlier = (a: string, b: string): boolean =>
    a.length === b.length ? a < b : a.length < b.length
  const childByParent = new Map<string, XTweet>()
  for (const tweet of stash.values()) {
    if (tweet.authorHandle !== focal.authorHandle || !tweet.inReplyToId) continue
    const current = childByParent.get(tweet.inReplyToId)
    if (!current || earlier(tweet.id, current.id)) {
      childByParent.set(tweet.inReplyToId, tweet)
    }
  }

  const articles = Array.from(doc.querySelectorAll('article[data-testid="tweet"]'))
  const articleById = new Map<string, Element>()
  for (const article of articles) {
    const id = xArticleTweetId(article)
    if (id) articleById.set(id, article)
  }
  // The focal article renders its timestamp without a permalink - it is the
  // first article precisely when the page is that tweet's own status page.
  const focalArticle = articles[0] && !xArticleTweetId(articles[0]) ? articles[0] : null

  const cellOf = (element: Element): Element =>
    element.closest('[data-testid="cellInnerDiv"]') ?? element

  let anchor = articleById.get(focalId) ?? focalArticle
  if (!anchor) return 0
  let anchorCell = cellOf(anchor)

  let injected = 0
  let current = focal
  for (let step = 0; step < MAX_THREAD_LENGTH; step++) {
    const next = childByParent.get(current.id)
    if (!next) break
    const rendered = articleById.get(next.id)
    if (rendered) {
      anchorCell = cellOf(rendered)
    } else {
      const cell = buildXTweetCell(doc, next)
      anchorCell.after(cell)
      anchorCell = cell
      injected++
    }
    current = next
  }
  return injected
}
