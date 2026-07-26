import { getHeadCommit } from '../../src/background/get-head-commit'
import { createBlob } from '../../src/background/create-blob'
import { createTree } from '../../src/background/create-tree'
import { createCommit } from '../../src/background/create-commit'
import { updateRef } from '../../src/background/update-ref'
import { NotFastForwardError } from '../../src/background/not-fast-forward-error'

const context = { token: 't', owner: 'o', repo: 'r' }

function mockFetch(handler: (url: string, init: RequestInit) => Response): void {
  globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) =>
    handler(String(url), init ?? {}),
  ) as unknown as typeof fetch
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

test('getHeadCommit resolves the branch ref and its tree', async () => {
  const seen: string[] = []
  mockFetch((url) => {
    seen.push(url)
    if (url.endsWith('/git/ref/heads/main')) return json({ object: { sha: 'commit1' } })
    if (url.endsWith('/git/commits/commit1')) return json({ sha: 'commit1', tree: { sha: 'tree1' } })
    throw new Error(`unexpected ${url}`)
  })

  await expect(getHeadCommit(context, 'main')).resolves.toEqual({
    commitSha: 'commit1',
    treeSha: 'tree1',
  })
  expect(seen).toEqual([
    'https://api.github.com/repos/o/r/git/ref/heads/main',
    'https://api.github.com/repos/o/r/git/commits/commit1',
  ])
})

test('createBlob posts utf-8 content and returns the sha', async () => {
  let body: unknown
  mockFetch((url, init) => {
    body = JSON.parse(String(init.body))
    expect(url).toBe('https://api.github.com/repos/o/r/git/blobs')
    return json({ sha: 'blob1' })
  })

  await expect(createBlob(context, '# hello')).resolves.toBe('blob1')
  expect(body).toEqual({ content: '# hello', encoding: 'utf-8' })
})

test('createTree sends 100644 entries against a base tree', async () => {
  let body: { base_tree: string; tree: Array<Record<string, string>> } | undefined
  mockFetch((_url, init) => {
    body = JSON.parse(String(init.body))
    return json({ sha: 'tree2' })
  })

  await expect(createTree(context, 'tree1', [{ path: 'a/index.md', sha: 'blob1' }])).resolves.toBe('tree2')
  expect(body?.base_tree).toBe('tree1')
  expect(body?.tree[0]).toEqual({ path: 'a/index.md', mode: '100644', type: 'blob', sha: 'blob1' })
})

test('createCommit sends the parent and returns the new sha', async () => {
  let body: { parents: string[] } | undefined
  mockFetch((_url, init) => {
    body = JSON.parse(String(init.body))
    return json({ sha: 'commit2' })
  })

  await expect(
    createCommit(context, { message: 'Clip', treeSha: 'tree2', parentSha: 'commit1' }),
  ).resolves.toBe('commit2')
  expect(body?.parents).toEqual(['commit1'])
})

test('updateRef throws NotFastForwardError on 422', async () => {
  mockFetch(() => json({ message: 'Update is not a fast forward' }, 422))
  await expect(updateRef(context, 'main', 'commit2')).rejects.toBeInstanceOf(NotFastForwardError)
})

test('updateRef throws NotFastForwardError on 409', async () => {
  mockFetch(() => json({ message: 'Conflict' }, 409))
  await expect(updateRef(context, 'main', 'commit2')).rejects.toBeInstanceOf(NotFastForwardError)
})

test('updateRef surfaces other errors as plain failures', async () => {
  mockFetch(() => json({ message: 'Bad credentials' }, 401))
  await expect(updateRef(context, 'main', 'commit2')).rejects.toThrow(/401/)
})
