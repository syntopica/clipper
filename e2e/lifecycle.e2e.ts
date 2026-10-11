import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Worker } from '@playwright/test'
import { expect, test } from './extension-fixture'

const payload = {
  type: 'clip-captured',
  url: 'https://example.com/a',
  markdown: '# Title\n\nBody text long enough to be a clip.',
  sourceHtml: '<p>Body</p>',
  snapshotMode: 'sanitized',
  extractor: 'defuddle',
  siteExtractor: false,
  imageUrls: [],
  page: { title: 'Title', author: null, published: null, canonicalUrl: null, language: 'en', site: 'example.com' },
}

function readJobStates(worker: Worker): Promise<string[]> {
  return worker.evaluate(
    () =>
      new Promise<string[]>((resolve, reject) => {
        const open = indexedDB.open('clip-queue')
        open.onsuccess = () => {
          const all = open.result.transaction('jobs').objectStore('jobs').getAll()
          all.onsuccess = () => {
            open.result.close()
            resolve((all.result as Array<{ state: string }>).map((job) => job.state))
          }
          all.onerror = () => reject(all.error)
        }
        open.onerror = () => reject(open.error)
      }),
  )
}

function idFromManifestKey(key: string): string {
  const hex = createHash('sha256').update(Buffer.from(key, 'base64')).digest('hex').slice(0, 32)
  return [...hex].map((digit) => String.fromCharCode(97 + Number.parseInt(digit, 16))).join('')
}

test('the built manifest loads, under the id its key pins when it has one', async ({ extensionId }) => {
  const manifest = JSON.parse(readFileSync(resolve(import.meta.dirname, '..', 'dist', 'manifest.json'), 'utf8'))
  expect(extensionId).toMatch(/^[a-p]{32}$/)
  if (manifest.key !== undefined) expect(extensionId).toBe(idFromManifestKey(manifest.key))
})

test('the options page saves the hostname lists to real sync storage', async ({ context, extensionId, worker }) => {
  const page = await context.newPage()
  await page.goto(`chrome-extension://${extensionId}/options/options.html`)
  await page.fill('#owner', 'o')
  await page.fill('#repo', 'r')
  await page.fill('#branch', 'main')
  await page.fill('#machineName', 'e2e')
  await page.fill('#denylistedHostnames', 'Bank.Example')
  await page.fill('#privateHostnames', 'intranet.example')
  await page.click('#save')
  await expect(page.locator('#status')).toHaveText('Saved.')
  const stored = await worker.evaluate(() => chrome.storage.sync.get(['denylistedHostnames', 'privateHostnames']))
  expect(stored).toEqual({ denylistedHostnames: ['bank.example'], privateHostnames: ['intranet.example'] })
})

test('a capture is queued in IndexedDB, survives the worker being stopped, and is committed once by the retry alarm', async ({
  context,
  extensionId,
  worker,
}) => {
  const calls: string[] = []
  let blobFailures = 0
  await context.route('https://api.github.com/**', async (route) => {
    const url = route.request().url()
    const method = route.request().method()
    calls.push(`${method} ${new URL(url).pathname}`)
    const json = (status: number, body: unknown) =>
      route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) })
    if (url.includes('/contents/')) return json(404, { message: 'Not Found' })
    if (url.endsWith('/git/blobs')) {
      if (blobFailures === 0) {
        blobFailures += 1
        // Four in-attempt retries would absorb a single 503; a 503 that asks
        // for 45 seconds is beyond the in-attempt cap, so the job is queued.
        return route.fulfill({ status: 503, headers: { 'retry-after': '45' }, body: '{}' })
      }
      return json(201, { sha: 'b1' })
    }
    if (url.includes('/git/ref/heads/')) return json(200, { object: { sha: 'c1' } })
    if (url.includes('/git/commits/')) return json(200, { sha: 'c1', tree: { sha: 't1' } })
    if (url.endsWith('/git/trees')) return json(201, { sha: 't2' })
    if (url.endsWith('/git/commits')) return json(201, { sha: 'c2' })
    if (url.includes('/git/refs/heads/')) return json(200, {})
    return json(500, {})
  })

  await worker.evaluate(async () => {
    await chrome.storage.sync.set({ owner: 'o', repo: 'r', branch: 'main' })
    await chrome.storage.local.set({
      machineName: 'e2e',
      githubCredential: { accessToken: 'tok', refreshToken: null, expiresAt: null, login: 'x' },
    })
  })

  // Any extension page can deliver the message the content script would send.
  const page = await context.newPage()
  await page.goto(`chrome-extension://${extensionId}/options/options.html`)
  await page.evaluate((message) => chrome.runtime.sendMessage(message), payload)

  // The job waits out its retry in IndexedDB, not in the worker's memory...
  await expect.poll(() => readJobStates(worker), { timeout: 30_000 }).toEqual(['transient-failure'])
  // ...so stopping the worker loses nothing: the alarm wakes a fresh one.
  const cdp = await context.newCDPSession(page)
  await cdp.send('ServiceWorker.enable')
  await cdp.send('ServiceWorker.stopAllWorkers')

  await expect.poll(() => calls.filter((call) => call.startsWith('PATCH')).length, { timeout: 90_000 }).toBe(1)
  expect(blobFailures).toBe(1)

  expect(await readJobStates(worker)).toEqual([])
})

test('a permanently failed clip is listed on the options page, retried by the worker, then discarded', async ({
  context,
  extensionId,
  worker,
}) => {
  await worker.evaluate(
    (job) =>
      new Promise<void>((resolve, reject) => {
        const open = indexedDB.open('clip-queue', 1)
        open.onupgradeneeded = () => open.result.createObjectStore('jobs', { keyPath: 'clipId' })
        open.onsuccess = () => {
          const transaction = open.result.transaction('jobs', 'readwrite')
          transaction.objectStore('jobs').put(job)
          transaction.oncomplete = () => {
            open.result.close()
            resolve()
          }
          transaction.onerror = () => reject(transaction.error)
        }
        open.onerror = () => reject(open.error)
      }),
    {
      clipId: '01J3ABCDEF123456789ABCDEFG',
      clippedAt: '2026-10-11T10:00:00Z',
      payload,
      tabId: null,
      state: 'permanent-failure',
      nextAttemptAt: null,
      leaseOwner: null,
      leaseExpiresAt: null,
      attemptCount: 1,
      lastError: 'not signed in to GitHub on this device - open the options page',
      assets: null,
    },
  )

  const page = await context.newPage()
  await page.goto(`chrome-extension://${extensionId}/options/options.html`)
  const row = page.locator('#failedJobs li')
  await expect(row).toHaveCount(1)
  await expect(row).toContainText('not signed in to GitHub')

  // No settings are stored, so the worker runs the job and it fails for good
  // again - with the new reason, which proves the retry really ran.
  await row.locator('button[data-action="retry"]').click()
  await expect(page.locator('#status')).toHaveText('Queued again.')
  await expect.poll(() => readJobStates(worker), { timeout: 30_000 }).toEqual(['permanent-failure'])
  await page.reload()
  await expect(row).toContainText('settings are incomplete')

  await row.locator('button[data-action="discard"]').click()
  await expect(row).toHaveCount(0)
  expect(await readJobStates(worker)).toEqual([])
})

test('the service worker re-encodes as WebP on an OffscreenCanvas, with the long edge capped', async ({ worker }) => {
  const encoded = await worker.evaluate(async () => {
    const source = new OffscreenCanvas(3200, 800)
    source.getContext('2d')!.fillRect(0, 0, 3200, 800)
    const png = await source.convertToBlob({ type: 'image/png' })
    const bitmap = await createImageBitmap(png)
    const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height))
    const canvas = new OffscreenCanvas(Math.round(bitmap.width * scale), Math.round(bitmap.height * scale))
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    const webp = await canvas.convertToBlob({ type: 'image/webp', quality: 0.82 })
    const decoded = await createImageBitmap(webp)
    return { type: webp.type, width: decoded.width, height: decoded.height }
  })
  expect(encoded).toEqual({ type: 'image/webp', width: 1600, height: 400 })
})

test('the offscreen document sanitises an SVG for the worker', async ({ worker }) => {
  const clean = await worker.evaluate(async () => {
    await chrome.offscreen.createDocument({
      url: 'offscreen/offscreen.html',
      reasons: ['DOM_PARSER' as chrome.offscreen.Reason],
      justification: 'e2e',
    })
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><script>alert(2)</script>' +
      '<image href="https://track.example/p.png"/><rect width="1" height="1"/></svg>'
    const refused = await chrome.runtime.sendMessage({ target: 'offscreen', type: 'sanitize-svg', svg: '<html></html>' })
    const accepted = await chrome.runtime.sendMessage({ target: 'offscreen', type: 'sanitize-svg', svg })
    return { refused, accepted }
  })
  expect(clean.refused).toEqual({ svg: null })
  expect(clean.accepted.svg).toContain('<rect')
  for (const gone of ['onload', 'script', 'track.example']) expect(clean.accepted.svg).not.toContain(gone)
})
