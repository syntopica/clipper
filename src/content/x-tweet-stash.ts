import type { XTweet } from './x-tweet'

const STASH_KEY = '__brainClipperXTweetStash'

// The collector content script and the capture script are separate bundles
// injected at different times, but they share the extension's isolated world -
// a window global is the only channel between them that needs no messaging.
export function xTweetStash(): Map<string, XTweet> {
  const host = globalThis as { [STASH_KEY]?: Map<string, XTweet> }
  host[STASH_KEY] ??= new Map()
  return host[STASH_KEY]
}
