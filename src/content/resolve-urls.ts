// Readability absolutizes hrefs and srcs internally, but the selection,
// article, main and body extraction branches read innerHTML straight from
// the live DOM and keep them as authored. A relative link or image survives
// Turndown as-is and then renders on github.com as a link to the wrong
// place, which is worse than a broken one - resolve every href/src/srcset
// against the page's baseURI before the html reaches Turndown.
function resolveAttribute(element: Element, attribute: string, baseUri: string): void {
  const value = element.getAttribute(attribute)
  if (!value) return
  try {
    element.setAttribute(attribute, new URL(value, baseUri).toString())
  } catch {
    // Not a resolvable URL (e.g. a template placeholder) - leave it as-is.
  }
}

function resolveSrcsetCandidate(candidate: string, baseUri: string): string {
  const trimmed = candidate.trim()
  if (!trimmed) return trimmed
  const [url, ...descriptor] = trimmed.split(/\s+/)
  if (!url) return trimmed
  try {
    return [new URL(url, baseUri).toString(), ...descriptor].join(' ')
  } catch {
    return trimmed
  }
}

function resolveSrcset(element: Element, baseUri: string): void {
  const value = element.getAttribute('srcset')
  if (!value) return
  const resolved = value
    .split(',')
    .map((candidate) => resolveSrcsetCandidate(candidate, baseUri))
    .join(', ')
  element.setAttribute('srcset', resolved)
}

export function resolveUrls(html: string, baseUri: string): string {
  const container = document.createElement('div')
  container.innerHTML = html
  for (const element of container.querySelectorAll('[href], [src], [srcset]')) {
    resolveAttribute(element, 'href', baseUri)
    resolveAttribute(element, 'src', baseUri)
    resolveSrcset(element, baseUri)
  }
  return container.innerHTML
}
