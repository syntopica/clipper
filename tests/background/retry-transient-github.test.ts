import { commitClip } from '../../src/background/commit-clip'
import { GithubRequestError } from '../../src/background/github-request-error'
import { retryTransientGithub } from '../../src/background/retry-transient-github'

function failure(status: number, headers: Record<string, string> = {}): GithubRequestError {
  return new GithubRequestError('blob creation', new Response('{}', { status, headers }))
}

function options(waits: number[]) {
  return {
    attempts: 4,
    baseDelayMs: 1000,
    maxDelayMs: 30_000,
    wait: async (ms: number) => {
      waits.push(ms)
    },
  }
}

test('a transient failure is retried with doubling delays', async () => {
  const waits: number[] = []
  let calls = 0
  const result = await retryTransientGithub(async () => {
    calls += 1
    if (calls < 3) throw failure(502)
    return 'sha'
  }, options(waits))
  expect(result).toBe('sha')
  expect(waits).toEqual([1000, 2000])
})

test('Retry-After overrides the computed delay', async () => {
  const waits: number[] = []
  let calls = 0
  await retryTransientGithub(async () => {
    calls += 1
    if (calls === 1) throw failure(403, { 'retry-after': '5' })
    return 'sha'
  }, options(waits))
  expect(waits).toEqual([5000])
})

test('a permanent failure is not retried', async () => {
  const waits: number[] = []
  await expect(
    retryTransientGithub(async () => {
      throw failure(401)
    }, options(waits)),
  ).rejects.toMatchObject({ status: 401 })
  expect(waits).toEqual([])
})

test('a wait longer than the cap is not held open; the error surfaces', async () => {
  const waits: number[] = []
  await expect(
    retryTransientGithub(async () => {
      throw failure(429, { 'retry-after': '3600' })
    }, options(waits)),
  ).rejects.toMatchObject({ status: 429 })
  expect(waits).toEqual([])
})

test('gives up after the last attempt', async () => {
  const waits: number[] = []
  await expect(
    retryTransientGithub(async () => {
      throw failure(500)
    }, options(waits)),
  ).rejects.toMatchObject({ status: 500 })
  expect(waits).toEqual([1000, 2000, 4000])
})

test('blobs are created one at a time, and a throttled blob is retried', async () => {
  let inFlight = 0
  let maxInFlight = 0
  let blobCalls = 0
  globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
    const href = String(url)
    if (href.includes('/contents/')) return new Response('{}', { status: 404 })
    if (href.endsWith('/git/blobs')) {
      blobCalls += 1
      inFlight += 1
      maxInFlight = Math.max(maxInFlight, inFlight)
      await new Promise((resolve) => setTimeout(resolve, 1))
      inFlight -= 1
      if (blobCalls === 2) return new Response('{}', { status: 403, headers: { 'retry-after': '1' } })
      return new Response(JSON.stringify({ sha: `b${blobCalls}` }), { status: 200 })
    }
    if (href.includes('/git/ref/heads/')) return new Response('{"object":{"sha":"c1"}}', { status: 200 })
    if (href.includes('/git/commits/')) return new Response('{"sha":"c1","tree":{"sha":"t1"}}', { status: 200 })
    if (href.endsWith('/git/trees')) return new Response('{"sha":"t2"}', { status: 200 })
    if (href.endsWith('/git/commits')) return new Response('{"sha":"c2"}', { status: 200 })
    if (href.includes('/git/refs/heads/')) return new Response('{}', { status: 200 })
    throw new Error(`unexpected ${href}`)
  }) as unknown as typeof fetch

  const waits: number[] = []
  const clip = {
    dirPath: 'clips/pending/2026/10/x',
    metadata: { clip_id: 'ID1', content_sha256: 'a'.repeat(64), title: 'T' },
    files: { 'a/index.md': '1', 'a/source.html': '2', 'a/metadata.json': '3', 'a/state.json': '4' },
  } as unknown as Parameters<typeof commitClip>[1]['clip']

  await commitClip({ token: 't', owner: 'o', repo: 'r' }, { branch: 'main', clip }, options(waits))

  expect(maxInFlight).toBe(1)
  expect(blobCalls).toBe(5)
  expect(waits).toEqual([1000])
})
