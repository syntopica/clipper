import type { GithubRequestError } from './github-request-error'

// GitHub signals both its primary and its secondary rate limits with 403 as
// well as 429; a 403 is a rate limit only when the headers say so. Without that
// distinction a throttled burst would read as a revoked token.
export function isRateLimited(error: GithubRequestError): boolean {
  if (error.status === 429) return true
  if (error.status !== 403) return false
  return error.headers.has('retry-after') || error.headers.get('x-ratelimit-remaining') === '0'
}
