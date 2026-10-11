import { installChromeMock, type ChromeMock } from '../../chrome-mock'
import { collectClipAssets } from '../../../src/background/assets/collect-clip-assets'
import { fetchClipAsset } from '../../../src/background/assets/fetch-clip-asset'
import type { ImageProcessors } from '../../../src/background/assets/image-processors'
import { imagesEnabled } from '../../../src/background/assets/images-enabled'
import { prepareImageAsset } from '../../../src/background/assets/prepare-image-asset'
import { sniffImageKind } from '../../../src/background/assets/sniff-image-kind'
import { LIMITS } from '../../../src/shared/limits'

function png(width: number, height: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(33)
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52])
  const view = new DataView(bytes.buffer)
  view.setUint32(16, width)
  view.setUint32(20, height)
  return bytes
}

function gif(width: number, height: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(13)
  bytes.set(new TextEncoder().encode('GIF89a'))
  const view = new DataView(bytes.buffer)
  view.setUint16(6, width, true)
  view.setUint16(8, height, true)
  return bytes
}

function jpeg(width: number, height: number): Uint8Array<ArrayBuffer> {
  // SOI, an APP0 segment to walk past, then SOF0 with the size.
  const bytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 4, 0, 0, 0xff, 0xc0, 0, 11, 8, 0, 0, 0, 0, 1, 1, 0x11, 0])
  const view = new DataView(bytes.buffer)
  view.setUint16(13, height)
  view.setUint16(15, width)
  return bytes
}

const PNG = png(64, 48)
const GIF = gif(64, 48)
const JPEG = jpeg(64, 48)

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
  expect(await prepareImageAsset(new Blob([PNG]), refusing)).toEqual({
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

test.each([
  ['PNG', png(20_000, 20_000)],
  ['GIF', gif(65_535, 65_535)],
  ['JPEG', jpeg(60_000, 60_000)],
])('a %s whose header declares too many pixels is refused before any decode', async (_name, bytes) => {
  const decode = vi.fn()
  const reencode = vi.fn()
  const prepared = await prepareImageAsset(new Blob([bytes]), processors({ decode, reencode }))
  expect(prepared.ok).toBe(false)
  expect(!prepared.ok && prepared.reason).toMatch(/exceeds 24000000 pixels/)
  expect(decode).not.toHaveBeenCalled()
  expect(reencode).not.toHaveBeenCalled()
})

test('a format whose size cannot be read from its header is never decoded', async () => {
  const reencode = vi.fn()
  const prepared = await prepareImageAsset(new Blob(['BM not really a bitmap']), processors({ reencode }))
  expect(prepared.ok).toBe(false)
  expect(reencode).not.toHaveBeenCalled()
})

test('WebP and AVIF headers are sized too', async () => {
  const { readImageDimensions } = await import('../../../src/background/assets/read-image-dimensions')
  const vp8x = new Uint8Array(30)
  vp8x.set(new TextEncoder().encode('RIFF\0\0\0\0WEBPVP8X'))
  vp8x.set([0xff, 0x3f, 0, 0x7f, 0x1f, 0], 24)
  expect(readImageDimensions(vp8x, 'webp')).toEqual({ width: 16384, height: 8064 })
  const avif = new Uint8Array(40)
  avif.set(new TextEncoder().encode('ftypavif'), 4)
  avif.set(new TextEncoder().encode('ispe'), 20)
  new DataView(avif.buffer).setUint32(28, 9000)
  new DataView(avif.buffer).setUint32(32, 9000)
  expect(readImageDimensions(avif, 'avif')).toEqual({ width: 9000, height: 9000 })
})

test('a body over the byte cap is refused while it streams, whatever Content-Length says', async () => {
  const { readCappedBody } = await import('../../../src/background/assets/read-capped-body')
  let pulled = 0
  const endless = new ReadableStream<Uint8Array>({
    pull(controller) {
      pulled += 1
      controller.enqueue(new Uint8Array(1_000))
    },
  })
  const result = await readCappedBody(new Response(endless, { headers: { 'content-length': '10' } }), 5_000)
  expect(result).toEqual({ ok: false, reason: 'larger than 5000 bytes' })
  expect(pulled).toBeLessThan(10)

  const declared = await readCappedBody(new Response('x', { headers: { 'content-length': '999999' } }), 5_000)
  expect(declared).toEqual({ ok: false, reason: 'larger than 5000 bytes' })
})
