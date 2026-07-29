import { toXTweet } from './to-x-tweet'
import type { XTweet } from './x-tweet'

// A full recursive walk instead of endpoint-specific paths: X reshapes and
// renames its GraphQL envelopes (TweetDetail, TweetResultByRestId, timeline
// modules, TweetWithVisibilityResults wrappers) far more often than the tweet
// entity itself, and a walk keyed on the entity signature survives all of that.
export function extractXTweets(root: unknown): XTweet[] {
  const tweets: XTweet[] = []
  const visit = (node: unknown): void => {
    if (Array.isArray(node)) {
      node.forEach(visit)
      return
    }
    if (!node || typeof node !== 'object') return
    const record = node as Record<string, unknown>
    const tweet = toXTweet(record)
    if (tweet) tweets.push(tweet)
    Object.values(record).forEach(visit)
  }
  visit(root)
  return tweets
}
