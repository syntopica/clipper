import type { GithubRequestError } from './github-request-error'

// How long GitHub asked us to wait, in milliseconds, or null when it did not
// say. `Retry-After` comes as seconds or as an HTTP date; an exhausted primary
// limit instead names the epoch second it resets at.
export function retryAfterMs(error: GithubRequestError, now: number = Date.now()): number | null {
  const retryAfter = error.headers.get('retry-after')
  if (retryAfter !== null) {
    const seconds = Number(retryAfter)
    if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000)
    const date = Date.parse(retryAfter)
    if (!Number.isNaN(date)) return Math.max(0, date - now)
  }
  if (error.headers.get('x-ratelimit-remaining') === '0') {
    const reset = Number(error.headers.get('x-ratelimit-reset'))
    if (Number.isFinite(reset) && reset > 0) return Math.max(0, reset * 1000 - now)
  }
  return null
}
