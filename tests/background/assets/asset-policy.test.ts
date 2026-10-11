import { vetAssetUrl } from '../../../src/background/assets/vet-asset-url'
import { fetchVettedAsset } from '../../../src/background/assets/fetch-vetted-asset'
import { fetchImageAsset } from '../../../src/background/assets/fetch-image-asset'

test.each([
  'http://cdn.example.com/a.png',
  'ftp://cdn.example.com/a.png',
  'data:image/png;base64,AAAA',
  'https://cdn.example.com:8443/a.png',
  'https://user:pass@cdn.example.com/a.png',
  'https://localhost/a.png',
  'https://printer.local/a.png',
  'https://127.0.0.1/a.png',
  'https://2130706433/a.png', // 127.0.0.1 in decimal
  'https://0x7f.1/a.png',
  'https://0.0.0.0/a.png',
  'https://10.1.2.3/a.png',
  'https://172.20.0.1/a.png',
  'https://192.168.0.10/a.png',
  'https://169.254.169.254/latest/meta-data',
  'https://[::1]/a.png',
  'https://[fe80::1]/a.png',
  'https://[fd00::1]/a.png',
  'https://[::ffff:127.0.0.1]/a.png',
  'https://[::ffff:169.254.169.254]/a.png',
])('refuses %s', (url) => {
  expect(vetAssetUrl(url).ok).toBe(false)
})

test('accepts a public https URL on the default port, explicit or not', () => {
  expect(vetAssetUrl('https://cdn.example.com/a.png').ok).toBe(true)
  expect(vetAssetUrl('https://cdn.example.com:443/a.png').ok).toBe(true)
  expect(vetAssetUrl('https://[2606:4700::1111]/a.png').ok).toBe(true)
})

test('resolves a relative candidate against its base before vetting', () => {
  const vetted = vetAssetUrl('/img/a.png', 'https://site.example/post')
  expect(vetted.ok && vetted.value.href).toBe('https://site.example/img/a.png')
})

function fakeFetch(routes: Record<string, () => Response>) {
  const seen: Array<{ url: string; init?: RequestInit }> = []
  const impl = vi.fn(async (url: string | URL | Request, init?: RequestInit) => {
    seen.push({ url: String(url), init })
    const route = routes[String(url)]
    if (!route) throw new TypeError('network error')
    return route()
  }) as unknown as typeof fetch
  return { impl, seen }
}

test('fetches without cookies and without following redirects blindly', async () => {
  const { impl, seen } = fakeFetch({ 'https://cdn.example.com/a.png': () => new Response('png') })
  const result = await fetchVettedAsset('https://cdn.example.com/a.png', impl)
  expect(result.ok).toBe(true)
  expect(seen[0]?.init).toEqual({ credentials: 'omit', redirect: 'manual' })
})

test('a redirect to a public host is vetted and followed', async () => {
  const { impl, seen } = fakeFetch({
    'https://cdn.example.com/a.png': () =>
      new Response(null, { status: 302, headers: { location: '/b.png' } }),
    'https://cdn.example.com/b.png': () => new Response('png'),
  })
  expect((await fetchVettedAsset('https://cdn.example.com/a.png', impl)).ok).toBe(true)
  expect(seen.map((call) => call.url)).toEqual(['https://cdn.example.com/a.png', 'https://cdn.example.com/b.png'])
})

test('a redirect into the private network is refused at the hop, before any request to it', async () => {
  const { impl, seen } = fakeFetch({
    'https://cdn.example.com/a.png': () =>
      new Response(null, { status: 302, headers: { location: 'https://169.254.169.254/latest/meta-data' } }),
  })
  const result = await fetchVettedAsset('https://cdn.example.com/a.png', impl)
  expect(result).toEqual({ ok: false, reason: 'private or local host: 169.254.169.254' })
  expect(seen).toHaveLength(1)
})

test('stops after three redirects', async () => {
  const routes: Record<string, () => Response> = {}
  for (let index = 0; index < 5; index += 1) {
    routes[`https://cdn.example.com/${index}`] = () =>
      new Response(null, { status: 302, headers: { location: `/${index + 1}` } })
  }
  const { impl, seen } = fakeFetch(routes)
  expect(await fetchVettedAsset('https://cdn.example.com/0', impl)).toEqual({ ok: false, reason: 'too many redirects' })
  expect(seen).toHaveLength(4)
})

test("a redirect whose target the browser hides is not followed", async () => {
  const opaque = { type: 'opaqueredirect', status: 0, ok: false, headers: new Headers() } as unknown as Response
  const { impl } = fakeFetch({ 'https://cdn.example.com/a.png': () => opaque })
  expect(await fetchVettedAsset('https://cdn.example.com/a.png', impl)).toEqual({
    ok: false,
    reason: 'redirect target hidden by the browser, not followed',
  })
})

test('a page-proposed private URL is never requested at all', async () => {
  const { impl, seen } = fakeFetch({})
  expect((await fetchVettedAsset('https://192.168.1.1/admin.png', impl)).ok).toBe(false)
  expect(seen).toHaveLength(0)
})

test('a response that does not decode as an image is discarded', async () => {
  const { impl } = fakeFetch({ 'https://cdn.example.com/a.png': () => new Response('{"secret":1}') })
  const failing = async () => {
    throw new Error('InvalidStateError')
  }
  expect(await fetchImageAsset('https://cdn.example.com/a.png', impl, failing)).toEqual({
    ok: false,
    reason: 'does not decode as an image',
  })
  const decoding = async () => ({ close: () => undefined }) as unknown as ImageBitmap
  expect((await fetchImageAsset('https://cdn.example.com/a.png', impl, decoding)).ok).toBe(true)
})
