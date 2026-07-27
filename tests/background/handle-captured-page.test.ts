import { installChromeMock } from '../chrome-mock'
import { handleCapturedPage } from '../../src/background/handle-captured-page'

const payload = {
  type: 'clip-captured' as const,
  url: 'https://example.com/a',
  markdown: '# Title\n\nBody',
  sourceHtml: '<p>Body</p>',
  snapshotMode: 'sanitized' as const,
  extractor: 'readability' as const,
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
    login: 'cristiandeluxe',
  }
  const github = mockGithub()

  await handleCapturedPage(payload)

  expect(github.paths).toHaveLength(4)
  expect(github.paths.every((path) => path.startsWith('clips/pending/'))).toBe(true)
})

test('refuses to clip when there is no GitHub session, before writing anything', async () => {
  const stores = installChromeMock()
  Object.assign(stores.sync.data, { owner: 'o', repo: 'r', branch: 'main' })
  stores.local.data.machineName = 'm'
  const github = mockGithub()

  await expect(handleCapturedPage(payload)).rejects.toThrow(/not signed in/i)
  expect(github.paths).toHaveLength(0)
})

test('refuses to clip a denylisted host, before checking settings or writing anything', async () => {
  installChromeMock()
  const github = mockGithub()

  await expect(
    handleCapturedPage({ ...payload, url: 'https://mail.google.com/mail/u/0/' }),
  ).rejects.toThrow(/denylist/i)
  expect(github.paths).toHaveLength(0)
})

test('refuses a bracketed IPv6 loopback url the way new URL(...).hostname actually returns it', async () => {
  installChromeMock()
  const github = mockGithub()

  await expect(
    handleCapturedPage({ ...payload, url: 'http://[::1]:8000/x' }),
  ).rejects.toThrow(/denylist/i)
  expect(github.paths).toHaveLength(0)
})
