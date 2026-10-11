import { GithubRequestError } from './github-request-error'
import { isRateLimited } from './is-rate-limited'

export type GithubFailureKind = 'transient' | 'permanent'

// Whether a failed GitHub call is worth repeating. Transient: rate limits, any
// 5xx, and a request that never got an answer (`fetch` rejects with a
// TypeError when offline). Everything else - a revoked token, a missing repo,
// a rejected payload - fails the same way every time it is retried.
export function githubFailureKind(error: unknown): GithubFailureKind {
  if (error instanceof TypeError) return 'transient'
  if (!(error instanceof GithubRequestError)) return 'permanent'
  if (isRateLimited(error)) return 'transient'
  return error.status >= 500 ? 'transient' : 'permanent'
}
