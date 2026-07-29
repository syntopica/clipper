import { X_GRAPHQL_MESSAGE_SOURCE } from '../shared/x-graphql-message-source'
import { extractXTweets } from './extract-x-tweets'
import { xTweetStash } from './x-tweet-stash'

interface RelayedMessage {
  source?: unknown
  body?: unknown
}

/**
 * Feed one relayed GraphQL response body into the tweet stash.
 *
 * Merge rule: keep the longer text. A TweetDetail response carries the full
 * note text, and a later timeline response for the same tweet carries only the
 * 280-char preview - last-write-wins would silently re-truncate it.
 */
export function recordXTweets(data: unknown): void {
  const message = data as RelayedMessage
  if (message?.source !== X_GRAPHQL_MESSAGE_SOURCE || typeof message.body !== 'string') return

  let parsed: unknown
  try {
    parsed = JSON.parse(message.body)
  } catch {
    return
  }

  const stash = xTweetStash()
  for (const tweet of extractXTweets(parsed)) {
    const existing = stash.get(tweet.id)
    if (existing && existing.text.length >= tweet.text.length) continue
    stash.set(tweet.id, tweet)
  }
}
