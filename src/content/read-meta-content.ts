export function readMetaContent(doc: Document, selector: string): string | null {
  return doc.querySelector(selector)?.getAttribute('content')?.trim() || null
}
