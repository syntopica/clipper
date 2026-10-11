import { githubFailureKind, type GithubFailureKind } from '../github-failure-kind'
import { NotFastForwardError } from '../not-fast-forward-error'

// Whether a failed attempt is worth repeating later. GitHub's own answer
// decides most of it; a ref that kept moving under three rebuilds is contention,
// not a defect, so it is retried too. Everything the user must fix - settings,
// sign-in, a denylisted host, a conflicting clip - is permanent.
export function jobFailureKind(error: unknown): GithubFailureKind {
  if (error instanceof NotFastForwardError) return 'transient'
  return githubFailureKind(error)
}
