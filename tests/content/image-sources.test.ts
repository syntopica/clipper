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
  const displayed = new Map([['//site.example/small.jpg', 'https://site.example/large.jpg']])
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

// Wikipedia as served in 2026: protocol-relative thumbnails, and an RDFa
// `resource` naming the File: page that Defuddle's lazy-image rule copies into
// `src` because it ends in `.jpg`.
function wikipediaDoc(): Document {
  const thumb = '//upload.wikimedia.org/wikipedia/commons/thumb/9/94/Wanzijia.jpg'
  const doc = new DOMParser().parseFromString(
    `<html lang="en"><head><base href="https://en.wikipedia.org/wiki/Paper_clip"><title>Paper clip - Wikipedia</title></head><body>
    <div id="mw-content-text"><div class="mw-parser-output">
    <p>${'A paper clip holds sheets of paper together by pressure. '.repeat(12)}</p>
    <figure class="mw-default-size" typeof="mw:File/Thumb"><a href="/wiki/File:Wanzijia.jpg" class="mw-file-description"><img resource="https://en.wikipedia.org/wiki/File:Wanzijia.jpg" src="${thumb}/500px-Wanzijia.jpg?utm_source=en.wikipedia.org&amp;utm_content=thumbnail" decoding="async" loading="lazy" srcset="${thumb}/960px-Wanzijia.jpg?utm_source=en.wikipedia.org&amp;utm_content=thumbnail 2x" width="340" height="295" class="mw-file-element"></a><figcaption>Paper clips coated in plastic</figcaption></figure>
    <p>${'Its history begins with bent steel wire. '.repeat(12)}</p></div></div></body></html>`,
    'text/html',
  )
  Object.defineProperty(doc, 'baseURI', { value: 'https://en.wikipedia.org/wiki/Paper_clip', configurable: true })
  return doc
}

test('a Wikipedia figure is clipped as its upload image, not as the File: page its link and resource name', async () => {
  const doc = wikipediaDoc()
  const payload = await buildCapturedPayload(doc, window, 'https://en.wikipedia.org/wiki/Paper_clip')

  const expected = 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Wanzijia.jpg/500px-Wanzijia.jpg?utm_source=en.wikipedia.org&utm_content=thumbnail'
  expect(payload.imageUrls).toEqual([expected])
  expect(payload.markdown).toContain(`](${expected})`)
  expect(payload.markdown).not.toMatch(/!\[[^\]]*\]\([^)]*File:/)
})

test('a copy whose src the extractor replaced is matched to the live image by its srcset', () => {
  const doc = wikipediaDoc()
  const extracted =
    '<img src="https://en.wikipedia.org/wiki/File:Wanzijia.jpg" srcset="http://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Wanzijia.jpg/960px-Wanzijia.jpg?utm_source=en.wikipedia.org&amp;utm_content=thumbnail 2x">'
  expect(imageUrlsInHtml(pinImageSources(extracted, doc))).toEqual([
    'https://upload.wikimedia.org/wikipedia/commons/thumb/9/94/Wanzijia.jpg/500px-Wanzijia.jpg?utm_source=en.wikipedia.org&utm_content=thumbnail',
  ])
})

test('a protocol-relative src resolves to https on an https page', () => {
  expect(chooseImageSource(image('<img src="//upload.wikimedia.org/a.png">'), new Map(), 'https://en.wikipedia.org/wiki/X')).toBe(
    'https://upload.wikimedia.org/a.png',
  )
})
