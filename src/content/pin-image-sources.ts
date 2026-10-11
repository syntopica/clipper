import { chooseImageSource } from './choose-image-source'
import { displayedImageByUrl } from './displayed-image-by-url'

// Rewrite every `<img src>` in the extracted HTML to the one URL chosen for
// it, before sanitising strips the lazy-loading attributes that choice may
// need. The markdown then names exactly that URL, which is what the asset step
// fetches and what it swaps for the committed file.
export function pinImageSources(html: string, doc: Document): string {
  const template = doc.createElement('template')
  template.innerHTML = html
  const displayed = displayedImageByUrl(doc)
  for (const image of template.content.querySelectorAll('img')) {
    const chosen = chooseImageSource(image, displayed, doc.baseURI)
    if (chosen !== null) image.setAttribute('src', chosen)
  }
  return template.innerHTML
}
