import { commitClip } from '../../src/background/commit-clip'
import { ClipConflictError } from '../../src/background/clip-conflict-error'

const context = { token: 't', owner: 'o', repo: 'r' }

const clip = {
  dirPath: 'clips/pending/2026/07/x',
  metadata: { clip_id: 'ID1', content_sha256: 'a'.repeat(64), title: 'Title' },
  files: {
    'clips/pending/2026/07/x/index.md': '# a',
    'clips/pending/2026/07/x/source.html': '<p>a</p>',
    'clips/pending/2026/07/x/metadata.json': '{}',
    'clips/pending/2026/07/x/state.json': '{}',
  },
} as unknown as Parameters<typeof commitClip>[1]['clip']

interface Call { url: string; body: unknown }

function harness(options: { failFirstRefUpdate: boolean; existing?: unknown }) {
  const calls: Call[] = []
  let refUpdates = 0
  let head = 'commitA'

  globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const href = String(url)
    const body = init?.body ? JSON.parse(String(init.body)) : undefined
    calls.push({ url: href, body })

    if (href.includes('/contents/')) {
      return options.existing === undefined
        ? new Response('{"message":"Not Found"}', { status: 404 })
        : new Response(JSON.stringify(options.existing), { status: 200 })
    }
    if (href.includes('/git/ref/heads/')) return new Response(JSON.stringify({ object: { sha: head } }), { status: 200 })
    if (href.includes('/git/commits/')) return new Response(JSON.stringify({ sha: head, tree: { sha: `tree-${head}` } }), { status: 200 })
    if (href.endsWith('/git/blobs')) return new Response(JSON.stringify({ sha: `blob-${calls.length}` }), { status: 200 })
    if (href.endsWith('/git/trees')) return new Response(JSON.stringify({ sha: `tree-new-${head}` }), { status: 200 })
    if (href.endsWith('/git/commits')) return new Response(JSON.stringify({ sha: `commit-new-${head}` }), { status: 200 })
    if (href.includes('/git/refs/heads/')) {
      refUpdates += 1
      if (options.failFirstRefUpdate && refUpdates === 1) {
        head = 'commitB'
        return new Response('{"message":"Update is not a fast forward"}', { status: 422 })
      }
      return new Response('{}', { status: 200 })
    }
    throw new Error(`unexpected ${href}`)
  }) as unknown as typeof fetch

  return { calls, refUpdateCount: () => refUpdates }
}

test('creates four blobs and one commit on the happy path', async () => {
  const h = harness({ failFirstRefUpdate: false })
  const result = await commitClip(context, { branch: 'main', clip })

  expect(result.alreadyPresent).toBe(false)
  expect(h.calls.filter((call) => call.url.endsWith('/git/blobs'))).toHaveLength(4)
  expect(h.calls.filter((call) => call.url.endsWith('/git/commits'))).toHaveLength(1)
  expect(h.refUpdateCount()).toBe(1)
})

test('rebuilds tree and commit against the new head after a non-fast-forward', async () => {
  const h = harness({ failFirstRefUpdate: true })
  await commitClip(context, { branch: 'main', clip })

  const commitBodies = h.calls.filter((call) => call.url.endsWith('/git/commits') && call.body)
  expect(commitBodies).toHaveLength(2)
  expect((commitBodies[0]?.body as { parents: string[] }).parents).toEqual(['commitA'])
  expect((commitBodies[1]?.body as { parents: string[] }).parents).toEqual(['commitB'])

  const treeBodies = h.calls.filter((call) => call.url.endsWith('/git/trees'))
  expect((treeBodies[1]?.body as { base_tree: string }).base_tree).toBe('tree-commitB')
})

test('does not re-upload blobs on retry', async () => {
  const h = harness({ failFirstRefUpdate: true })
  await commitClip(context, { branch: 'main', clip })
  expect(h.calls.filter((call) => call.url.endsWith('/git/blobs'))).toHaveLength(4)
})

test('an identical existing clip is a no-op', async () => {
  const h = harness({
    failFirstRefUpdate: false,
    existing: { clip_id: 'ID1', content_sha256: 'a'.repeat(64) },
  })
  const result = await commitClip(context, { branch: 'main', clip })

  expect(result.alreadyPresent).toBe(true)
  expect(h.calls.filter((call) => call.url.endsWith('/git/blobs'))).toHaveLength(0)
})

test('a different clip at the same path is a hard failure', async () => {
  harness({ failFirstRefUpdate: false, existing: { clip_id: 'OTHER', content_sha256: 'b'.repeat(64) } })
  await expect(commitClip(context, { branch: 'main', clip })).rejects.toBeInstanceOf(ClipConflictError)
})
