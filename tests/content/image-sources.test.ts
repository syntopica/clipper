import { buildCapturedPayload } from '../../src/content/build-captured-payload'
import { chooseImageSource } from '../../src/content/choose-image-source'
import { imageUrlsInHtml } from '../../src/content/image-urls-in-html'
import { largestSrcsetCandidate } from '../../src/content/largest-srcset-candidate'
import { pinImageSources } from '../../src/content/pin-image-sources'

const BASE = 'https://site.example/post/'

function image(html: string): Element {
  const template = document.createElement('template')
  template.innerHTML = html
  return template.content.querySelector('img')!
}

test('the largest srcset candidate wins, by width or by density', () => {
  expect(largestSrcsetCandidate('a-400.jpg 400w, a-1200.jpg 1200w, a-800.jpg 800w', BASE)).toBe(
    'https://site.example/post/a-1200.jpg',
  )
  expect(largestSrcsetCandidate('/a.jpg, /a@2x.jpg 2x', BASE)).toBe('https://site.example/a@2x.jpg')
  expect(largestSrcsetCandidate('', BASE)).toBeNull()
})

test('what the browser displayed comes first, then src', () => {
  const displayed = new Map([['https://site.example/small.jpg', 'https://site.example/large.jpg']])
  expect(chooseImageSource(image('<img src="/small.jpg" srcset="/large.jpg 2x">'), displayed, BASE)).toBe(
    'https://site.example/large.jpg',
  )
  expect(chooseImageSource(image('<img src="/small.jpg">'), new Map(), BASE)).toBe('https://site.example/small.jpg')
})

test('a placeholder src gives way to the lazy-loading attribute, then to srcset and <picture>', () => {
  const placeholder = 'data:image/gif;base64,R0lGODlhAQABAAAAACw='
  expect(chooseImageSource(image(`<img src="${placeholder}" data-src="/real.jpg">`), new Map(), BASE)).toBe(
    'https://site.example/real.jpg',
  )
  expect(chooseImageSource(image('<img data-srcset="/a.jpg 1x, /b.jpg 2x">'), new Map(), BASE)).toBe(
    'https://site.example/b.jpg',
  )
  expect(
    chooseImageSource(
      image('<picture><source srcset="/p.avif 1x, /p@2x.avif 2x"><img alt="x"></picture>'),
      new Map(),
      BASE,
    ),
  ).toBe('https://site.example/p@2x.avif')
  expect(chooseImageSource(image(`<img src="${placeholder}">`), new Map(), BASE)).toBeNull()
})

test('the extracted HTML is rewritten to the chosen URL, from the live page where it can', () => {
  const doc = document.implementation.createHTMLDocument('')
  doc.body.innerHTML = '<img src="https://cdn.example/a.jpg">'
  Object.defineProperty(doc.images[0], 'currentSrc', { value: 'https://cdn.example/a-2x.jpg' })
  const pinned = pinImageSources('<p><img src="https://cdn.example/a.jpg"><img data-src="https://cdn.example/b.jpg"></p>', doc)
  expect(imageUrlsInHtml(pinned)).toEqual(['https://cdn.example/a-2x.jpg', 'https://cdn.example/b.jpg'])
})

test('only web URLs are proposed, each once', () => {
  expect(
    imageUrlsInHtml('<img src="https://a.example/1.png"><img src="data:image/png;base64,AAAA"><img src="https://a.example/1.png">'),
  ).toEqual(['https://a.example/1.png'])
})

test('the payload proposes the images the markdown references, as written there', async () => {
  const doc = new DOMParser().parseFromString(
    '<html lang="en"><body><article><p>short</p><img src="/a.png" alt="A"><img src="data:image/gif;base64,R0lGODlh" data-src="/b.png" alt="B"></article></body></html>',
    'text/html',
  )
  Object.defineProperty(doc, 'baseURI', { value: 'https://example.com/blog/post', configurable: true })

  const payload = await buildCapturedPayload(doc, window, 'https://example.com/blog/post')

  expect(payload.imageUrls).toEqual(['https://example.com/a.png', 'https://example.com/b.png'])
  for (const url of payload.imageUrls) expect(payload.markdown).toContain(`](${url})`)
})
