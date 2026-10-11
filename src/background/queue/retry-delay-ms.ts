import { GithubRequestError } from '../github-request-error'
import { retryAfterMs } from '../retry-after-ms'

const BASE_MS = 30_000
const MAX_MS = 60 * 60 * 1000

// When a transiently failed job is tried again: what GitHub asked for when it
// said, otherwise 30s doubling per attempt, capped at an hour. Chrome fires an
// alarm no sooner than 30s, which is why the base is not lower.
export function retryDelayMs(error: unknown, attemptCount: number, now: number = Date.now()): number {
  const asked = error instanceof GithubRequestError ? retryAfterMs(error, now) : null
  const computed = Math.min(MAX_MS, BASE_MS * 2 ** Math.max(0, attemptCount - 1))
  return Math.max(BASE_MS, asked ?? computed)
}
