import { isXHost } from '../shared/is-x-host'
import { injectMissingXThreadTweets } from './inject-missing-x-thread-tweets'
import { patchTruncatedXTweets } from './patch-truncated-x-tweets'
import { spellOutXTweetLinks } from './spell-out-x-tweet-links'
import { xTweetStash } from './x-tweet-stash'
import type { XTweet } from './x-tweet'

/**
 * On an X page, repair the DOM before extraction runs: spell out every link in
 * tweet text as the URL it opens, then, from the tweet stash, fill in truncated
 * tweet text and re-insert thread tweets the virtualized timeline dropped. Returns the focal tweet when the page is a status page and
 * the stash knows it, for the metadata overrides downstream.
 *
 * Deliberately mutates the live document: the whole-page snapshot then also
 * carries the repaired thread, and the user can see in the tab exactly what
 * got clipped.
 *
 * A no-op (null) on other hostnames. Without a stash (a page loaded before the
 * extension existed) or off a status page, only the links are repaired.
 */
export function prepareXPage(doc: Document, url: string): XTweet | null {
  let hostname: string
  try {
    hostname = new URL(url).hostname
  } catch {
    return null
  }
  if (!isXHost(hostname)) return null
  spellOutXTweetLinks(doc)

  const stash = xTweetStash()
  if (stash.size === 0) return null

  const focalId = url.match(/\/status\/(\d+)/)?.[1] ?? null
  patchTruncatedXTweets(doc, stash, focalId)
  if (!focalId) return null
  injectMissingXThreadTweets(doc, stash, focalId)
  return stash.get(focalId) ?? null
}
