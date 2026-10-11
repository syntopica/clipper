import { githubFailureKind } from '../../src/background/github-failure-kind'
import { GithubRequestError } from '../../src/background/github-request-error'
import { retryAfterMs } from '../../src/background/retry-after-ms'
import { createBlob } from '../../src/background/create-blob'

function failure(status: number, headers: Record<string, string> = {}): GithubRequestError {
  return new GithubRequestError('blob creation', new Response('{}', { status, headers }))
}

test('a failed call carries its status and headers, and keeps the old message', async () => {
  globalThis.fetch = vi.fn(async () =>
    new Response('{}', { status: 503, headers: { 'retry-after': '7' } }),
  ) as unknown as typeof fetch
  const error = await createBlob({ token: 't', owner: 'o', repo: 'r' }, 'x').catch((e: unknown) => e)
  expect(error).toBeInstanceOf(GithubRequestError)
  expect((error as GithubRequestError).status).toBe(503)
  expect((error as GithubRequestError).headers.get('retry-after')).toBe('7')
  expect((error as GithubRequestError).message).toBe('blob creation failed: 503')
})

test.each([
  [401, {}, 'permanent'],
  [403, {}, 'permanent'],
  [404, {}, 'permanent'],
  [422, {}, 'permanent'],
  [403, { 'retry-after': '60' }, 'transient'],
  [403, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': '1' }, 'transient'],
  [429, {}, 'transient'],
  [500, {}, 'transient'],
  [502, {}, 'transient'],
] as const)('status %i with %o is %s', (status, headers, kind) => {
  expect(githubFailureKind(failure(status, headers))).toBe(kind)
})

test('a request that never got an answer is transient; an unknown error is not', () => {
  expect(githubFailureKind(new TypeError('Failed to fetch'))).toBe('transient')
  expect(githubFailureKind(new Error('settings are incomplete'))).toBe('permanent')
})

test('Retry-After is read as seconds or as an HTTP date', () => {
  const now = Date.parse('2026-10-11T12:00:00Z')
  expect(retryAfterMs(failure(429, { 'retry-after': '30' }), now)).toBe(30_000)
  expect(retryAfterMs(failure(429, { 'retry-after': 'Sun, 11 Oct 2026 12:00:05 GMT' }), now)).toBe(5_000)
})

test('an exhausted primary limit waits until its reset', () => {
  const now = Date.parse('2026-10-11T12:00:00Z')
  const reset = String(now / 1000 + 90)
  expect(
    retryAfterMs(failure(403, { 'x-ratelimit-remaining': '0', 'x-ratelimit-reset': reset }), now),
  ).toBe(90_000)
})

test('no hint means null', () => {
  expect(retryAfterMs(failure(502))).toBeNull()
})
