import { installChromeMock } from '../chrome-mock'
import { handleCapturedPage } from '../../src/background/handle-captured-page'
import { newClipJob } from '../../src/background/new-clip-job'

const payload = {
  type: 'clip-captured' as const,
  url: 'https://example.com/a',
  markdown: '# Title\n\nBody',
  sourceHtml: '<p>Body</p>',
  snapshotMode: 'sanitized' as const,
  extractor: 'defuddle' as const,
  siteExtractor: false,
  page: {
    title: 'Title',
    author: null,
    published: null,
    canonicalUrl: null,
    language: 'en',
    site: 'example.com',
  },
}

function mockGithub(): { paths: string[] } {
  const paths: string[] = []
  globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const href = String(url)
    if (href.includes('/contents/')) return new Response('{"message":"Not Found"}', { status: 404 })
    if (href.includes('/git/ref/heads/')) return new Response('{"object":{"sha":"c1"}}', { status: 200 })
    if (href.includes('/git/commits/')) return new Response('{"sha":"c1","tree":{"sha":"t1"}}', { status: 200 })
    if (href.endsWith('/git/blobs')) return new Response('{"sha":"b1"}', { status: 200 })
    if (href.endsWith('/git/trees')) {
      const body = JSON.parse(String(init?.body)) as { tree: Array<{ path: string }> }
      paths.push(...body.tree.map((entry) => entry.path))
      return new Response('{"sha":"t2"}', { status: 200 })
    }
    if (href.endsWith('/git/commits')) return new Response('{"sha":"c2"}', { status: 200 })
    if (href.includes('/git/refs/heads/')) return new Response('{}', { status: 200 })
    throw new Error(`unexpected ${href}`)
  }) as unknown as typeof fetch
  return { paths }
}

test('a captured page becomes one commit of four files', async () => {
  const stores = installChromeMock()
  Object.assign(stores.sync.data, { owner: 'o', repo: 'r', branch: 'main' })
  stores.local.data.machineName = 'mac-cristian'
  stores.local.data.githubCredential = {
    accessToken: 'tok',
    refreshToken: null,
    expiresAt: null,
    login: 'an-owner',
  }
  const github = mockGithub()

  await handleCapturedPage(newClipJob(payload))

  expect(github.paths).toHaveLength(4)
  expect(github.paths.every((path) => path.startsWith('clips/pending/'))).toBe(true)
})

test('refuses to clip when there is no GitHub session, before writing anything', async () => {
  const stores = installChromeMock()
  Object.assign(stores.sync.data, { owner: 'o', repo: 'r', branch: 'main' })
  stores.local.data.machineName = 'm'
  const github = mockGithub()

  await expect(handleCapturedPage(newClipJob(payload))).rejects.toThrow(/not signed in/i)
  expect(github.paths).toHaveLength(0)
})

test('refuses to clip a denylisted host, before checking settings or writing anything', async () => {
  installChromeMock()
  const github = mockGithub()

  await expect(
    handleCapturedPage(newClipJob({ ...payload, url: 'https://mail.google.com/mail/u/0/' })),
  ).rejects.toThrow(/denylist/i)
  expect(github.paths).toHaveLength(0)
})

test('refuses a bracketed IPv6 loopback url the way new URL(...).hostname actually returns it', async () => {
  installChromeMock()
  const github = mockGithub()

  await expect(
    handleCapturedPage(newClipJob({ ...payload, url: 'http://[::1]:8000/x' })),
  ).rejects.toThrow(/denylist/i)
  expect(github.paths).toHaveLength(0)
})

test('running the same job twice targets the same directory and stops as identical', async () => {
  const stores = installChromeMock()
  Object.assign(stores.sync.data, { owner: 'o', repo: 'r', branch: 'main' })
  stores.local.data.machineName = 'm'
  stores.local.data.githubCredential = { accessToken: 'tok', refreshToken: null, expiresAt: null, login: 'x' }

  // A repository that remembers what was committed, so the second attempt sees
  // the first one's metadata.json exactly as GitHub would serve it.
  const committed = new Map<string, string>()
  const blobs = new Map<string, string>()
  let refUpdates = 0
  globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const href = String(url)
    const contents = /\/contents\/(.+)\?ref=/.exec(href)
    if (contents) {
      const body = committed.get(contents[1] as string)
      return body === undefined
        ? new Response('{"message":"Not Found"}', { status: 404 })
        : new Response(body, { status: 200 })
    }
    if (href.includes('/git/ref/heads/')) return new Response('{"object":{"sha":"c1"}}', { status: 200 })
    if (href.includes('/git/commits/')) return new Response('{"sha":"c1","tree":{"sha":"t1"}}', { status: 200 })
    if (href.endsWith('/git/blobs')) {
      const sha = `b${blobs.size}`
      blobs.set(sha, (JSON.parse(String(init?.body)) as { content: string }).content)
      return new Response(JSON.stringify({ sha }), { status: 200 })
    }
    if (href.endsWith('/git/trees')) {
      const body = JSON.parse(String(init?.body)) as { tree: Array<{ path: string; sha: string }> }
      for (const entry of body.tree) committed.set(entry.path, blobs.get(entry.sha) ?? '')
      return new Response('{"sha":"t2"}', { status: 200 })
    }
    if (href.endsWith('/git/commits')) return new Response('{"sha":"c2"}', { status: 200 })
    if (href.includes('/git/refs/heads/')) {
      refUpdates += 1
      return new Response('{}', { status: 200 })
    }
    throw new Error(`unexpected ${href}`)
  }) as unknown as typeof fetch

  const job = newClipJob(payload)
  const first = await handleCapturedPage(job)
  const second = await handleCapturedPage(job)

  expect(second.dirPath).toBe(first.dirPath)
  expect(refUpdates).toBe(1)
})

test('the job mints the clip id and a second-precision UTC timestamp once', () => {
  const job = newClipJob(payload, new Date('2026-10-11T12:34:56.789Z'))
  expect(job.clippedAt).toBe('2026-10-11T12:34:56Z')
  expect(job.clipId).toMatch(/^[0-9A-HJKMNP-TV-Z]{26}$/)
  expect(job.payload).toBe(payload)
})
