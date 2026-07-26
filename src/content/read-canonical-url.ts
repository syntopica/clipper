// A relative rel="canonical" href is common and page-controlled. Resolving it
// against the page url (rather than passing it straight to a URL schema that
// requires an absolute string) keeps a relative canonical from discarding the
// whole capture; anything that still fails to parse degrades to null.
export function readCanonicalUrl(doc: Document, url: string): string | null {
  const href = doc.querySelector('link[rel="canonical"]')?.getAttribute('href')
  if (!href) return null
  try {
    return new URL(href, url).toString()
  } catch {
    return null
  }
}
