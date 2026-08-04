import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fetchClipStatus } from '../../src/shared/fetch-clip-status'

const answer = (body: unknown, status = 200) =>
  vi.fn((url: string) => {
    asked.push(url)
    return Promise.resolve(new Response(JSON.stringify(body), { status }))
  })

const asked: string[] = []

beforeEach(() => {
  asked.length = 0
  vi.stubGlobal('chrome', {
    storage: { local: { get: vi.fn(() => Promise.resolve({ captureToken: 'test-token' })) } },
  })
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('fetchClipStatus', () => {
  it('reports the state and the clip link the service returned', async () => {
    const fetchMock = answer({
      data: {
        captured: true,
        captured_at: '2026-07-28T10:12:04+02:00',
        state: 'ingested',
        clip_url: 'https://github.com/<owner>/<clips-repo>/tree/main/clips/processed/x',
      },
    })
    vi.stubGlobal('fetch', fetchMock)

    expect(await fetchClipStatus('https://example.com/a')).toStrictEqual({
      state: 'ingested',
      capturedAt: '2026-07-28T10:12:04+02:00',
      clipUrl: 'https://github.com/<owner>/<clips-repo>/tree/main/clips/processed/x',
    })
    expect(asked[0]).toContain('url=https%3A%2F%2Fexample.com%2Fa')
  })

  it('reports a URL the service has never seen as absent', async () => {
    vi.stubGlobal(
      'fetch',
      answer({ data: { captured: false, captured_at: null, state: null, clip_url: null } }),
    )
    expect(await fetchClipStatus('https://example.com/a')).toStrictEqual({
      state: 'absent',
      capturedAt: null,
      clipUrl: null,
    })
  })

  it('reads a refused token as absent, never as a captured page', async () => {
    vi.stubGlobal('fetch', answer({ error: { code: 'UNAUTHORIZED' } }, 401))
    expect((await fetchClipStatus('https://example.com/a')).state).toBe('absent')
  })

  it('reads a service that is unreachable as absent', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('ECONNREFUSED'))),
    )
    expect((await fetchClipStatus('https://example.com/a')).state).toBe('absent')
  })

  it('asks nothing at all without a token', async () => {
    vi.stubGlobal('chrome', {
      storage: { local: { get: vi.fn(() => Promise.resolve({})) } },
    })
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    expect((await fetchClipStatus('https://example.com/a')).state).toBe('absent')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('reads a malformed answer as absent rather than trusting it', async () => {
    vi.stubGlobal('fetch', answer({ data: { captured: true } }))
    expect((await fetchClipStatus('https://example.com/a')).state).toBe('absent')
  })
})
