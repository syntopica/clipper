import { recordXTweets } from './record-x-tweets'

// Isolated-world side of the X capture pair: x-page-hook.ts relays GraphQL
// response bodies from the MAIN world via postMessage, and this script files
// the tweets it finds in them into the shared stash for capture time.
window.addEventListener('message', (event) => {
  if (event.source !== window) return
  recordXTweets(event.data)
})
