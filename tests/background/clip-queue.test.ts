import { IDBFactory } from 'fake-indexeddb'
import { installChromeMock, type ChromeMock } from '../chrome-mock'
import { newClipJob } from '../../src/background/new-clip-job'
import { GithubRequestError } from '../../src/background/github-request-error'
import { ClipConflictError } from '../../src/background/clip-conflict-error'
import { enqueueClipJob } from '../../src/background/queue/enqueue-clip-job'
import { acquireLease } from '../../src/background/queue/acquire-lease'
import { listJobs } from '../../src/background/queue/list-jobs'
import { putJob } from '../../src/background/queue/put-job'
import { runQueuedJob } from '../../src/background/queue/run-queued-job'
import { RETRY_ALARM_NAME } from '../../src/background/queue/retry-alarm-name'
import { LEASE_MS } from '../../src/background/queue/lease-ms'

const payload = {
  type: 'clip-captured' as const,
  url: 'https://example.com/a',
  markdown: '# Title\n\nBody',
  sourceHtml: '<p>Body</p>',
  snapshotMode: 'sanitized' as const,
  extractor: 'defuddle' as const,
  siteExtractor: false,
  imageUrls: [] as string[],
  page: { title: 'Title', author: null, published: null, canonicalUrl: null, language: 'en', site: 'example.com' },
}

let chromeMock: ChromeMock

beforeEach(() => {
  // A fresh, empty database per test.
  globalThis.indexedDB = new IDBFactory()
  chromeMock = installChromeMock()
})

test('a job is persisted as captured before anything else happens', async () => {
  const job = newClipJob(payload)
  await enqueueClipJob(job, 3)
  const [stored] = await listJobs()
  expect(stored).toMatchObject({ clipId: job.clipId, clippedAt: job.clippedAt, tabId: 3, state: 'captured', attemptCount: 0 })
})

test('a committed job is removed from the queue', async () => {
  const job = newClipJob(payload)
  await enqueueClipJob(job, null)
  const outcome = await runQueuedJob(job.clipId, async () => ({ dirPath: 'clips/pending/x' }))
  expect(outcome).toMatchObject({ kind: 'committed', dirPath: 'clips/pending/x' })
  expect(await listJobs()).toEqual([])
})

test('a transient failure waits for a retry and arms the alarm for it', async () => {
  const job = newClipJob(payload)
  await enqueueClipJob(job, null)
  const before = Date.now()
  const outcome = await runQueuedJob(job.clipId, async () => {
    throw new GithubRequestError('blob creation', new Response('{}', { status: 503 }))
  })
  expect(outcome.kind).toBe('retrying')
  const [stored] = await listJobs()
  expect(stored).toMatchObject({ state: 'transient-failure', leaseOwner: null, attemptCount: 1, lastError: 'blob creation failed: 503' })
  expect(stored?.nextAttemptAt).toBeGreaterThanOrEqual(before + 30_000)
  expect(chromeMock.alarms.get(RETRY_ALARM_NAME)).toBe(stored?.nextAttemptAt)
})

test('Retry-After decides the next attempt when GitHub gives it', async () => {
  const job = newClipJob(payload)
  await enqueueClipJob(job, null)
  const before = Date.now()
  await runQueuedJob(job.clipId, async () => {
    throw new GithubRequestError('blob creation', new Response('{}', { status: 429, headers: { 'retry-after': '600' } }))
  })
  const [stored] = await listJobs()
  expect(stored?.nextAttemptAt).toBeGreaterThanOrEqual(before + 600_000)
})

test.each([
  ['a revoked token', new GithubRequestError('ref lookup', new Response('{}', { status: 401 }))],
  ['a conflicting clip', new ClipConflictError('clips/pending/x')],
  ['missing settings', new Error('settings are incomplete - open the options page')],
])('%s is a permanent failure, kept and never retried', async (_name, error) => {
  const job = newClipJob(payload)
  await enqueueClipJob(job, null)
  const outcome = await runQueuedJob(job.clipId, async () => {
    throw error
  })
  expect(outcome.kind).toBe('failed')
  const [stored] = await listJobs()
  expect(stored?.state).toBe('permanent-failure')
  expect(await runQueuedJob(job.clipId, async () => ({ dirPath: 'x' }))).toEqual({ kind: 'skipped' })
})

test('a job is not taken twice while its lease holds', async () => {
  const job = newClipJob(payload)
  await enqueueClipJob(job, null)
  const [first, second] = await Promise.all([
    acquireLease(job.clipId, 'worker-a'),
    acquireLease(job.clipId, 'worker-b'),
  ])
  expect([first, second].filter((leased) => leased !== null)).toHaveLength(1)
})

test('a job left uploading by a dead worker is resumed once its lease lapses, with the same identity', async () => {
  const job = newClipJob(payload)
  await enqueueClipJob(job, null)
  const now = Date.now()
  await acquireLease(job.clipId, 'dead-worker', now)

  expect(await acquireLease(job.clipId, 'new-worker', now + 1000)).toBeNull()
  const resumed = await acquireLease(job.clipId, 'new-worker', now + LEASE_MS + 1)
  expect(resumed).toMatchObject({ clipId: job.clipId, clippedAt: job.clippedAt, leaseOwner: 'new-worker', attemptCount: 2 })
})

test('a retry is not due before its time', async () => {
  const job = newClipJob(payload)
  await enqueueClipJob(job, null)
  const [stored] = await listJobs()
  await putJob({ ...stored!, state: 'transient-failure', nextAttemptAt: Date.now() + 60_000 })
  expect(await runQueuedJob(job.clipId, async () => ({ dirPath: 'x' }))).toEqual({ kind: 'skipped' })
})

test('resuming the queue commits a job left behind, and clears the alarm when nothing waits', async () => {
  const { resumeQueue } = await import('../../src/background/resume-queue')
  Object.assign(chromeMock.sync.data, { owner: 'o', repo: 'r', branch: 'main' })
  chromeMock.local.data.machineName = 'm'
  chromeMock.local.data.githubCredential = { accessToken: 'tok', refreshToken: null, expiresAt: null, login: 'x' }
  chromeMock.alarms.set(RETRY_ALARM_NAME, 1)
  let refUpdates = 0
  globalThis.fetch = vi.fn(async (url: string | URL | Request) => {
    const href = String(url)
    if (href.includes('/contents/')) return new Response('{}', { status: 404 })
    if (href.includes('/git/ref/heads/')) return new Response('{"object":{"sha":"c1"}}', { status: 200 })
    if (href.includes('/git/commits/')) return new Response('{"sha":"c1","tree":{"sha":"t1"}}', { status: 200 })
    if (href.endsWith('/git/blobs')) return new Response('{"sha":"b1"}', { status: 200 })
    if (href.endsWith('/git/trees')) return new Response('{"sha":"t2"}', { status: 200 })
    if (href.endsWith('/git/commits')) return new Response('{"sha":"c2"}', { status: 200 })
    if (href.includes('/git/refs/heads/')) {
      refUpdates += 1
      return new Response('{}', { status: 200 })
    }
    throw new Error(`unexpected ${href}`)
  }) as unknown as typeof fetch

  await enqueueClipJob(newClipJob(payload), null)
  await resumeQueue()

  expect(refUpdates).toBe(1)
  expect(await listJobs()).toEqual([])
  expect(chromeMock.alarms.has(RETRY_ALARM_NAME)).toBe(false)
})

test('the asset step persists its result as ready before the commit, and a retry reuses it', async () => {
  const { ensureJobAssets } = await import('../../src/background/queue/ensure-job-assets')
  const job = newClipJob({ ...payload, imageUrls: ['https://cdn.example/a.png'] })
  await enqueueClipJob(job, null)
  const leased = await acquireLease(job.clipId, 'worker-a')
  expect(leased?.state).toBe('fetching-assets')

  const assets = { files: [{ urls: ['https://cdn.example/a.png'], fileName: '01-abcdef12.webp', bytes: new Uint8Array([1, 2]).buffer }], failures: [] }
  const states: string[] = []
  const prepare = vi.fn(async () => {
    states.push((await listJobs())[0]!.state)
    return assets
  })
  const prepared = await ensureJobAssets(leased!, prepare)
  expect(prepared.assets).toBe(assets)
  expect(states).toEqual(['fetching-assets'])
  const [stored] = await listJobs()
  expect(stored).toMatchObject({ state: 'uploading', assets: { failures: [], files: [{ fileName: '01-abcdef12.webp' }] } })

  // Already prepared: the step does not run again.
  await ensureJobAssets(stored!, prepare)
  expect(prepare).toHaveBeenCalledTimes(1)
})

test('a failure after the asset step keeps the assets, and the next attempt goes straight to uploading', async () => {
  const job = newClipJob(payload)
  await enqueueClipJob(job, null)
  const outcome = await runQueuedJob(job.clipId, async (_job, loadAssets) => {
    await loadAssets()
    throw new GithubRequestError('blob creation', new Response('{}', { status: 503 }))
  })
  expect(outcome.kind).toBe('retrying')
  const [stored] = await listJobs()
  expect(stored).toMatchObject({ state: 'transient-failure', assets: { files: [], failures: [] } })

  await putJob({ ...stored!, nextAttemptAt: null })
  const seen: unknown[] = []
  await runQueuedJob(job.clipId, async (retried, loadAssets) => {
    seen.push((retried as { state?: string }).state, await loadAssets())
    return { dirPath: 'x' }
  })
  expect(seen).toEqual(['uploading', { files: [], failures: [] }])
})
