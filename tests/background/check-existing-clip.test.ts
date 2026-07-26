import { checkExistingClip } from '../../src/background/check-existing-clip'

const context = { token: 't', owner: 'o', repo: 'r' }
const base = { branch: 'main', dirPath: 'clips/pending/2026/07/x', clipId: 'ID1', contentSha256: 'a'.repeat(64) }

function mockMetadata(metadata: unknown | null, status = 200): void {
  globalThis.fetch = vi.fn(async () =>
    metadata === null
      ? new Response('{"message":"Not Found"}', { status: 404 })
      : new Response(JSON.stringify(metadata), { status, headers: { 'content-type': 'application/json' } }),
  ) as unknown as typeof fetch
}

test('absent when metadata.json is a 404', async () => {
  mockMetadata(null)
  await expect(checkExistingClip(context, base)).resolves.toBe('absent')
})

test('identical when clip id and content hash both match', async () => {
  mockMetadata({ clip_id: 'ID1', content_sha256: 'a'.repeat(64) })
  await expect(checkExistingClip(context, base)).resolves.toBe('identical')
})

test('conflict when the path holds a different clip', async () => {
  mockMetadata({ clip_id: 'OTHER', content_sha256: 'b'.repeat(64) })
  await expect(checkExistingClip(context, base)).resolves.toBe('conflict')
})

test('conflict when the same clip id holds different content', async () => {
  mockMetadata({ clip_id: 'ID1', content_sha256: 'b'.repeat(64) })
  await expect(checkExistingClip(context, base)).resolves.toBe('conflict')
})

test('reads the clip metadata.json on the target branch as raw content', async () => {
  let seen: { url: string; accept: string } | undefined
  globalThis.fetch = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    const headers = (init?.headers ?? {}) as Record<string, string>
    seen = { url: String(url), accept: headers.accept as string }
    return new Response('{"message":"Not Found"}', { status: 404 })
  }) as unknown as typeof fetch

  await checkExistingClip(context, { ...base, branch: 'feature/a&b' })
  expect(seen?.url).toBe(
    'https://api.github.com/repos/o/r/contents/clips/pending/2026/07/x/metadata.json?ref=feature%2Fa%26b',
  )
  expect(seen?.accept).toBe('application/vnd.github.raw+json')
})
