// Chrome stops an idle extension service worker after 30 seconds, and only
// events and extension API calls reset that timer - an outstanding `fetch`
// does not. A commit over a slow connection could outlive the worker, losing
// the clip and leaving the badge on `...`. While `work` runs, a cheap
// extension API call every 20 seconds keeps the worker counted as active.
// Bounded by the work itself: the interval is cleared however it ends.
const KEEPALIVE_INTERVAL_MS = 20_000

export async function withKeepalive<T>(work: () => Promise<T>): Promise<T> {
  const timer = setInterval(() => {
    void chrome.runtime.getPlatformInfo().catch(() => undefined)
  }, KEEPALIVE_INTERVAL_MS)
  try {
    return await work()
  } finally {
    clearInterval(timer)
  }
}
