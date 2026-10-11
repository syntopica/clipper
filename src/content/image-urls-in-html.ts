import { isWebUrl } from './is-web-url'

// The web image URLs the markdown will reference, in order and without
// repeats: Turndown writes each `<img>` as its `src` attribute verbatim, so
// reading the same attribute from the same HTML yields the same strings.
export function imageUrlsInHtml(html: string): string[] {
  const template = document.createElement('template')
  template.innerHTML = html
  const urls = [...template.content.querySelectorAll('img')]
    .map((image) => image.getAttribute('src') ?? '')
    .filter(isWebUrl)
  return [...new Set(urls)]
}
