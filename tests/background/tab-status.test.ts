import { afterEach, describe, expect, it, vi } from 'vitest'
import { iconPaths } from '../../src/background/icon-paths'
import { isInspectableUrl } from '../../src/background/is-inspectable-url'
import { resolveClipStatus } from '../../src/background/resolve-clip-status'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('iconPaths', () => {
  it('gives every state a full set of sizes', () => {
    expect(iconPaths('ingested')).toStrictEqual({
      16: 'icons/ingested-16.png',
      32: 'icons/ingested-32.png',
      48: 'icons/ingested-48.png',
      128: 'icons/ingested-128.png',
    })
  })

  it('paints an unclipped page with the idle tint', () => {
    expect(iconPaths('absent')[32]).toBe('icons/idle-32.png')
  })

  it('paints needs-claude the same amber as captured, because the toolbar cannot act on the difference', () => {
    expect(iconPaths('needs-claude')).toStrictEqual(iconPaths('captured'))
  })
})

describe('isInspectableUrl', () => {
  it('accepts an ordinary page', () => {
    expect(isInspectableUrl('https://example.com/a')).toBe(true)
  })

  it('refuses a denylisted host, which must not be named to the service either', () => {
    expect(isInspectableUrl('https://localhost:3000/a')).toBe(false)
    expect(isInspectableUrl('https://192.168.1.4/a')).toBe(false)
  })

  it('refuses a page that is not http', () => {
    expect(isInspectableUrl('chrome://extensions')).toBe(false)
    expect(isInspectableUrl('file:///Users/x/a.html')).toBe(false)
    expect(isInspectableUrl(undefined)).toBe(false)
  })
})

describe('resolveClipStatus', () => {
  const session = (stored: Record<string, unknown>) => ({
    storage: {
      session: {
        get: vi.fn((keys: string[]) =>
          Promise.resolve(
            Object.fromEntries(
              Object.entries(stored).filter(([key]) => keys.includes(key)),
            ),
          ),
        ),
        set: vi.fn((entry: Record<string, unknown>) => {
          Object.assign(stored, entry)
          return Promise.resolve()
        }),
      },
      local: { get: vi.fn(() => Promise.resolve({ captureToken: 'test-token' })) },
    },
  })

  it('answers from the cache without asking the service twice', async () => {
    vi.stubGlobal(
      'chrome',
      session({
        'clipStatus:https://example.com/a': {
          state: 'ingested',
          clipUrl: null,
          capturedAt: null,
        },
      }),
    )
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    expect((await resolveClipStatus('https://example.com/a')).state).toBe('ingested')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('does not cache absent, because that is also what every failure answers', async () => {
    const stored: Record<string, unknown> = {}
    vi.stubGlobal('chrome', session(stored))
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('ECONNREFUSED'))),
    )

    expect((await resolveClipStatus('https://example.com/a')).state).toBe('absent')
    expect(Object.keys(stored)).toHaveLength(0)
  })

  it('caches a real answer', async () => {
    const stored: Record<string, unknown> = {}
    vi.stubGlobal('chrome', session(stored))
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              data: {
                captured: true,
                captured_at: null,
                state: 'captured',
                clip_url: null,
              },
            }),
          ),
        ),
      ),
    )

    await resolveClipStatus('https://example.com/a')
    expect(stored['clipStatus:https://example.com/a']).toStrictEqual({
      state: 'captured',
      clipUrl: null,
      capturedAt: null,
    })
  })
})
