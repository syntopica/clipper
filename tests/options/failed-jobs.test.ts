import { IDBFactory } from 'fake-indexeddb'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { installChromeMock, type ChromeMock } from '../chrome-mock'
import { newClipJob } from '../../src/background/new-clip-job'
import { enqueueClipJob } from '../../src/background/queue/enqueue-clip-job'
import { listJobs } from '../../src/background/queue/list-jobs'
import { putJob } from '../../src/background/queue/put-job'
import { resetFailedJob } from '../../src/background/queue/reset-failed-job'
import { renderFailedJobs } from '../../src/options/render-failed-jobs'
import { handleFailedJobAction } from '../../src/options/handle-failed-job-action'

const payload = {
  type: 'clip-captured' as const,
  url: 'https://example.com/a',
  markdown: '# Title\n\nBody',
  sourceHtml: '<p>Body</p>',
  snapshotMode: 'sanitized' as const,
  extractor: 'defuddle' as const,
  siteExtractor: false,
  imageUrls: [] as string[],
  page: { title: 'A title', author: null, published: null, canonicalUrl: null, language: 'en', site: 'example.com' },
}

let chromeMock: ChromeMock

async function queueFailedJob(): Promise<string> {
  const job = newClipJob(payload)
  await enqueueClipJob(job, null)
  const [stored] = (await listJobs()).filter((queued) => queued.clipId === job.clipId)
  await putJob({ ...stored!, state: 'permanent-failure', attemptCount: 3, lastError: 'not signed in to GitHub' })
  return job.clipId
}

function click(clipId: string, action: string): Event {
  const button = document.querySelector(`li[data-clip-id="${clipId}"] button[data-action="${action}"]`)!
  return { target: button } as unknown as Event
}

beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
  chromeMock = installChromeMock()
  const html = readFileSync(resolve(import.meta.dirname, '../../src/options/options.html'), 'utf8')
  document.body.innerHTML = html.replace(/<script[^>]*><\/script>/, '')
})

test('a reset puts a permanent failure back to captured, keeping its identity', async () => {
  const clipId = await queueFailedJob()
  expect(await resetFailedJob(clipId)).toBe(true)
  const [stored] = await listJobs()
  expect(stored).toMatchObject({ clipId, state: 'captured', attemptCount: 0, lastError: null, nextAttemptAt: null })
})

test('a reset leaves a job alone unless it failed for good', async () => {
  const job = newClipJob(payload)
  await enqueueClipJob(job, null)
  expect(await resetFailedJob(job.clipId)).toBe(false)
  expect(await resetFailedJob('missing')).toBe(false)
})

test('only permanent failures are listed, with their reason', async () => {
  const clipId = await queueFailedJob()
  await enqueueClipJob(newClipJob(payload), null)
  await renderFailedJobs()
  const rows = document.querySelectorAll('#failedJobs li')
  expect(rows).toHaveLength(1)
  expect((rows[0] as HTMLElement).dataset.clipId).toBe(clipId)
  expect(rows[0]!.textContent).toContain('A title')
  expect(rows[0]!.textContent).toContain('not signed in to GitHub')
  expect((document.getElementById('failedJobsEmpty') as HTMLElement).hidden).toBe(true)
})

test('retry requeues the job and wakes the worker', async () => {
  const clipId = await queueFailedJob()
  await renderFailedJobs()
  await handleFailedJobAction(click(clipId, 'retry'))
  expect((await listJobs())[0]?.state).toBe('captured')
  expect(chromeMock.sentMessages).toEqual([{ type: 'resume-queue' }])
  expect(document.querySelectorAll('#failedJobs li')).toHaveLength(0)
  expect((document.getElementById('failedJobsEmpty') as HTMLElement).hidden).toBe(false)
})

test('discard deletes the job and its payload', async () => {
  const clipId = await queueFailedJob()
  await renderFailedJobs()
  await handleFailedJobAction(click(clipId, 'discard'))
  expect(await listJobs()).toEqual([])
  expect(chromeMock.sentMessages).toEqual([])
})
