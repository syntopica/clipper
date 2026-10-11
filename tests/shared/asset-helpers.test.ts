import { bytesToBase64 } from '../../src/shared/bytes-to-base64'
import { mapWithConcurrency } from '../../src/shared/map-with-concurrency'
import { rewriteImageReferences } from '../../src/shared/rewrite-image-references'

test('an image reference is pointed at its committed file, a link to the same URL is not', () => {
  const markdown = '![a](https://cdn.example/a.png)\n\n[full size](https://cdn.example/a.png)\n\n![b](https://cdn.example/b.png "B")'
  const paths = new Map([
    ['https://cdn.example/a.png', 'assets/01-aaaaaaaa.webp'],
    ['https://cdn.example/b.png', 'assets/02-bbbbbbbb.webp'],
  ])
  expect(rewriteImageReferences(markdown, paths)).toBe(
    '![a](assets/01-aaaaaaaa.webp)\n\n[full size](https://cdn.example/a.png)\n\n![b](assets/02-bbbbbbbb.webp "B")',
  )
})

test('a URL with parentheses and regex metacharacters is matched literally', () => {
  const url = 'https://upload.example/Foo_(bar).jpg?w=1+2'
  const markdown = `![x](${url}) and ![y](https://upload.example/Foo_(bar)Xjpg?w=1+2)`
  expect(rewriteImageReferences(markdown, new Map([[url, 'assets/01-x.webp']]))).toBe(
    '![x](assets/01-x.webp) and ![y](https://upload.example/Foo_(bar)Xjpg?w=1+2)',
  )
})

test('a URL that only prefixes another is not rewritten inside it', () => {
  const markdown = '![x](https://cdn.example/a.png?w=2)'
  expect(rewriteImageReferences(markdown, new Map([['https://cdn.example/a.png', 'assets/01-x.webp']]))).toBe(markdown)
})

test('binary content becomes base64, megabytes included', () => {
  expect(bytesToBase64(new Uint8Array([0, 255, 128]).buffer)).toBe('AP+A')
  const large = new Uint8Array(1_000_000).fill(7)
  expect(atob(bytesToBase64(large.buffer))).toHaveLength(1_000_000)
})

test('at most `limit` tasks run at once, and results keep input order', async () => {
  let inFlight = 0
  let maxInFlight = 0
  const results = await mapWithConcurrency([5, 1, 4, 2, 3, 0], 4, async (value) => {
    inFlight += 1
    maxInFlight = Math.max(maxInFlight, inFlight)
    await new Promise((resolve) => setTimeout(resolve, value))
    inFlight -= 1
    return value * 10
  })
  expect(results).toEqual([50, 10, 40, 20, 30, 0])
  expect(maxInFlight).toBe(4)
})
