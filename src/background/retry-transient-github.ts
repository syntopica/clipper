import { sleep } from '../shared/sleep'
import { githubFailureKind } from './github-failure-kind'
import { GithubRequestError } from './github-request-error'
import { retryAfterMs } from './retry-after-ms'

export interface RetryOptions {
  attempts: number
  baseDelayMs: number
  // A wait longer than this is not worth holding a service worker open for;
  // the error is rethrown so the caller reports it instead.
  maxDelayMs: number
  wait?: (milliseconds: number) => Promise<void>
}

export const DEFAULT_RETRY: RetryOptions = { attempts: 4, baseDelayMs: 1000, maxDelayMs: 30_000 }

// Repeat a GitHub call while it fails transiently, waiting as long as GitHub
// asked or, when it did not say, doubling from `baseDelayMs`. A permanent
// failure is rethrown at once.
export async function retryTransientGithub<T>(
  operation: () => Promise<T>,
  options: RetryOptions = DEFAULT_RETRY,
): Promise<T> {
  const wait = options.wait ?? sleep
  for (let attempt = 1; ; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      if (attempt >= options.attempts || githubFailureKind(error) === 'permanent') throw error
      const asked = error instanceof GithubRequestError ? retryAfterMs(error) : null
      const delay = asked ?? options.baseDelayMs * 2 ** (attempt - 1)
      if (delay > options.maxDelayMs) throw error
      await wait(delay)
    }
  }
}
