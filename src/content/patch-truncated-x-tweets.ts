import { xArticleTweetId } from './x-article-tweet-id'
import type { XTweet } from './x-tweet'

/**
 * Replace the text of every truncated tweet in the DOM with the full text from
 * the stash, and drop the now-lying "Show more" link. Articles whose id cannot
 * be resolved or that the stash has never seen are left as rendered - a
 * truncated tweet in the clip beats a wrong one.
 *
 * Setting textContent flattens the rich spans (emoji images, hashtag links)
 * inside `tweetText`; the stash text already carries emoji as characters and
 * links as expanded urls, so nothing readable is lost.
 */
export function patchTruncatedXTweets(
  doc: Document,
  stash: ReadonlyMap<string, XTweet>,
  focalId: string | null,
): number {
  let patched = 0
  const articles = Array.from(doc.querySelectorAll('article[data-testid="tweet"]'))
  for (const article of articles) {
    const showMore = article.querySelector('[data-testid="tweet-text-show-more-link"]')
    if (!showMore) continue
    // Only the first article may be the focal tweet, whose timestamp has no
    // permalink to read the id from.
    const id = xArticleTweetId(article) ?? (article === articles[0] ? focalId : null)
    const tweet = id ? stash.get(id) : undefined
    const textElement = article.querySelector('[data-testid="tweetText"]')
    if (!tweet || !textElement) continue
    textElement.textContent = tweet.text
    showMore.remove()
    patched++
  }
  return patched
}
