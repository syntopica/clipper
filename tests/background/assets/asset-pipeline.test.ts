import { installChromeMock, type ChromeMock } from '../../chrome-mock'
import { collectClipAssets } from '../../../src/background/assets/collect-clip-assets'
import { fetchClipAsset } from '../../../src/background/assets/fetch-clip-asset'
import type { ImageProcessors } from '../../../src/background/assets/image-processors'
import { imagesEnabled } from '../../../src/background/assets/images-enabled'
import { prepareImageAsset } from '../../../src/background/assets/prepare-image-asset'
import { sniffImageKind } from '../../../src/background/assets/sniff-image-kind'
import { LIMITS } from '../../../src/shared/limits'

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4])
const GIF = new Uint8Array([...new TextEncoder().encode('GIF89a'), 1, 2, 3])
const JPEG = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])

function processors(overrides: Partial<ImageProcessors> = {}): ImageProcessors {
  return {
    decode: async () => ({ close: () => undefined }) as ImageBitmap,
    reencode: async () => ({ blob: new Blob([new Uint8Array(4)], { type: 'image/webp' }), resized: false }),
    sanitizeSvg: async (svg) => svg.replace(/<script.*<\/script>/, ''),
    ...overrides,
  }
}

const bytesOf = (value: ArrayBuffer) => [...new Uint8Array(value)]

let chromeMock: ChromeMock
beforeEach(() => {
  chromeMock = installChromeMock()
})

test.each([
  [PNG, '', 'png'],
  [GIF, 'image/png', 'gif'],
  [JPEG, 'image/webp', 'jpeg'],
  [new Uint8Array([...new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8 ')]), '', 'webp'],
  [new Uint8Array([0, 0, 0, 0x1c, ...new TextEncoder().encode('ftypavif')]), '', 'avif'],
  [new TextEncoder().encode('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg"/>'), 'text/plain', 'svg'],
  [new TextEncoder().encode('{"a":1}'), 'image/svg+xml', 'svg'],
  [new TextEncoder().encode('{"a":1}'), 'application/json', 'other'],
])('the bytes, not the declared type, name the format (%#)', (bytes, type, kind) => {
  expect(sniffImageKind(bytes.buffer as ArrayBuffer, type)).toBe(kind)
})

test('a raster image is re-encoded as WebP when that is smaller', async () => {
  const prepared = await prepareImageAsset(new Blob([PNG]), processors())
  expect(prepared).toMatchObject({ ok: true, value: { extension: 'webp' } })
})

test('the original bytes are kept when the re-encode is larger and nothing was resized', async () => {
  const larger = processors({ reencode: async () => ({ blob: new Blob([new Uint8Array(100)]), resized: false }) })
  const prepared = await prepareImageAsset(new Blob([JPEG]), larger)
  expect(prepared.ok && prepared.value.extension).toBe('jpg')
  expect(prepared.ok && bytesOf(prepared.value.bytes)).toEqual([...JPEG])
})

test('a resized image is stored as WebP even when the bytes grew', async () => {
  const resized = processors({ reencode: async () => ({ blob: new Blob([new Uint8Array(100)]), resized: true }) })
  const prepared = await prepareImageAsset(new Blob([JPEG]), resized)
  expect(prepared.ok && prepared.value.extension).toBe('webp')
})

test('bytes that do not decode are refused', async () => {
  const refusing = processors({
    reencode: async () => {
      throw new Error('decode failed')
    },
  })
  expect(await prepareImageAsset(new Blob(['{"secret":1}']), refusing)).toEqual({
    ok: false,
    reason: 'does not decode as an image',
  })
})

test('a GIF is stored as it came, so its animation survives', async () => {
  const reencode = vi.fn()
  const prepared = await prepareImageAsset(new Blob([GIF]), processors({ reencode }))
  expect(prepared.ok && prepared.value.extension).toBe('gif')
  expect(prepared.ok && bytesOf(prepared.value.bytes)).toEqual([...GIF])
  expect(reencode).not.toHaveBeenCalled()
})

test('an SVG is sanitised and stored; one that is not an SVG document is refused', async () => {
  const svg = '<svg xmlns="http://www.w3.org/2000/svg"><script>x</script><rect/></svg>'
  const prepared = await prepareImageAsset(new Blob([svg], { type: 'image/svg+xml' }), processors())
  expect(prepared.ok && prepared.value.extension).toBe('svg')
  expect(prepared.ok && new TextDecoder().decode(prepared.value.bytes)).not.toContain('script')

  const rejected = await prepareImageAsset(
    new Blob(['<svg>'], { type: 'image/svg+xml' }),
    processors({ sanitizeSvg: async () => null }),
  )
  expect(rejected).toEqual({ ok: false, reason: 'not an SVG document' })
})

test('an image still over the blob cap after compression keeps its remote URL', async () => {
  const huge = processors({
    reencode: async () => ({ blob: new Blob([new Uint8Array(LIMITS.MAX_GIT_BLOB_BYTES + 1)]), resized: true }),
  })
  const prepared = await prepareImageAsset(new Blob([PNG]), huge)
  expect(prepared.ok).toBe(false)
})

test('an origin without host permission is not fetched', async () => {
  const fetchImpl = vi.fn()
  const result = await fetchClipAsset('https://cdn.example/a.png', fetchImpl, async () => false, processors())
  expect(result).toEqual({ ok: false, reason: 'no host permission for https://cdn.example' })
  expect(fetchImpl).not.toHaveBeenCalled()
})

test('the URL policy runs before the permission check and the fetch', async () => {
  const fetchImpl = vi.fn()
  const result = await fetchClipAsset('https://169.254.169.254/latest', fetchImpl, async () => true, processors())
  expect(result.ok).toBe(false)
  expect(fetchImpl).not.toHaveBeenCalled()
})

test('a redirect the browser hides is refused, not followed', async () => {
  const opaque = { type: 'opaqueredirect', status: 0, ok: false, headers: new Headers() } as unknown as Response
  const result = await fetchClipAsset('https://cdn.example/a.png', async () => opaque, async () => true, processors())
  expect(result).toEqual({ ok: false, reason: 'redirect target hidden by the browser, not followed' })
})

test('a fetched image goes through without credentials and comes out prepared', async () => {
  const fetchImpl = vi.fn(async () => new Response(PNG, { status: 200, headers: { 'content-type': 'image/png' } }))
  const result = await fetchClipAsset('https://cdn.example/a.png', fetchImpl, async () => true, processors())
  expect(result).toMatchObject({ ok: true, value: { extension: 'webp' } })
  expect(fetchImpl).toHaveBeenCalledWith(
    'https://cdn.example/a.png',
    expect.objectContaining({ credentials: 'omit', redirect: 'manual', signal: expect.any(AbortSignal) }),
  )
})

test('an unexpected error in one image becomes its reason instead of failing the clip', async () => {
  const fetchImpl = async () =>
    new Response('<svg xmlns="http://www.w3.org/2000/svg"/>', { status: 200, headers: { 'content-type': 'image/svg+xml' } })
  const broken = processors({
    sanitizeSvg: async () => {
      throw new Error('offscreen document unavailable')
    },
  })
  expect(await fetchClipAsset('https://cdn.example/a.svg', fetchImpl, async () => true, broken)).toEqual({
    ok: false,
    reason: 'offscreen document unavailable',
  })
})

test('assets are deduplicated by URL, then by content, numbered in page order, failures kept with their URL', async () => {
  const fetched: string[] = []
  const bytesFor: Record<string, number[]> = {
    'https://a.example/1.png': [1],
    'https://b.example/same-as-1.png': [1],
    'https://a.example/2.png': [2],
  }
  const assets = await collectClipAssets(
    ['https://a.example/1.png', 'https://a.example/1.png', 'https://bad.example/x.png', 'https://b.example/same-as-1.png', 'https://a.example/2.png'],
    async (url) => {
      fetched.push(url)
      const bytes = bytesFor[url]
      if (bytes === undefined) return { ok: false, reason: 'HTTP 404' }
      return { ok: true, value: { bytes: new Uint8Array(bytes).buffer, extension: 'webp' } }
    },
  )
  expect(fetched).toHaveLength(4)
  expect(assets.files.map((file) => file.urls)).toEqual([
    ['https://a.example/1.png', 'https://b.example/same-as-1.png'],
    ['https://a.example/2.png'],
  ])
  expect(assets.files.map((file) => file.fileName)).toEqual([
    expect.stringMatching(/^01-[0-9a-f]{8}\.webp$/),
    expect.stringMatching(/^02-[0-9a-f]{8}\.webp$/),
  ])
  expect(assets.failures).toEqual(['https://bad.example/x.png: HTTP 404'])
})

test('at most 30 images are fetched, four at a time, and the rest are recorded', async () => {
  const urls = Array.from({ length: 33 }, (_, index) => `https://cdn.example/${index}.png`)
  let inFlight = 0
  let maxInFlight = 0
  const assets = await collectClipAssets(urls, async (url) => {
    inFlight += 1
    maxInFlight = Math.max(maxInFlight, inFlight)
    await new Promise((resolve) => setTimeout(resolve, 1))
    inFlight -= 1
    return { ok: true, value: { bytes: new TextEncoder().encode(url).buffer as ArrayBuffer, extension: 'webp' } }
  })
  expect(assets.files).toHaveLength(30)
  expect(maxInFlight).toBe(4)
  expect(assets.failures).toEqual([
    'https://cdn.example/30.png: over the limit of 30 images per clip',
    'https://cdn.example/31.png: over the limit of 30 images per clip',
    'https://cdn.example/32.png: over the limit of 30 images per clip',
  ])
})

test('images stop being stored once the per-clip byte budget is spent', async () => {
  const size = 900_000
  const urls = Array.from({ length: 15 }, (_, index) => `https://cdn.example/${index}.png`)
  const assets = await collectClipAssets(urls, async (url) => {
    const bytes = new Uint8Array(size)
    bytes[0] = Number(url.match(/(\d+)\.png/)?.[1])
    return { ok: true, value: { bytes: bytes.buffer, extension: 'webp' } }
  })
  expect(assets.files).toHaveLength(Math.floor(LIMITS.MAX_ASSET_BYTES / size))
  expect(assets.failures.at(-1)).toMatch(/^https:\/\/cdn\.example\/14\.png: over the 12000000-byte image budget/)
})

test('images are on only while the option is set and the host access is still granted', async () => {
  expect(await imagesEnabled()).toBe(false)
  chromeMock.local.data.downloadImages = true
  expect(await imagesEnabled()).toBe(false)
  chromeMock.grantedOrigins.add('https://*/*')
  expect(await imagesEnabled()).toBe(true)
})
